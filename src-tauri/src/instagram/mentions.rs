use reqwest::Client;
use serde::Deserialize;

const GRAPH_API: &str = "https://graph.instagram.com";

#[derive(Deserialize)]
struct TagsResponse {
    data: Vec<TaggedMedia>,
}

#[derive(Deserialize)]
pub struct TaggedMedia {
    pub id: String,
    pub media_url: Option<String>,
    pub media_type: Option<String>,
    pub username: Option<String>,
    pub timestamp: Option<String>,
}

pub async fn fetch_tagged_media(
    client: &Client,
    user_id: &str,
    token: &str,
) -> Result<Vec<TaggedMedia>, String> {
    let resp: TagsResponse = client
        .get(format!("{}/{}/tags", GRAPH_API, user_id))
        .query(&[
            ("fields", "id,media_url,media_type,username,timestamp"),
            ("access_token", token),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(resp.data)
}

pub async fn download_media(client: &Client, url: &str) -> Result<Vec<u8>, String> {
    let bytes = client
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    Ok(bytes.to_vec())
}
