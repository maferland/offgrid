import { NextResponse } from "next/server";
import { publishStory } from "@/lib/instagram";
import { deleteBlob } from "@/lib/blob";

export async function POST(req: Request) {
  const { blobUrl } = await req.json();
  if (!blobUrl) {
    return NextResponse.json({ error: "Missing blobUrl" }, { status: 400 });
  }

  try {
    const storyId = await publishStory(blobUrl);
    // Clean up blob after Instagram fetches it
    await deleteBlob(blobUrl).catch(() => {});
    return NextResponse.json({ storyId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
