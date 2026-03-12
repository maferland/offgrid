import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seenMentions } from "@/lib/db/schema";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });

  const { id } = await params;
  await db
    .insert(seenMentions)
    .values({ mentionId: id, action: "skipped" })
    .onConflictDoUpdate({
      target: seenMentions.mentionId,
      set: { action: "skipped" },
    });
  return NextResponse.json({ ok: true });
}
