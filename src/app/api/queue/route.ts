import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledStories } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!db) return NextResponse.json([]);

  const stories = await db
    .select()
    .from(scheduledStories)
    .orderBy(scheduledStories.scheduledAt);
  return NextResponse.json(stories);
}

export async function POST(req: Request) {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });

  const { blobUrl, caption, scheduledAt } = await req.json();
  if (!blobUrl || !scheduledAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await db
    .select({ position: scheduledStories.position })
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "pending"))
    .orderBy(scheduledStories.position);
  const nextPosition = existing.length ? existing[existing.length - 1].position + 1 : 0;

  const id = nanoid();
  await db.insert(scheduledStories).values({
    id,
    blobUrl,
    caption: caption || null,
    scheduledAt: new Date(scheduledAt),
    position: nextPosition,
  });

  return NextResponse.json({ id });
}
