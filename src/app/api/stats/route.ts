import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, scheduledStories, seenMentions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  if (!db) {
    return NextResponse.json({
      auth: null,
      pendingCount: 0,
      scheduledCount: 0,
      publishedCount: 0,
      upNext: [],
      dbConnected: false,
    });
  }

  const [authRow] = await db.select().from(auth).limit(1);
  const [{ value: pendingCount }] = await db
    .select({ value: count() })
    .from(seenMentions)
    .where(eq(seenMentions.action, "pending"));
  const [{ value: scheduledCount }] = await db
    .select({ value: count() })
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "pending"));
  const [{ value: publishedCount }] = await db
    .select({ value: count() })
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "published"));
  const upNext = await db
    .select()
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "pending"))
    .orderBy(scheduledStories.scheduledAt)
    .limit(3);

  return NextResponse.json({
    auth: authRow ?? null,
    pendingCount,
    scheduledCount,
    publishedCount,
    upNext,
    dbConnected: true,
  });
}
