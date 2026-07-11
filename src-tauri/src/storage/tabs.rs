use crate::db::DbPool;
use crate::models::ApiRequest;
use rusqlite::params;

pub fn list_persisted(pool: &DbPool) -> anyhow::Result<Vec<ApiRequest>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT request_json FROM tabs ORDER BY position ASC")?;
    let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
    Ok(rows
        .filter_map(Result::ok)
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect())
}

pub fn persist(pool: &DbPool, requests: &[ApiRequest]) -> anyhow::Result<()> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM tabs", [])?;
    for (i, req) in requests.iter().enumerate() {
        tx.execute(
            "INSERT INTO tabs (id, request_json, is_unsaved, position) VALUES (?1, ?2, 1, ?3)",
            params![req.id, serde_json::to_string(req)?, i as i32],
        )?;
    }
    tx.commit()?;
    Ok(())
}
