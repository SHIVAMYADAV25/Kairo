use crate::db::DbPool;
use crate::models::{
    ApiKeyAuth, ApiRequest, AuthConfig, BasicAuth, BearerAuth, Collection, FormDataField,
    HttpMethod, KeyValuePair, RawBody, RequestBody, RequestSettings, ScriptsConfig,
};
use crate::storage;
use serde_json::Value;
use uuid::Uuid;

/// Walks a Postman v2.1 collection document (`item[]`, recursively) and
/// materializes it as nested Collections + saved Requests.
pub fn import(pool: &DbPool, root_name: &str, doc: &Value) -> anyhow::Result<Collection> {
    let root = storage::collections::create(pool, root_name, None)?;
    // Postman's most common auth pattern is "set it once on the collection,
    // every request inherits it" — a request only overrides this if it has
    // its own explicit non-"noauth" auth block. Track the inherited value
    // as we descend so that pattern actually survives the import.
    let root_auth = doc.get("auth");
    if let Some(items) = doc.get("item").and_then(|i| i.as_array()) {
        for item in items {
            walk_item(pool, &root.id, item, root_auth)?;
        }
    }
    Ok(root)
}

fn walk_item(pool: &DbPool, parent_id: &str, item: &Value, inherited_auth: Option<&Value>) -> anyhow::Result<()> {
    let name = item
        .get("name")
        .and_then(|n| n.as_str())
        .unwrap_or("Untitled")
        .to_string();

    // A folder can set its own auth, which further overrides whatever it
    // itself inherited from its parent/collection.
    let folder_auth = item.get("auth").or(inherited_auth);

    // Folders have a nested `item[]` and no `request`; requests have
    // `request` and no `item[]`.
    if let Some(children) = item.get("item").and_then(|i| i.as_array()) {
        let folder = storage::collections::create(pool, &name, Some(parent_id))?;
        for child in children {
            walk_item(pool, &folder.id, child, folder_auth)?;
        }
        return Ok(());
    }

    if let Some(req) = item.get("request") {
        // The request's own `auth` wins if present (including an explicit
        // "noauth" opt-out); otherwise fall back to whatever was inherited.
        let effective_auth = req.get("auth").or(folder_auth);
        let api_request = build_request(parent_id, &name, req, effective_auth)?;
        storage::requests::save(pool, &api_request)?;
    }

    Ok(())
}

