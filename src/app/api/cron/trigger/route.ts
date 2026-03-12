import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledStories, seenMentions } from "@/lib/db/schema";
import { publishStory, fetchMentions } from "@/lib/instagram";
import { deleteBlob } from "@/lib/blob";
import { refreshTokenIfNeeded } from "@/lib/token-refresh";
import { eq, lte, and } from "drizzle-orm";

export async function POST() {
  if (!db) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  await refreshTokenIfNeeded();

  const results = { published: 0, failed: 0, newMentions: 0 };

  // 1. Publish due stories
  const dueStories = await db
    .select()
    .from(scheduledStories)
    .where(
      and(
        eq(scheduledStories.status, "pending"),
        lte(scheduledStories.scheduledAt, new Date())
      )
    )
    .orderBy(scheduledStories.scheduledAt);

  for (const story of dueStories) {
    try {
      await db
        .update(scheduledStories)
        .set({ status: "publishing" })
        .where(eq(scheduledStories.id, story.id));

      const storyId = await publishStory(story.blobUrl);
      await deleteBlob(story.blobUrl).catch(() => {});

      await db
        .update(scheduledStories)
        .set({ status: "published", storyId })
        .where(eq(scheduledStories.id, story.id));

      results.published++;
    } catch (err) {
      await db
        .update(scheduledStories)
        .set({
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        })
        .where(eq(scheduledStories.id, story.id));
      results.failed++;
    }
  }

  // 2. Poll mentions
  try {
    const mentions = await fetchMentions();
    const existingIds = await db.select({ id: seenMentions.mentionId }).from(seenMentions);
    const existingSet = new Set(existingIds.map((r) => r.id));

    for (const mention of mentions) {
      if (!existingSet.has(mention.id)) {
        results.newMentions++;
      }
    }
  } catch {
    // Mention polling is non-critical
  }

  return NextResponse.json(results);
}
