use crate::db::DbPool;
use crate::models::{Environment, KeyValuePair};
use rusqlite::params;
use std::collections::HashMap;
use uuid::Uuid;

pub fn list(pool: &DbPool) -> anyhow::Result<Vec<Environment>> {
    let conn = pool.get()?;
    let mut env_stmt = conn.prepare("SELECT id, name, is_active FROM environments")?;
    let envs: Vec<(String, String, bool)> = env_stmt
        .query_map([], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, i32>(2)? != 0))
        })?
        .filter_map(Result::ok)
        .collect();
    drop(env_stmt);

    let mut result = Vec::with_capacity(envs.len());
    for (id, name, is_active) in envs {
        result.push(Environment {
            variables: get_variable_rows(&conn, &id)?,
            id,
            name,
            is_active,
        });
    }
    Ok(result)
}

pub fn create(pool: &DbPool, name: &str) -> anyhow::Result<Environment> {
    let conn = pool.get()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO environments (id, name, is_active) VALUES (?1, ?2, 0)",
        params![id, name],
    )?;
    Ok(Environment { id, name: name.to_string(), is_active: false, variables: vec![] })
}

pub fn update(pool: &DbPool, env: &Environment) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute(
        "UPDATE environments SET name = ?1 WHERE id = ?2",
        params![env.name, env.id],
    )?;
    conn.execute("DELETE FROM env_vars WHERE environment_id = ?1", params![env.id])?;
    for (i, v) in env.variables.iter().enumerate() {
        conn.execute(
            "INSERT INTO env_vars (id, environment_id, key, value, enabled, position) VALUES (?1,?2,?3,?4,?5,?6)",
            params![v.id, env.id, v.key, v.value, v.enabled as i32, i as i32],
        )?;
    }
    Ok(())
}

pub fn delete(pool: &DbPool, id: &str) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute("DELETE FROM environments WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn set_active(pool: &DbPool, id: &str) -> anyhow::Result<()> {
    let conn = pool.get()?;
    conn.execute("UPDATE environments SET is_active = 0", [])?;
    conn.execute(
        "UPDATE environments SET is_active = 1 WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

/// Used by the HTTP executor to resolve `{{VAR}}` at request time — a plain
/// HashMap keeps substitution O(1) per variable instead of round-tripping
/// through the full `Environment` struct.
pub fn get_variables(pool: &DbPool, environment_id: &str) -> anyhow::Result<HashMap<String, String>> {
    let conn = pool.get()?;
    let rows = get_variable_rows(&conn, environment_id)?;
    Ok(rows
        .into_iter()
        .filter(|v| v.enabled)
        .map(|v| (v.key, v.value))
        .collect())
}

fn get_variable_rows(
    conn: &rusqlite::Connection,
    environment_id: &str,
) -> anyhow::Result<Vec<KeyValuePair>> {
    let mut stmt = conn.prepare(
        "SELECT id, key, value, enabled FROM env_vars WHERE environment_id = ?1 ORDER BY position ASC",
    )?;
    let rows = stmt.query_map(params![environment_id], |r| {
        Ok(KeyValuePair {
            id: r.get(0)?,
            key: r.get(1)?,
            value: r.get(2)?,
            description: None,
            enabled: r.get::<_, i32>(3)? != 0,
        })
    })?;
    Ok(rows.filter_map(Result::ok).collect())
}
