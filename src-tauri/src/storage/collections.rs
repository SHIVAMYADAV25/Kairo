use crate::db::DbPool;
use crate::models::Collection;
use rusqlite::params;
use uuid::Uuid;

pub fn list(pool: &DbPool) -> anyhow::Result<Vec<Collection>> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, parent_id, position FROM collections ORDER BY position ASC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Collection {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_id: row.get(2)?,
            position: row.get(3)?,
        })
    })?;
    Ok(rows.filter_map(Result::ok).collect())
}

pub fn create(pool: &DbPool, name: &str, parent_id: Option<&str>) -> anyhow::Result<Collection> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    let position: i32 = conn.query_row(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM collections WHERE parent_id IS ?1",
        params![parent_id],
        |r| r.get(0),
    )?;
    conn.execute(
        "INSERT INTO collections (id, name, parent_id, position) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, parent_id, position],
    )?;
    Ok(Collection {
        id,
        name: name.to_string(),
        parent_id: parent_id.map(String::from),
        position,
    })
}

pub fn rename(pool: &DbPool, id: &str, name: &str) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute(
        "UPDATE collections SET name = ?1 WHERE id = ?2",
        params![name, id],
    )?;
    Ok(())
}

pub fn delete(pool: &DbPool, id: &str) -> anyhow::Result<()> {
    let conn = pool.get()?;
    // ON DELETE CASCADE handles child collections/requests.
    conn.execute("DELETE FROM collections WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn reorder(
    pool: &DbPool,
    id: &str,
    new_parent_id: Option<&str>,
    position: i32,
) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute(
        "UPDATE collections SET parent_id = ?1, position = ?2 WHERE id = ?3",
        params![new_parent_id, position, id],
    )?;
    Ok(())
}
