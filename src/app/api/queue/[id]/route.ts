import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledStories } from "@/lib/db/schema";
import { deleteBlob } from "@/lib/blob";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });

  const { id } = await params;
  const [story] = await db
    .select()
    .from(scheduledStories)
    .where(eq(scheduledStories.id, id));

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteBlob(story.blobUrl).catch(() => {});
  await db.delete(scheduledStories).where(eq(scheduledStories.id, id));

  return NextResponse.json({ ok: true });
}
