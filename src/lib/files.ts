import { put, del } from "@vercel/blob";
import crypto from "node:crypto";

export interface UploadInfo {
  fileName: string;
  storedName: string;
  size: number;
}

/**
 * Stores an uploaded file in Vercel Blob and returns its public URL.
 * The returned URL is persisted in the `file_path` column.
 */
export async function saveUpload(file: File): Promise<UploadInfo> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "File storage is not configured yet. Connect a Vercel Blob store to your project (or add BLOB_READ_WRITE_TOKEN to your .env.local)."
    );
  }
  const ext = file.name.includes(".")
    ? "." + file.name.split(".").pop()!.toLowerCase().slice(0, 10)
    : "";
  const pathname = `materials/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const { url } = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return { fileName: file.name, storedName: url, size: file.size };
}

export async function deleteUpload(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    /* blob already gone */
  }
}