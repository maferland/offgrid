import { NextResponse } from "next/server";
import { publishStory } from "@/lib/instagram";
import { uploadToBlob, deleteBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { seenMentions } from "@/lib/db/schema";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });

  const { id } = await params;
  try {
    const mentionsRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL ?? ""}/api/instagram/mentions`
    );
    const mentions = await mentionsRes.json();
    const mention = mentions.find((m: { id: string }) => m.id === id);
    if (!mention) {
      return NextResponse.json({ error: "Mention not found" }, { status: 404 });
    }

    const mediaRes = await fetch(mention.media_url);
    const blob = await mediaRes.blob();
    const file = new File([blob], `repost-${id}.jpg`, { type: blob.type });
    const blobUrl = await uploadToBlob(file);
    const storyId = await publishStory(blobUrl);
    await deleteBlob(blobUrl).catch(() => {});

    await db
      .insert(seenMentions)
      .values({ mentionId: id, action: "reposted" })
      .onConflictDoUpdate({
        target: seenMentions.mentionId,
        set: { action: "reposted" },
      });

    return NextResponse.json({ storyId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Repost failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
