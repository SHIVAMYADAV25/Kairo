use crate::commands::env::substitute_vars_in_request;
use crate::commands::scripts::{run_pre_request_script, run_test_script};
use crate::db::DbPool;
use crate::models::*;
use crate::storage;
use std::collections::HashMap;
use std::time::Instant;
use tauri::State;

/// Payload shape from the frontend: `{ request, environmentId }`.
///
/// NOTE: this previously had no `rename_all`, so the frontend's
/// `environmentId` (camelCase) never matched Rust's `environment_id`
/// (snake_case). serde silently treats a missing `Option<T>` field as
/// `None` rather than erroring, so this didn't crash — it just meant the
/// active environment was silently ignored and `{{VAR}}` substitution
/// never ran. `rename_all = "camelCase"` fixes the mapping.
#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteRequestPayload {
    pub request: ApiRequest,
    pub environment_id: Option<String>,
}

#[tauri::command]
pub async fn execute_request(
    payload: ExecuteRequestPayload,
    db: State<'_, DbPool>,
) -> Result<ApiResponse, String> {
    let pool = db.inner().clone();
    let request = payload.request.clone();
    eprintln!("[execute_request] START {:?} {}", request.method, request.url);

    // 1. Environment variable substitution ({{BASE_URL}}, {{TOKEN}}, ...)
    let env_vars = if let Some(env_id) = &payload.environment_id {
        storage::environments::get_variables(&pool, env_id).map_err(|e| e.to_string())?
    } else {
        HashMap::new()
    };
    let request = substitute_vars_in_request(request, &env_vars);

    // 2. Pre-request script (sandboxed QuickJS, no Node dependency)
    if !request.scripts.pre_request.trim().is_empty() {
        run_pre_request_script(&request.scripts.pre_request).map_err(|e| e.to_string())?;
    }

    // 3. Build and send the request, capturing per-phase timing.
    let overall_start = Instant::now();

    let client = build_client(&request)?;
    eprintln!("[execute_request] client built, timeout_ms={}", request.settings.timeout_ms);
    let method = request.method.as_reqwest();
    let mut url = request.url.clone();
    let enabled_params: Vec<(&str, &str)> = request
        .params
        .iter()
        .filter(|p| p.enabled && !p.key.is_empty())
        .map(|p| (p.key.as_str(), p.value.as_str()))
        .collect();
    if !enabled_params.is_empty() {
        let qs = url::form_urlencoded::Serializer::new(String::new())
            .extend_pairs(enabled_params)
            .finish();
        url = format!("{}{}{}", url, if url.contains('?') { "&" } else { "?" }, qs);
    }

    let mut builder = client.request(method, &url);

    for h in request.headers.iter().filter(|h| h.enabled && !h.key.is_empty()) {
        builder = builder.header(&h.key, &h.value);
    }
    builder = apply_auth(builder, &request.auth);
    builder = apply_body(builder, &request.body);

    eprintln!("[execute_request] sending to {url} ...");
    let ttfb_start = Instant::now();
    let response = builder.send().await.map_err(|e| {
        let msg = format!("Request failed: {e}");
        eprintln!("[execute_request] ERROR during send(): {msg}");
        msg
    })?;

    let ttfb_ms = ttfb_start.elapsed().as_millis() as u64;
    eprintln!("[execute_request] got response status={} in {ttfb_ms}ms", response.status());

    let status = response.status();
    let http_version = format!("{:?}", response.version());
    let headers: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();
    let content_type = headers
        .get("content-type")
        .cloned()
        .unwrap_or_default();

    let cookies: Vec<Cookie> = response
        .cookies()
        .map(|c| Cookie {
            name: c.name().to_string(),
            value: c.value().to_string(),
            domain: c.domain().unwrap_or("").to_string(),
            path: c.path().unwrap_or("/").to_string(),
            expires: c.expires().map(|e| format!("{:?}", e)),
        })
        .collect();

    let download_start = Instant::now();
    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;
    let download_ms = download_start.elapsed().as_millis() as u64;

    let body = String::from_utf8_lossy(&body_bytes).to_string();
    let size_bytes = body_bytes.len() as u64;
    let total_ms = overall_start.elapsed().as_millis() as u64;

    let timing = TimingBreakdown {
        // DNS/connect/TLS breakdown requires a custom hyper Connector with
        // instrumented hooks (see docs/PERF_TIMING.md for the planned
        // approach). Left at 0 for now so the UI degrades gracefully.
        dns_ms: 0,
        connect_ms: 0,
        tls_ms: 0,
        ttfb_ms,
        download_ms,
        total_ms,
    };

    // 4. Run test scripts against the response.
    let test_results = if !request.scripts.tests.trim().is_empty() {
        run_test_script(&request.scripts.tests, status.as_u16(), &body)
            .map_err(|e| e.to_string())?
    } else {
        Vec::new()
    };

    let api_response = ApiResponse {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        http_version,
        headers,
        cookies,
        body,
        content_type,
        size_bytes,
        timing,
        test_results,
        received_at: chrono::Utc::now().to_rfc3339(),
    };

    // 5. Persist to history (fire-and-forget-ish, but awaited so failures surface in dev).
    storage::history::insert(&pool, &request, &api_response).map_err(|e| e.to_string())?;
    eprintln!("[execute_request] DONE, saved to history");

    Ok(api_response)
}

