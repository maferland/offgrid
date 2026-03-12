import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "INSTAGRAM_APP_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_URL || "https://offgrid.maferland.com"}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    response_type: "code",
  });

  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params}`);
}
