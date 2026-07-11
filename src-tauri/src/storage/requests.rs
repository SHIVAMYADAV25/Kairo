use crate::db::DbPool;
use crate::models::ApiRequest;
use rusqlite::params;

pub fn list_by_collection(pool: &DbPool, collection_id: &str) -> anyhow::Result<Vec<ApiRequest>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, collection_id, name, method, url, params_json, headers_json,
                body_type, body_json, auth_json, scripts_json, settings_json, updated_at
         FROM requests WHERE collection_id = ?1 ORDER BY position ASC",
    )?;
    let rows = stmt.query_map(params![collection_id], row_to_request)?;
    Ok(rows.filter_map(Result::ok).collect())
}

pub fn save(pool: &DbPool, request: &ApiRequest) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute(
        "INSERT INTO requests (id, collection_id, name, method, url, params_json, headers_json,
                                body_type, body_json, auth_json, scripts_json, settings_json, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
         ON CONFLICT(id) DO UPDATE SET
            collection_id=excluded.collection_id, name=excluded.name, method=excluded.method,
            url=excluded.url, params_json=excluded.params_json, headers_json=excluded.headers_json,
            body_type=excluded.body_type, body_json=excluded.body_json, auth_json=excluded.auth_json,
            scripts_json=excluded.scripts_json, settings_json=excluded.settings_json,
            updated_at=excluded.updated_at",
        params![
            request.id,
            request.collection_id,
            request.name,
            serde_json::to_string(&request.method)?,
            request.url,
            serde_json::to_string(&request.params)?,
            serde_json::to_string(&request.headers)?,
            request.body.body_type,
            serde_json::to_string(&request.body)?,
            serde_json::to_string(&request.auth)?,
            serde_json::to_string(&request.scripts)?,
            serde_json::to_string(&request.settings)?,
            request.updated_at,
        ],
    )?;
    Ok(())
}

pub fn delete(pool: &DbPool, id: &str) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute("DELETE FROM requests WHERE id = ?1", params![id])?;
    Ok(())
}

fn row_to_request(row: &rusqlite::Row) -> rusqlite::Result<ApiRequest> {
    let method_json: String = row.get(3)?;
    let params_json: String = row.get(5)?;
    let headers_json: String = row.get(6)?;
    let body_json: String = row.get(8)?;
    let auth_json: String = row.get(9)?;
    let scripts_json: String = row.get(10)?;
    let settings_json: String = row.get(11)?;

    Ok(ApiRequest {
        id: row.get(0)?,
        collection_id: row.get(1)?,
        name: row.get(2)?,
        method: serde_json::from_str(&method_json).unwrap_or(crate::models::HttpMethod::Get),
        url: row.get(4)?,
        params: serde_json::from_str(&params_json).unwrap_or_default(),
        headers: serde_json::from_str(&headers_json).unwrap_or_default(),
        body: serde_json::from_str(&body_json).unwrap_or(crate::models::RequestBody {
            body_type: "none".into(),
            json: None,
            form_data: None,
            url_encoded: None,
            raw: None,
            binary_file_path: None,
        }),
        auth: serde_json::from_str(&auth_json).unwrap_or(crate::models::AuthConfig {
            auth_type: "none".into(),
            bearer: None,
            basic: None,
            api_key: None,
            oauth2: None,
        }),
        scripts: serde_json::from_str(&scripts_json).unwrap_or(crate::models::ScriptsConfig {
            pre_request: String::new(),
            tests: String::new(),
        }),
        settings: serde_json::from_str(&settings_json).unwrap_or_default(),
        updated_at: row.get(12)?,
    })
}
