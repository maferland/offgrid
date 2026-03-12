import { db } from "./db";
import { auth } from "./db/schema";
import { eq } from "drizzle-orm";
import { addDays, isBefore } from "date-fns";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export async function refreshTokenIfNeeded(): Promise<boolean> {
  if (!db) return false;

  const [row] = await db.select().from(auth).limit(1);
  if (!row?.expiresAt) return false;

  // Refresh if expiring within 7 days
  const refreshThreshold = addDays(new Date(), 7);
  if (!isBefore(row.expiresAt, refreshThreshold)) return false;

  try {
    const res = await fetch(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.INSTAGRAM_APP_ID!,
          client_secret: process.env.INSTAGRAM_APP_SECRET!,
          fb_exchange_token: row.accessToken,
        })
    );
    const data = await res.json();
    if (!res.ok) return false;

    const expiresIn = data.expires_in || 5184000;
    const expiresAt = addDays(new Date(), Math.floor(expiresIn / 86400));

    await db
      .update(auth)
      .set({ accessToken: data.access_token, expiresAt })
      .where(eq(auth.id, 1));

    return true;
  } catch {
    return false;
  }
}
