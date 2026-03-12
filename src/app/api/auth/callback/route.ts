import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || "https://offgrid.maferland.com"}/settings?error=oauth_denied`
    );
  }

  if (!db) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || "https://offgrid.maferland.com"}/settings?error=no_database`
    );
  }

  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_URL || "https://offgrid.maferland.com"}/api/auth/callback`;

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        })
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error?.message || "Token exchange failed");
    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `${GRAPH_API}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        })
    );
    const longData = await longRes.json();
    if (!longRes.ok) throw new Error(longData.error?.message || "Long-lived token exchange failed");
    const longLivedToken = longData.access_token;
    const expiresIn = longData.expires_in || 5184000; // default 60 days

    // 3. Get Facebook Pages
    const pagesRes = await fetch(`${GRAPH_API}/me/accounts?access_token=${longLivedToken}`);
    const pagesData = await pagesRes.json();
    if (!pagesData.data?.length) throw new Error("No Facebook Pages found");

    // 4. Find Instagram Business Account from first page
    let igUserId: string | null = null;
    let igUsername: string | null = null;

    for (const page of pagesData.data) {
      const igRes = await fetch(
        `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${longLivedToken}`
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        igUserId = igData.instagram_business_account.id;
        // Get username
        const userRes = await fetch(
          `${GRAPH_API}/${igUserId}?fields=username&access_token=${longLivedToken}`
        );
        const userData = await userRes.json();
        igUsername = userData.username;
        break;
      }
    }

    if (!igUserId || !igUsername) {
      throw new Error("No Instagram Business account linked to your Facebook Pages");
    }

    // 5. Upsert auth
    const expiresAt = addDays(new Date(), Math.floor(expiresIn / 86400));
    const [existing] = await db.select().from(auth).where(eq(auth.id, 1));
    if (existing) {
      await db
        .update(auth)
        .set({
          accessToken: longLivedToken,
          userId: igUserId,
          username: igUsername,
          expiresAt,
        })
        .where(eq(auth.id, 1));
    } else {
      await db.insert(auth).values({
        id: 1,
        accessToken: longLivedToken,
        userId: igUserId,
        username: igUsername,
        expiresAt,
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || "https://offgrid.maferland.com"}/settings?connected=true`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth failed";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || "https://offgrid.maferland.com"}/settings?error=${encodeURIComponent(message)}`
    );
  }
}
