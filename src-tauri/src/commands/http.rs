use crate::commands::env::substitute_vars_in_request;
use crate::commands::scripts::{run_pre_request_script, run_test_script};
use crate::db::DbPool;
use crate::models::*;
use crate::storage;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use tauri::State;
use tokio::sync::{oneshot, Mutex};

/// In-flight requests register a cancel sender here, keyed by the request's
/// own `id` (already unique per-tab/save on the frontend, so it doubles as
/// the request-id cancel_request expects — no extra plumbing needed).
#[derive(Default)]
pub struct RequestRegistry(Arc<Mutex<HashMap<String, oneshot::Sender<()>>>>);

/// Building a fresh `reqwest::Client` per request throws away its connection
/// pool (warm TCP/TLS sockets) and DNS cache — meaning every Send pays a
/// fresh handshake even when hitting the same host repeatedly. Requests that
/// share the same settings (timeout/redirects/SSL/cookies — the vast
/// majority) share one long-lived Client instead, keyed by that config.
#[derive(Hash, Eq, PartialEq, Clone)]
struct ClientKey {
    timeout_ms: u64,
    follow_redirects: bool,
    max_redirects: u32,
    ssl_verification: bool,
    save_cookies: bool,
}

#[derive(Default)]
pub struct ClientPool(Mutex<HashMap<ClientKey, Arc<reqwest::Client>>>);

