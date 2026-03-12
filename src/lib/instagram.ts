import { db } from "./db";
import { auth } from "./db/schema";

const GRAPH_API = "https://graph.instagram.com/v21.0";

async function getAuth() {
  const [row] = await db.select().from(auth).limit(1);
  if (!row) throw new Error("Not authenticated");
  return row;
}

export async function validateToken(accessToken: string, userId: string) {
  const res = await fetch(`${GRAPH_API}/${userId}?fields=username&access_token=${accessToken}`);
  if (!res.ok) throw new Error("Invalid token");
  const data = await res.json();
  return data.username as string;
}

export async function publishStory(imageUrl: string) {
  const { accessToken, userId } = await getAuth();

  // Create media container
  const createRes = await fetch(`${GRAPH_API}/${userId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      media_type: "STORIES",
      access_token: accessToken,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Failed to create media container");
  }
  const { id: containerId } = await createRes.json();

  // Wait for container to be ready
  await waitForContainer(containerId, accessToken);

  // Publish
  const publishRes = await fetch(`${GRAPH_API}/${userId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });
  if (!publishRes.ok) {
    const err = await publishRes.json();
    throw new Error(err.error?.message || "Failed to publish story");
  }
  const { id: storyId } = await publishRes.json();
  return storyId as string;
}

async function waitForContainer(containerId: string, accessToken: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") throw new Error("Media container failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Media container timed out");
}

export async function fetchMentions() {
  const { accessToken, userId } = await getAuth();
  const res = await fetch(
    `${GRAPH_API}/${userId}/tags?fields=id,media_url,media_type,username,timestamp,caption&access_token=${accessToken}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to fetch mentions");
  }
  const data = await res.json();
  return data.data as Array<{
    id: string;
    media_url: string;
    media_type: string;
    username: string;
    timestamp: string;
    caption?: string;
  }>;
}
