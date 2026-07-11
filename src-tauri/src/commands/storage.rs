use crate::db::DbPool;
use crate::models::*;
use tauri::State;

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_collections(db: State<'_, DbPool>) -> Result<Vec<Collection>, String> {
    crate::storage::collections::list(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_collection(
    db: State<'_, DbPool>,
    name: String,
    parent_id: Option<String>,
) -> Result<Collection, String> {
    crate::storage::collections::create(&db, &name, parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_collection(db: State<'_, DbPool>, id: String, name: String) -> Result<(), String> {
    crate::storage::collections::rename(&db, &id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_collection(db: State<'_, DbPool>, id: String) -> Result<(), String> {
    crate::storage::collections::delete(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_collection(
    db: State<'_, DbPool>,
    id: String,
    new_parent_id: Option<String>,
    position: i32,
) -> Result<(), String> {
    crate::storage::collections::reorder(&db, &id, new_parent_id.as_deref(), position)
        .map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_requests(
    db: State<'_, DbPool>,
    collection_id: String,
) -> Result<Vec<ApiRequest>, String> {
    crate::storage::requests::list_by_collection(&db, &collection_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_request(db: State<'_, DbPool>, request: ApiRequest) -> Result<ApiRequest, String> {
    crate::storage::requests::save(&db, &request).map_err(|e| e.to_string())?;
    Ok(request)
}

#[tauri::command]
pub fn delete_request(db: State<'_, DbPool>, id: String) -> Result<(), String> {
    crate::storage::requests::delete(&db, &id).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_history(
    db: State<'_, DbPool>,
    limit: i64,
    offset: i64,
) -> Result<Vec<HistoryEntry>, String> {
    crate::storage::history::list(&db, limit, offset).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_history(db: State<'_, DbPool>, query: String) -> Result<Vec<HistoryEntry>, String> {
    crate::storage::history::search(&db, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_history(db: State<'_, DbPool>) -> Result<(), String> {
    crate::storage::history::clear(&db).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_environments(db: State<'_, DbPool>) -> Result<Vec<Environment>, String> {
    crate::storage::environments::list(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_environment(db: State<'_, DbPool>, name: String) -> Result<Environment, String> {
    crate::storage::environments::create(&db, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_environment(db: State<'_, DbPool>, env: Environment) -> Result<(), String> {
    crate::storage::environments::update(&db, &env).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_environment(db: State<'_, DbPool>, id: String) -> Result<(), String> {
    crate::storage::environments::delete(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_active_environment(db: State<'_, DbPool>, id: String) -> Result<(), String> {
    crate::storage::environments::set_active(&db, &id).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_settings(db: State<'_, DbPool>) -> Result<AppSettings, String> {
    crate::storage::settings::get(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_settings(
    db: State<'_, DbPool>,
    settings: serde_json::Value,
) -> Result<AppSettings, String> {
    crate::storage::settings::update(&db, settings).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Tabs (workspace restore-on-restart)
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_persisted_tabs(db: State<'_, DbPool>) -> Result<Vec<ApiRequest>, String> {
    crate::storage::tabs::list_persisted(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn persist_tabs(db: State<'_, DbPool>, requests: Vec<ApiRequest>) -> Result<(), String> {
    crate::storage::tabs::persist(&db, &requests).map_err(|e| e.to_string())
}
