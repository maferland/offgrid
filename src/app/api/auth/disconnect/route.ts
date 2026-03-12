import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  if (!db) return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  await db.delete(auth).where(eq(auth.id, 1));
  return NextResponse.json({ ok: true });
}
