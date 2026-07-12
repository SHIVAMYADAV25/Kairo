use crate::commands::{openapi_parser, postman_parser};
use crate::db::DbPool;
use crate::models::Collection;
use tauri::State;

#[tauri::command]
pub async fn import_from_url(db: State<'_, DbPool>, url: String) -> Result<Collection, String> {
    let body = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch {url}: {e}"))?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    import_json_collection(&db, &body)
}

#[tauri::command]
pub async fn import_from_file(
    db: State<'_, DbPool>,
    file_path: String,
) -> Result<Collection, String> {
    let content = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    import_json_collection(&db, &content)
}

fn import_json_collection(db: &DbPool, raw: &str) -> Result<Collection, String> {
    let value: serde_json::Value = serde_json::from_str(raw).map_err(|e| e.to_string())?;

    let is_openapi = value.get("openapi").is_some() || value.get("swagger").is_some();
    let is_postman = value.get("item").is_some() && value.get("info").is_some();

    if is_openapi {
        let name = value
            .get("info")
            .and_then(|i| i.get("title"))
            .and_then(|n| n.as_str())
            .unwrap_or("Imported API")
            .to_string();
        return openapi_parser::import(db, &name, &value).map_err(|e| e.to_string());
    }

    if is_postman {
        let name = value
            .get("info")
            .and_then(|i| i.get("name"))
            .and_then(|n| n.as_str())
            .unwrap_or("Imported Collection")
            .to_string();
        return postman_parser::import(db, &name, &value).map_err(|e| e.to_string());
    }

    // Unknown shape — fall back to an empty shell instead of hard-failing.
    let name = value
        .get("info")
        .and_then(|i| i.get("name").or_else(|| i.get("title")))
        .and_then(|n| n.as_str())
        .unwrap_or("Imported Collection")
        .to_string();
    crate::storage::collections::create(db, &name, None).map_err(|e| e.to_string())
}