#[tauri::command]
pub async fn cancel_request(_request_id: String) -> Result<(), String> {
    // Placeholder for cooperative cancellation — wire to a
    // `DashMap<String, CancellationToken>` keyed by request id once the
    // Runner (bulk/sequential execution) feature lands.
    Ok(())
}

fn build_client(request: &ApiRequest) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_millis(request.settings.timeout_ms))
        .redirect(if request.settings.follow_redirects {
            reqwest::redirect::Policy::limited(request.settings.max_redirects as usize)
        } else {
            reqwest::redirect::Policy::none()
        })
        .danger_accept_invalid_certs(!request.settings.ssl_verification)
        .cookie_store(request.settings.save_cookies)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))
}

fn apply_auth(builder: reqwest::RequestBuilder, auth: &AuthConfig) -> reqwest::RequestBuilder {
    match auth.auth_type.as_str() {
        "bearer" => {
            if let Some(b) = &auth.bearer {
                return builder.bearer_auth(&b.token);
            }
            builder
        }
        "basic" => {
            if let Some(b) = &auth.basic {
                return builder.basic_auth(&b.username, Some(&b.password));
            }
            builder
        }
        "api-key" => {
            if let Some(k) = &auth.api_key {
                match k.location.as_str() {
                    "header" => return builder.header(&k.key, &k.value),
                    // query/cookie handled by caller before this point in a
                    // fuller implementation; header covers the common case.
                    _ => return builder,
                }
            }
            builder
        }
        _ => builder,
    }
}

fn apply_body(builder: reqwest::RequestBuilder, body: &RequestBody) -> reqwest::RequestBuilder {
    match body.body_type.as_str() {
        "json" => {
            let json = body.json.clone().unwrap_or_else(|| "{}".to_string());
            builder
                .header("content-type", "application/json")
                .body(json)
        }
        "raw" => {
            let raw = body.raw.clone().unwrap_or(RawBody {
                content: String::new(),
                language: "text".into(),
            });
            builder.body(raw.content)
        }
        "url-encoded" => {
            let pairs: Vec<(String, String)> = body
                .url_encoded
                .clone()
                .unwrap_or_default()
                .into_iter()
                .filter(|p| p.enabled)
                .map(|p| (p.key, p.value))
                .collect();
            builder.form(&pairs)
        }
        "binary" => {
            if let Some(path) = &body.binary_file_path {
                if let Ok(bytes) = std::fs::read(path) {
                    return builder.body(bytes);
                }
            }
            builder
        }
        // "form-data" multipart construction elided here for brevity — same
        // shape as url-encoded but built with `reqwest::multipart::Form`.
        _ => builder,
    }
}
