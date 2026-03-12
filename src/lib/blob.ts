import { put, del } from "@vercel/blob";

export async function uploadToBlob(file: File) {
  const blob = await put(file.name, file, { access: "public" });
  return blob.url;
}

export async function deleteBlob(url: string) {
  await del(url);
}
