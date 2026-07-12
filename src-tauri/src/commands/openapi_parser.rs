use crate::db::DbPool;
use crate::models::{ApiRequest, AuthConfig, Collection, HttpMethod, KeyValuePair, RequestBody, RequestSettings, ScriptsConfig};
use crate::storage;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

/// Walks an OpenAPI 3.x (or Swagger 2.0) document's `paths` and creates one
/// request per operation, grouped into subfolders by the operation's first
/// tag when present (mirrors Postman's own OpenAPI importer).
pub fn import(pool: &DbPool, root_name: &str, doc: &Value) -> anyhow::Result<Collection> {
    let root = storage::collections::create(pool, root_name, None)?;

    let base_url = doc
        .get("servers")
        .and_then(|s| s.as_array())
        .and_then(|arr| arr.first())
        .and_then(|s| s.get("url"))
        .and_then(|u| u.as_str())
        .unwrap_or("")
        .to_string();

    let Some(paths) = doc.get("paths").and_then(|p| p.as_object()) else {
        return Ok(root);
    };

    let mut folder_cache: HashMap<String, String> = HashMap::new();

    for (path, methods) in paths {
        let Some(methods) = methods.as_object() else { continue };
        for (method_str, operation) in methods {
            let Some(method) = parse_method(method_str) else { continue };

            let op_name = operation
                .get("summary")
                .and_then(|s| s.as_str())
                .or_else(|| operation.get("operationId").and_then(|s| s.as_str()))
                .unwrap_or(path)
                .to_string();

            let tag = operation
                .get("tags")
                .and_then(|t| t.as_array())
                .and_then(|a| a.first())
                .and_then(|t| t.as_str());

            let target_collection_id = if let Some(tag) = tag {
                if let Some(id) = folder_cache.get(tag) {
                    id.clone()
                } else {
                    let folder = storage::collections::create(pool, tag, Some(&root.id))?;
                    folder_cache.insert(tag.to_string(), folder.id.clone());
                    folder.id
                }
            } else {
                root.id.clone()
            };

            let headers = operation.get("parameters").and_then(|p| p.as_array()).map(|arr| {
                arr.iter()
                    .filter(|p| p.get("in").and_then(|i| i.as_str()) == Some("header"))
                    .map(|p| KeyValuePair {
                        id: Uuid::new_v4().to_string(),
                        key: p.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string(),
                        value: String::new(),
                        description: p.get("description").and_then(|d| d.as_str()).map(String::from),
                        enabled: true,
                    })
                    .collect()
            }).unwrap_or_default();

            let params = operation.get("parameters").and_then(|p| p.as_array()).map(|arr| {
                arr.iter()
                    .filter(|p| p.get("in").and_then(|i| i.as_str()) == Some("query"))
                    .map(|p| KeyValuePair {
                        id: Uuid::new_v4().to_string(),
                        key: p.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string(),
                        value: String::new(),
                        description: p.get("description").and_then(|d| d.as_str()).map(String::from),
                        enabled: p.get("required").and_then(|r| r.as_bool()).unwrap_or(false),
                    })
                    .collect()
            }).unwrap_or_default();

            let body = build_body(operation.get("requestBody"));
            let full_url = format!("{}{}", base_url, path);

            let api_request = ApiRequest {
                id: Uuid::new_v4().to_string(),
                collection_id: Some(target_collection_id),
                name: op_name,
                method,
                url: full_url,
                params,
                headers,
                body,
                auth: AuthConfig { auth_type: "none".into(), bearer: None, basic: None, api_key: None, oauth2: None },
                scripts: ScriptsConfig { pre_request: String::new(), tests: String::new() },
                settings: RequestSettings::default(),
                updated_at: chrono::Utc::now().to_rfc3339(),
            };
            storage::requests::save(pool, &api_request)?;
        }
    }

    Ok(root)
}

fn parse_method(m: &str) -> Option<HttpMethod> {
    match m.to_lowercase().as_str() {
        "get" => Some(HttpMethod::Get),
        "post" => Some(HttpMethod::Post),
        "put" => Some(HttpMethod::Put),
        "patch" => Some(HttpMethod::Patch),
        "delete" => Some(HttpMethod::Delete),
        "head" => Some(HttpMethod::Head),
        "options" => Some(HttpMethod::Options),
        _ => None,
    }
}

fn build_body(request_body: Option<&Value>) -> RequestBody {
    let empty = RequestBody { body_type: "none".into(), json: None, form_data: None, url_encoded: None, raw: None, binary_file_path: None };
    let Some(rb) = request_body else { return empty };
    let Some(content) = rb.get("content").and_then(|c| c.as_object()) else { return empty };

    if let Some(json_content) = content.get("application/json") {
        let example = json_content
            .get("example")
            .or_else(|| json_content.get("schema").and_then(|s| s.get("example")))
            .cloned()
            .unwrap_or(Value::Object(Default::default()));
        let pretty = serde_json::to_string_pretty(&example).unwrap_or_else(|_| "{}".to_string());
        return RequestBody { body_type: "json".into(), json: Some(pretty), form_data: None, url_encoded: None, raw: None, binary_file_path: None };
    }
    empty
}