impl ClientPool {
    async fn get_or_build(&self, request: &ApiRequest) -> Result<Arc<reqwest::Client>, String> {
        let key = ClientKey {
            timeout_ms: request.settings.timeout_ms,
            follow_redirects: request.settings.follow_redirects,
            max_redirects: request.settings.max_redirects,
            ssl_verification: request.settings.ssl_verification,
            save_cookies: request.settings.save_cookies,
        };
        let mut pool = self.0.lock().await;
        if let Some(client) = pool.get(&key) {
            return Ok(client.clone());
        }
        let client = Arc::new(build_client(request)?);
        pool.insert(key, client.clone());
        Ok(client)
    }
}

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
    registry: State<'_, RequestRegistry>,
    client_pool: State<'_, ClientPool>,
) -> Result<ApiResponse, String> {
    let pool = db.inner().clone();
    let request = payload.request.clone();
    eprintln!("[execute_request] START {:?} {}", request.method, request.url);

    // 1. Load the active environment's variables, then run the pre-request
    //    script BEFORE substitution — a script that calls
    //    `pm.environment.set("token", "...")` needs its change to actually
    //    apply to the request that follows, not run after the fact (which
    //    is the order this used to be in, silently making pre-request
    //    scripts unable to affect anything but console output).
    let mut env_vars = if let Some(env_id) = &payload.environment_id {
        storage::environments::get_variables(&pool, env_id).map_err(|e| e.to_string())?
    } else {
        HashMap::new()
    };
    let vars_before = env_vars.clone();

    if !request.scripts.pre_request.trim().is_empty() {
        run_pre_request_script(&request.scripts.pre_request, &mut env_vars)
            .map_err(|e| e.to_string())?;
    }

    // 2. `{{VAR}}` substitution using the (possibly script-updated) variables.
    let request = substitute_vars_in_request(request, &env_vars);

    // If the pre-request script changed or added any variables, persist them
    // back to the active environment so later requests (and the Environments
    // panel) see the update too — mirrors Postman's environment persistence.
    if let Some(env_id) = &payload.environment_id {
        if env_vars != vars_before {
            if let Err(e) = storage::environments::merge_variables(&pool, env_id, &env_vars) {
                eprintln!("[execute_request] failed to persist env var changes: {e}");
            }
        }
    }

    // 3. Build and send the request, capturing per-phase timing.
    let overall_start = Instant::now();

    let client = client_pool.get_or_build(&request).await?;
    eprintln!("[execute_request] client acquired (pooled), timeout_ms={}", request.settings.timeout_ms);
    let method = request.method.as_reqwest();
    let mut url = request.url.clone();
    let mut enabled_params: Vec<(String, String)> = request
        .params
        .iter()
        .filter(|p| p.enabled && !p.key.is_empty())
        .map(|p| (p.key.clone(), p.value.clone()))
        .collect();

    // API-key auth with location "query" needs to land in the URL itself,
    // not as a header — do that *before* the client.request(...) call below
    // builds off `url`, otherwise the key is silently dropped.
    let mut cookie_header: Option<String> = None;
    if request.auth.auth_type == "api-key" {
        if let Some(k) = &request.auth.api_key {
            match k.location.as_str() {
                "query" => enabled_params.push((k.key.clone(), k.value.clone())),
                "cookie" => cookie_header = Some(format!("{}={}", k.key, k.value)),
                _ => {}
            }
        }
    }

    if !enabled_params.is_empty() {
        let pairs: Vec<(&str, &str)> = enabled_params
            .iter()
            .map(|(k, v)| (k.as_str(), v.as_str()))
            .collect();
        let qs = url::form_urlencoded::Serializer::new(String::new())
            .extend_pairs(pairs)
            .finish();
        url = format!("{}{}{}", url, if url.contains('?') { "&" } else { "?" }, qs);
    }

    let mut builder = client.request(method, &url);

    for h in request.headers.iter().filter(|h| h.enabled && !h.key.is_empty()) {
        builder = builder.header(&h.key, &h.value);
    }
    if let Some(cookie) = cookie_header {
        builder = builder.header("Cookie", cookie);
    }
    builder = apply_auth(builder, &request.auth);
    builder = apply_body(builder, &request.body);

    eprintln!("[execute_request] sending to {url} ...");
    let ttfb_start = Instant::now();

    let (cancel_tx, cancel_rx) = oneshot::channel::<()>();
    registry.0.lock().await.insert(request.id.clone(), cancel_tx);

    let response = tokio::select! {
        result = builder.send() => {
            registry.0.lock().await.remove(&request.id);
            result.map_err(|e| {
                let msg = format!("Request failed: {e}");
                eprintln!("[execute_request] ERROR during send(): {msg}");
                msg
            })?
        }
        _ = cancel_rx => {
            registry.0.lock().await.remove(&request.id);
            eprintln!("[execute_request] cancelled by user");
            return Err("Request cancelled".to_string());
        }
    };

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
pub async fn cancel_request(request_id: String, registry: State<'_, RequestRegistry>) -> Result<(), String> {
    if let Some(tx) = registry.0.lock().await.remove(&request_id) {
        let _ = tx.send(()); // receiver may already be gone if the request just finished; that's fine
    }
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
                if k.location.as_str() == "header" {
                    return builder.header(&k.key, &k.value);
                }
                // query/cookie locations are applied earlier in
                // execute_request (query needs to be in the URL before the
                // request builder is created; cookie is set as a header).
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
        "form-data" => {
            let fields = body.form_data.clone().unwrap_or_default();
            let mut form = reqwest::multipart::Form::new();
            for field in fields.into_iter().filter(|f| f.enabled && !f.key.is_empty()) {
                match field.field_type.as_str() {
                    "file" => {
                        let path = std::path::Path::new(&field.value);
                        match std::fs::read(path) {
                            Ok(bytes) => {
                                let file_name = path
                                    .file_name()
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_else(|| "file".to_string());
                                let mime = guess_mime(&file_name);
                                let part = reqwest::multipart::Part::bytes(bytes)
                                    .file_name(file_name)
                                    .mime_str(mime)
                                    .unwrap_or_else(|_| reqwest::multipart::Part::bytes(Vec::new()));
                                form = form.part(field.key.clone(), part);
                            }
                            Err(e) => {
                                eprintln!(
                                    "[execute_request] form-data file '{}' for field '{}' could not be read: {e}",
                                    field.value, field.key
                                );
                            }
                        }
                    }
                    _ => {
                        form = form.text(field.key.clone(), field.value.clone());
                    }
                }
            }
            // reqwest sets the multipart/form-data content-type + boundary
            // header automatically when `.multipart()` is used.
            builder.multipart(form)
        }
        _ => builder,
    }
}

/// Minimal extension → MIME lookup so uploaded files carry a sane
/// Content-Type instead of always falling back to octet-stream. Covers the
/// common cases; anything unrecognized still uploads fine as binary data.
fn guess_mime(file_name: &str) -> &'static str {
    let ext = file_name.rsplit('.').next().unwrap_or("").to_lowercase();
    match ext.as_str() {
        "json" => "application/json",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "pdf" => "application/pdf",
        "txt" => "text/plain",
        "csv" => "text/csv",
        "html" | "htm" => "text/html",
        "xml" => "application/xml",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    }
}