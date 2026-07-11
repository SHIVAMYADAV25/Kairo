use crate::db::DbPool;
use crate::models::AppSettings;
use rusqlite::params;

const SETTINGS_KEY: &str = "app_settings";

pub fn get(pool: &DbPool) -> anyhow::Result<AppSettings> {
    let conn = pool.get()?;
    let value: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            params![SETTINGS_KEY],
            |r| r.get(0),
        )
        .ok();

    Ok(match value {
        Some(json) => serde_json::from_str(&json).unwrap_or_default(),
        None => AppSettings::default(),
    })
}

pub fn update(pool: &DbPool, patch: serde_json::Value) -> anyhow::Result<AppSettings> {
    let current = get(pool)?;
    let mut current_value = serde_json::to_value(&current)?;

    // Shallow merge is enough here since the frontend sends whole nested
    // objects (fontSizes, panelSizes) rather than deep partials.
    if let (Some(current_obj), Some(patch_obj)) = (current_value.as_object_mut(), patch.as_object()) {
        for (k, v) in patch_obj {
            current_obj.insert(k.clone(), v.clone());
        }
    }

    let merged: AppSettings = serde_json::from_value(current_value)?;
    let conn = pool.get()?;
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![SETTINGS_KEY, serde_json::to_string(&merged)?],
    )?;
    Ok(merged)
}
