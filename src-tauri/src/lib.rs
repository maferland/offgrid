mod commands;
mod db;
mod instagram;

use commands::AppState;
use db::Database;
use reqwest::Client;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");

            let db = Arc::new(Database::new(app_dir).expect("failed to init database"));

            // TODO: Load from env or config file
            let app_id = std::env::var("INSTAGRAM_APP_ID").unwrap_or_default();
            let app_secret = std::env::var("INSTAGRAM_APP_SECRET").unwrap_or_default();

            app.manage(AppState {
                db,
                client: Client::new(),
                app_id,
                app_secret,
                redirect_uri: "https://localhost:1420/oauth/callback".to_string(),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_auth_status,
            commands::start_oauth,
            commands::handle_oauth_callback,
            commands::disconnect,
            commands::publish_story,
            commands::get_mentions,
            commands::repost_mention,
            commands::skip_mention,
            commands::get_polling_interval,
            commands::set_polling_interval,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
