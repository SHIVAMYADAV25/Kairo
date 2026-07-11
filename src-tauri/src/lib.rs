mod commands;
mod db;
mod models;
mod storage;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");

            let pool = db::init_pool(app_data_dir).expect("failed to initialize database");
            app.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // HTTP
            commands::execute_request,
            commands::cancel_request,
            // Collections
            commands::list_collections,
            commands::create_collection,
            commands::rename_collection,
            commands::delete_collection,
            commands::reorder_collection,
            // Requests
            commands::list_requests,
            commands::save_request,
            commands::delete_request,
            // History
            commands::list_history,
            commands::search_history,
            commands::clear_history,
            // Environments
            commands::list_environments,
            commands::create_environment,
            commands::update_environment,
            commands::delete_environment,
            commands::set_active_environment,
            // Settings
            commands::get_settings,
            commands::update_settings,
            // Tabs
            commands::list_persisted_tabs,
            commands::persist_tabs,
            // Import
            commands::import_from_url,
            commands::import_from_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running RequestKit");
}
