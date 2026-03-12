import { NextResponse } from "next/server";
import { uploadToBlob } from "@/lib/blob";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "video/mp4"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  const maxSize = file.type.startsWith("video/") ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const url = await uploadToBlob(file);
  return NextResponse.json({ url });
}
