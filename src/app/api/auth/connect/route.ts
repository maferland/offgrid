import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/db/schema";
import { validateToken } from "@/lib/instagram";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { accessToken, userId } = await req.json();
  if (!accessToken || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const username = await validateToken(accessToken, userId);

    // Upsert auth row (singleton id=1)
    const [existing] = await db.select().from(auth).where(eq(auth.id, 1));
    if (existing) {
      await db
        .update(auth)
        .set({ accessToken, userId, username })
        .where(eq(auth.id, 1));
    } else {
      await db.insert(auth).values({ id: 1, accessToken, userId, username });
    }

    return NextResponse.json({ username });
  } catch {
    return NextResponse.json({ error: "Invalid token or user ID" }, { status: 400 });
  }
}
