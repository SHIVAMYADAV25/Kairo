use crate::db::DbPool;
use crate::models::{ApiRequest, ApiResponse, HistoryEntry};
use rusqlite::params;
use uuid::Uuid;

pub fn insert(pool: &DbPool, request: &ApiRequest, response: &ApiResponse) -> anyhow::Result<()> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO history (id, method, url, status, duration_ms, size_bytes, request_json, response_json, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![
            id,
            serde_json::to_string(&request.method)?,
            request.url,
            response.status,
            response.timing.total_ms,
            response.size_bytes,
            serde_json::to_string(request)?,
            serde_json::to_string(response)?,
            response.received_at,
        ],
    )?;

    // Keep history bounded so the DB doesn't grow unbounded on a machine
    // that's been running RequestKit for months — trim beyond 5,000 rows.
    conn.execute(
        "DELETE FROM history WHERE id NOT IN (
            SELECT id FROM history ORDER BY created_at DESC LIMIT 5000
        )",
        [],
    )?;

    Ok(())
}

pub fn list(pool: &DbPool, limit: i64, offset: i64) -> anyhow::Result<Vec<HistoryEntry>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, method, url, status, duration_ms, size_bytes, request_json, response_json, created_at
         FROM history ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
    )?;
    let rows = stmt.query_map(params![limit, offset], row_to_entry)?;
    Ok(rows.filter_map(Result::ok).collect())
}

pub fn search(pool: &DbPool, query: &str) -> anyhow::Result<Vec<HistoryEntry>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, method, url, status, duration_ms, size_bytes, request_json, response_json, created_at
         FROM history WHERE url LIKE ?1 ORDER BY created_at DESC LIMIT 200",
    )?;
    let pattern = format!("%{}%", query);
    let rows = stmt.query_map(params![pattern], row_to_entry)?;
    Ok(rows.filter_map(Result::ok).collect())
}

pub fn clear(pool: &DbPool) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute("DELETE FROM history", [])?;
    Ok(())
}

fn row_to_entry(row: &rusqlite::Row) -> rusqlite::Result<HistoryEntry> {
    let method_json: String = row.get(1)?;
    let request_json: String = row.get(6)?;
    let response_json: String = row.get(7)?;
    Ok(HistoryEntry {
        id: row.get(0)?,
        method: serde_json::from_str(&method_json).unwrap_or(crate::models::HttpMethod::Get),
        url: row.get(2)?,
        status: row.get(3)?,
        duration_ms: row.get(4)?,
        size_bytes: row.get(5)?,
        request: serde_json::from_str(&request_json).unwrap_or_else(|_| default_request()),
        response: serde_json::from_str(&response_json).unwrap_or_else(|_| default_response()),
        created_at: row.get(8)?,
    })
}

fn default_request() -> ApiRequest {
    ApiRequest {
        id: String::new(),
        collection_id: None,
        name: String::new(),
        method: crate::models::HttpMethod::Get,
        url: String::new(),
        params: vec![],
        headers: vec![],
        body: crate::models::RequestBody {
            body_type: "none".into(),
            json: None,
            form_data: None,
            url_encoded: None,
            raw: None,
            binary_file_path: None,
        },
        auth: crate::models::AuthConfig {
            auth_type: "none".into(),
            bearer: None,
            basic: None,
            api_key: None,
            oauth2: None,
        },
        scripts: crate::models::ScriptsConfig { pre_request: String::new(), tests: String::new() },
        settings: crate::models::RequestSettings::default(),
        updated_at: String::new(),
    }
}

fn default_response() -> ApiResponse {
    ApiResponse {
        status: 0,
        status_text: String::new(),
        http_version: String::new(),
        headers: Default::default(),
        cookies: vec![],
        body: String::new(),
        content_type: String::new(),
        size_bytes: 0,
        timing: Default::default(),
        test_results: vec![],
        received_at: String::new(),
    }
}
