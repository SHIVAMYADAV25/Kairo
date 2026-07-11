use r2d2_sqlite::SqliteConnectionManager;
use std::path::PathBuf;

pub type DbPool = r2d2::Pool<SqliteConnectionManager>;

const MIGRATION_001: &str = include_str!("migrations/001_init.sql");

/// Resolves the SQLite file to `<app_data_dir>/requestkit.db`. Using a real
/// pooled connection (not a single Mutex<Connection>) means concurrent reads
/// (e.g. history search while a request is in flight) don't block on a
/// single lock — this is a meaningful chunk of the "feel fast" requirement.
pub fn init_pool(app_data_dir: PathBuf) -> anyhow::Result<DbPool> {
    std::fs::create_dir_all(&app_data_dir)?;
    let db_path = app_data_dir.join("requestkit.db");
    println!("Database path: {}", db_path.display());

    let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;
             PRAGMA cache_size = -8000;", // 8MB page cache
        )
    });

    let pool = r2d2::Pool::builder().max_size(8).build(manager)?;

    // Run migrations once at startup. Future migrations get appended here
    // (002_*.sql, etc.) behind a schema_version check.
    let conn = pool.get()?;
    conn.execute_batch(MIGRATION_001)?;

    Ok(pool)
}
