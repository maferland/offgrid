use reqwest::Client;
use serde::Deserialize;

const GRAPH_API: &str = "https://graph.instagram.com";

#[derive(Deserialize)]
struct ShortLivedToken {
    access_token: String,
    user_id: u64,
}

#[derive(Deserialize)]
struct LongLivedToken {
    access_token: String,
    expires_in: i64,
}

#[derive(Deserialize)]
struct UserProfile {
    username: String,
}

pub struct AuthResult {
    pub access_token: String,
    pub user_id: String,
    pub username: String,
    pub expires_in_secs: i64,
}

pub fn build_oauth_url(app_id: &str, redirect_uri: &str) -> String {
    format!(
        "https://www.instagram.com/oauth/authorize?client_id={}&redirect_uri={}&scope=instagram_basic,instagram_content_publish,instagram_manage_comments&response_type=code",
        app_id, redirect_uri
    )
}

pub async fn exchange_code(
    client: &Client,
    app_id: &str,
    app_secret: &str,
    redirect_uri: &str,
    code: &str,
) -> Result<AuthResult, String> {
    // Exchange code for short-lived token
    let short: ShortLivedToken = client
        .post("https://api.instagram.com/oauth/access_token")
        .form(&[
            ("client_id", app_id),
            ("client_secret", app_secret),
            ("grant_type", "authorization_code"),
            ("redirect_uri", redirect_uri),
            ("code", code),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    // Exchange for long-lived token
    let long: LongLivedToken = client
        .get(format!("{}/access_token", GRAPH_API))
        .query(&[
            ("grant_type", "ig_exchange_token"),
            ("client_secret", app_secret),
            ("access_token", &short.access_token),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    // Get username
    let profile: UserProfile = client
        .get(format!("{}/me", GRAPH_API))
        .query(&[
            ("fields", "username"),
            ("access_token", &long.access_token),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(AuthResult {
        access_token: long.access_token,
        user_id: short.user_id.to_string(),
        username: profile.username,
        expires_in_secs: long.expires_in,
    })
}

pub async fn refresh_token(client: &Client, token: &str) -> Result<(String, i64), String> {
    let resp: LongLivedToken = client
        .get(format!("{}/refresh_access_token", GRAPH_API))
        .query(&[
            ("grant_type", "ig_refresh_token"),
            ("access_token", token),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok((resp.access_token, resp.expires_in))
}
