use crate::db::Database;
use crate::instagram::{auth, media, mentions};
use chrono::{Duration, Utc};
use reqwest::Client;
use serde::Serialize;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub db: Arc<Database>,
    pub client: Client,
    pub app_id: String,
    pub app_secret: String,
    pub redirect_uri: String,
}

#[derive(Serialize)]
pub struct AuthStatus {
    connected: bool,
    username: Option<String>,
    expires_at: Option<String>,
}

#[derive(Serialize)]
pub struct PublishResult {
    success: bool,
    story_id: Option<String>,
    error: Option<String>,
}

#[derive(Serialize)]
pub struct MentionInfo {
    id: String,
    media_url: String,
    media_type: String,
    username: String,
    timestamp: String,
    seen: bool,
}

#[tauri::command]
pub fn get_auth_status(state: State<AppState>) -> Result<AuthStatus, String> {
    match state.db.get_auth().map_err(|e| e.to_string())? {
        Some((_, _, username, expires_at)) => Ok(AuthStatus {
            connected: true,
            username: Some(username),
            expires_at: Some(expires_at),
        }),
        None => Ok(AuthStatus {
            connected: false,
            username: None,
            expires_at: None,
        }),
    }
}

#[tauri::command]
pub fn start_oauth(state: State<AppState>) -> String {
    auth::build_oauth_url(&state.app_id, &state.redirect_uri)
}

#[tauri::command]
pub async fn handle_oauth_callback(
    state: State<'_, AppState>,
    code: String,
) -> Result<AuthStatus, String> {
    let result = auth::exchange_code(
        &state.client,
        &state.app_id,
        &state.app_secret,
        &state.redirect_uri,
        &code,
    )
    .await?;

    let expires_at = (Utc::now() + Duration::seconds(result.expires_in_secs))
        .to_rfc3339();

    state
        .db
        .save_auth(
            &result.access_token,
            &result.user_id,
            &result.username,
            &expires_at,
        )
        .map_err(|e| e.to_string())?;

    Ok(AuthStatus {
        connected: true,
        username: Some(result.username),
        expires_at: Some(expires_at),
    })
}

#[tauri::command]
pub fn disconnect(state: State<AppState>) -> Result<(), String> {
    state.db.delete_auth().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn publish_story(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<PublishResult, String> {
    let (token, user_id, _, _) = state
        .db
        .get_auth()
        .map_err(|e| e.to_string())?
        .ok_or("Not authenticated")?;

    // For the Graph API, media needs to be accessible via URL.
    // In a real implementation, you'd upload to a hosting service first.
    // For now, we pass the file path and the command handler would need
    // a media hosting step.
    match media::publish_story(&state.client, &user_id, &token, &file_path, &file_path).await {
        Ok(result) => Ok(PublishResult {
            success: true,
            story_id: Some(result.story_id),
            error: None,
        }),
        Err(e) => Ok(PublishResult {
            success: false,
            story_id: None,
            error: Some(e),
        }),
    }
}

#[tauri::command]
pub async fn get_mentions(state: State<'_, AppState>) -> Result<Vec<MentionInfo>, String> {
    let (token, user_id, _, _) = state
        .db
        .get_auth()
        .map_err(|e| e.to_string())?
        .ok_or("Not authenticated")?;

    let tagged = mentions::fetch_tagged_media(&state.client, &user_id, &token).await?;

    let mut results = Vec::new();
    for m in tagged {
        let seen = state.db.is_mention_seen(&m.id).map_err(|e| e.to_string())?;
        results.push(MentionInfo {
            id: m.id,
            media_url: m.media_url.unwrap_or_default(),
            media_type: m.media_type.unwrap_or_else(|| "IMAGE".to_string()),
            username: m.username.unwrap_or_else(|| "unknown".to_string()),
            timestamp: m.timestamp.unwrap_or_default(),
            seen,
        });
    }

    Ok(results)
}

#[tauri::command]
pub async fn repost_mention(
    state: State<'_, AppState>,
    mention_id: String,
) -> Result<PublishResult, String> {
    let (token, user_id, _, _) = state
        .db
        .get_auth()
        .map_err(|e| e.to_string())?
        .ok_or("Not authenticated")?;

    // Get the mention's media URL from the API
    let tagged = mentions::fetch_tagged_media(&state.client, &user_id, &token).await?;
    let mention = tagged
        .into_iter()
        .find(|m| m.id == mention_id)
        .ok_or("Mention not found")?;

    let media_url = mention.media_url.ok_or("No media URL available")?;

    match media::publish_story(&state.client, &user_id, &token, "", &media_url).await {
        Ok(result) => {
            state
                .db
                .mark_mention_seen(&mention_id, "reposted")
                .map_err(|e| e.to_string())?;
            Ok(PublishResult {
                success: true,
                story_id: Some(result.story_id),
                error: None,
            })
        }
        Err(e) => Ok(PublishResult {
            success: false,
            story_id: None,
            error: Some(e),
        }),
    }
}

#[tauri::command]
pub fn skip_mention(state: State<AppState>, mention_id: String) -> Result<(), String> {
    state
        .db
        .mark_mention_seen(&mention_id, "skipped")
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_polling_interval(state: State<AppState>) -> Result<u64, String> {
    let interval = state
        .db
        .get_setting("polling_interval")
        .map_err(|e| e.to_string())?
        .and_then(|v| v.parse().ok())
        .unwrap_or(300);
    Ok(interval)
}

#[tauri::command]
pub fn set_polling_interval(state: State<AppState>, seconds: u64) -> Result<(), String> {
    state
        .db
        .set_setting("polling_interval", &seconds.to_string())
        .map_err(|e| e.to_string())
}
