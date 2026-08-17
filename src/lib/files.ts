import { mkdirSync } from "node:fs";
import { writeFile, rm, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const uploadsDir = path.join(process.cwd(), "uploads");

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
};

export function mimeFor(name: string): string {
  return MIME[path.extname(name).toLowerCase()] || "application/octet-stream";
}

export function safeStoredName(name: string): string {
  return path.basename(name);
}

export function storedPath(name: string): string {
  return path.join(uploadsDir, safeStoredName(name));
}

export async function saveUpload(file: File): Promise<{
  fileName: string;
  storedName: string;
  size: number;
}> {
  mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(file.name).toLowerCase().slice(0, 10);
  const storedName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath(storedName), buffer);
  return { fileName: file.name, storedName, size: buffer.byteLength };
}

export async function deleteUpload(storedName: string): Promise<void> {
  try {
    await rm(storedPath(storedName), { force: true });
  } catch {
    /* file already gone */
  }
}

export async function readUpload(storedName: string): Promise<Buffer> {
  return readFile(storedPath(storedName));
}

export async function fileExists(storedName: string): Promise<boolean> {
  try {
    await readFile(storedPath(storedName));
    return true;
  } catch {
    return false;
  }
}