import { NextResponse } from "next/server";
import { publishStory } from "@/lib/instagram";
import { uploadToBlob, deleteBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { seenMentions } from "@/lib/db/schema";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Fetch the mention media
    // We need to download the image and re-upload to Vercel Blob
    // since Instagram media URLs may be temporary
    const mentionsRes = await fetch(
      `${process.env.NEXT_PUBLIC_URL ?? ""}/api/instagram/mentions`
    );
    const mentions = await mentionsRes.json();
    const mention = mentions.find((m: { id: string }) => m.id === id);
    if (!mention) {
      return NextResponse.json({ error: "Mention not found" }, { status: 404 });
    }

    // Download media
    const mediaRes = await fetch(mention.media_url);
    const blob = await mediaRes.blob();
    const file = new File([blob], `repost-${id}.jpg`, { type: blob.type });

    // Upload to Vercel Blob
    const blobUrl = await uploadToBlob(file);

    // Publish as story
    const storyId = await publishStory(blobUrl);

    // Clean up
    await deleteBlob(blobUrl).catch(() => {});

    // Mark as reposted
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
