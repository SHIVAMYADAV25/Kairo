use crate::db::DbPool;
use crate::models::Collection;
use tauri::State;

/// Downloads a collection definition (Postman Collection / OpenAPI / plain
/// JSON) from a URL and imports it. The format-specific parsers
/// (postman_parser.rs, openapi_parser.rs) are the natural next files to add
/// here — this command is the stable entry point the frontend calls either
/// way.
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

    // Postman v2.1 collections use `info.name`; fall back to a generic name
    // for OpenAPI (`info.title`) or plain JSON.
    let name = value
        .get("info")
        .and_then(|i| i.get("name").or_else(|| i.get("title")))
        .and_then(|n| n.as_str())
        .unwrap_or("Imported Collection")
        .to_string();

    let collection =
        crate::storage::collections::create(db, &name, None).map_err(|e| e.to_string())?;

    // TODO: walk `value["item"]` (Postman) or `value["paths"]` (OpenAPI) and
    // call `storage::requests::save` for each discovered request. Left as
    // the next incremental slice — the collection shell is created and
    // visible in the sidebar immediately either way.

    Ok(collection)
}
