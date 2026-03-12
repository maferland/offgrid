import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/db/schema";

export async function GET() {
  if (!db) return NextResponse.json({ connected: false });
  const [row] = await db.select().from(auth).limit(1);
  if (!row) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: true, username: row.username });
}
