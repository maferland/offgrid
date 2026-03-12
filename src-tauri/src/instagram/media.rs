use reqwest::Client;
use serde::Deserialize;
use std::path::Path;

const GRAPH_API: &str = "https://graph.instagram.com";

#[derive(Deserialize)]
struct ContainerResponse {
    id: String,
}

#[derive(Deserialize)]
struct PublishResponse {
    id: String,
}

#[derive(Deserialize)]
struct StatusResponse {
    status_code: String,
}

pub struct PublishResult {
    pub story_id: String,
}

pub async fn publish_story(
    client: &Client,
    user_id: &str,
    token: &str,
    file_path: &str,
    image_url: &str,
) -> Result<PublishResult, String> {
    let path = Path::new(file_path);
    let is_video = matches!(
        path.extension().and_then(|e| e.to_str()),
        Some("mp4" | "mov")
    );

    // Create media container
    let mut params = vec![
        ("access_token", token.to_string()),
        ("media_type", "STORIES".to_string()),
    ];

    if is_video {
        params.push(("video_url", image_url.to_string()));
    } else {
        params.push(("image_url", image_url.to_string()));
    }

    let container: ContainerResponse = client
        .post(format!("{}/{}/media", GRAPH_API, user_id))
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    // For videos, wait for processing
    if is_video {
        wait_for_container(client, &container.id, token).await?;
    }

    // Publish the container
    let result: PublishResponse = client
        .post(format!("{}/{}/media_publish", GRAPH_API, user_id))
        .form(&[
            ("creation_id", &container.id),
            ("access_token", &token.to_string()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(PublishResult {
        story_id: result.id,
    })
}

async fn wait_for_container(client: &Client, container_id: &str, token: &str) -> Result<(), String> {
    for _ in 0..30 {
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;

        let status: StatusResponse = client
            .get(format!("{}/{}", GRAPH_API, container_id))
            .query(&[
                ("fields", "status_code"),
                ("access_token", token),
            ])
            .send()
            .await
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;

        match status.status_code.as_str() {
            "FINISHED" => return Ok(()),
            "ERROR" => return Err("Media processing failed".to_string()),
            _ => continue,
        }
    }

    Err("Media processing timed out".to_string())
}