fn build_request(collection_id: &str, name: &str, req: &Value, effective_auth: Option<&Value>) -> anyhow::Result<ApiRequest> {
    let method_str = req
        .get("method")
        .and_then(|m| m.as_str())
        .unwrap_or("GET")
        .to_uppercase();
    let method = parse_method(&method_str);

    let url = match req.get("url") {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Object(_)) => req["url"]
            .get("raw")
            .and_then(|r| r.as_str())
            .unwrap_or("")
            .to_string(),
        _ => String::new(),
    };

    let mut headers = Vec::new();
    if let Some(hs) = req.get("header").and_then(|h| h.as_array()) {
        for h in hs {
            headers.push(KeyValuePair {
                id: Uuid::new_v4().to_string(),
                key: h.get("key").and_then(|k| k.as_str()).unwrap_or("").to_string(),
                value: h.get("value").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                description: None,
                enabled: !h.get("disabled").and_then(|d| d.as_bool()).unwrap_or(false),
            });
        }
    }

    let mut params = Vec::new();
    if let Some(q) = req.get("url").and_then(|u| u.get("query")).and_then(|q| q.as_array()) {
        for p in q {
            params.push(KeyValuePair {
                id: Uuid::new_v4().to_string(),
                key: p.get("key").and_then(|k| k.as_str()).unwrap_or("").to_string(),
                value: p.get("value").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                description: None,
                enabled: !p.get("disabled").and_then(|d| d.as_bool()).unwrap_or(false),
            });
        }
    }

    let body = build_body(req.get("body"));
    let auth = build_auth(effective_auth);

    Ok(ApiRequest {
        id: Uuid::new_v4().to_string(),
        collection_id: Some(collection_id.to_string()),
        name: name.to_string(),
        method,
        url,
        params,
        headers,
        body,
        auth,
        scripts: ScriptsConfig { pre_request: String::new(), tests: String::new() },
        settings: RequestSettings::default(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn parse_method(m: &str) -> HttpMethod {
    match m {
        "POST" => HttpMethod::Post,
        "PUT" => HttpMethod::Put,
        "PATCH" => HttpMethod::Patch,
        "DELETE" => HttpMethod::Delete,
        "HEAD" => HttpMethod::Head,
        "OPTIONS" => HttpMethod::Options,
        _ => HttpMethod::Get,
    }
}

fn empty_body() -> RequestBody {
    RequestBody { body_type: "none".into(), json: None, form_data: None, url_encoded: None, raw: None, binary_file_path: None }
}

fn build_body(body: Option<&Value>) -> RequestBody {
    let Some(body) = body else { return empty_body() };
    match body.get("mode").and_then(|m| m.as_str()).unwrap_or("") {
        "raw" => {
            let content = body.get("raw").and_then(|r| r.as_str()).unwrap_or("").to_string();
            let lang = body
                .get("options")
                .and_then(|o| o.get("raw"))
                .and_then(|r| r.get("language"))
                .and_then(|l| l.as_str())
                .unwrap_or("json");
            if lang == "json" {
                RequestBody { body_type: "json".into(), json: Some(content), form_data: None, url_encoded: None, raw: None, binary_file_path: None }
            } else {
                RequestBody { body_type: "raw".into(), json: None, form_data: None, url_encoded: None, raw: Some(RawBody { content, language: lang.to_string() }), binary_file_path: None }
            }
        }
        "urlencoded" => {
            let pairs = body.get("urlencoded").and_then(|u| u.as_array()).map(|arr| {
                arr.iter()
                    .map(|p| KeyValuePair {
                        id: Uuid::new_v4().to_string(),
                        key: p.get("key").and_then(|k| k.as_str()).unwrap_or("").to_string(),
                        value: p.get("value").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        description: None,
                        enabled: !p.get("disabled").and_then(|d| d.as_bool()).unwrap_or(false),
                    })
                    .collect()
            }).unwrap_or_default();
            RequestBody { body_type: "url-encoded".into(), json: None, form_data: None, url_encoded: Some(pairs), raw: None, binary_file_path: None }
        }
        "formdata" => {
            let fields = body.get("formdata").and_then(|u| u.as_array()).map(|arr| {
                arr.iter()
                    .map(|p| FormDataField {
                        id: Uuid::new_v4().to_string(),
                        key: p.get("key").and_then(|k| k.as_str()).unwrap_or("").to_string(),
                        field_type: p.get("type").and_then(|t| t.as_str()).unwrap_or("text").to_string(),
                        value: p.get("value").or_else(|| p.get("src")).and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        enabled: !p.get("disabled").and_then(|d| d.as_bool()).unwrap_or(false),
                    })
                    .collect()
            }).unwrap_or_default();
            RequestBody { body_type: "form-data".into(), json: None, form_data: Some(fields), url_encoded: None, raw: None, binary_file_path: None }
        }
        _ => empty_body(),
    }
}

fn extract_kv(section: Option<&Value>, key: &str) -> String {
    section
        .and_then(|s| s.as_array())
        .and_then(|arr| arr.iter().find(|item| item.get("key").and_then(|k| k.as_str()) == Some(key)))
        .and_then(|item| item.get("value").and_then(|v| v.as_str()))
        .unwrap_or("")
        .to_string()
}

fn build_auth(auth: Option<&Value>) -> AuthConfig {
    let none = AuthConfig { auth_type: "none".into(), bearer: None, basic: None, api_key: None, oauth2: None };
    let Some(auth) = auth else { return none };

    match auth.get("type").and_then(|t| t.as_str()).unwrap_or("none") {
        "bearer" => AuthConfig {
            auth_type: "bearer".into(),
            bearer: Some(BearerAuth { token: extract_kv(auth.get("bearer"), "token") }),
            basic: None,
            api_key: None,
            oauth2: None,
        },
        "basic" => AuthConfig {
            auth_type: "basic".into(),
            bearer: None,
            basic: Some(BasicAuth {
                username: extract_kv(auth.get("basic"), "username"),
                password: extract_kv(auth.get("basic"), "password"),
            }),
            api_key: None,
            oauth2: None,
        },
        "apikey" => {
            let location = extract_kv(auth.get("apikey"), "in");
            AuthConfig {
                auth_type: "api-key".into(),
                bearer: None,
                basic: None,
                api_key: Some(ApiKeyAuth {
                    key: extract_kv(auth.get("apikey"), "key"),
                    value: extract_kv(auth.get("apikey"), "value"),
                    location: if location.is_empty() { "header".into() } else { location },
                }),
                oauth2: None,
            }
        }
        _ => none,
    }
}