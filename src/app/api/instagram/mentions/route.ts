import { NextResponse } from "next/server";
import { fetchMentions } from "@/lib/instagram";
import { db } from "@/lib/db";
import { seenMentions } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function GET() {
  if (!db) return NextResponse.json([]);

  try {
    const mentions = await fetchMentions();
    const mentionIds = mentions.map((m) => m.id);

    const seen = mentionIds.length
      ? await db
          .select()
          .from(seenMentions)
          .where(inArray(seenMentions.mentionId, mentionIds))
      : [];

    const seenMap = new Map(seen.map((s) => [s.mentionId, s.action]));

    const enriched = mentions.map((m) => ({
      ...m,
      action: seenMap.get(m.id) ?? undefined,
    }));

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json([]);
  }
}
