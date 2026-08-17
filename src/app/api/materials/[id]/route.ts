import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveUpload, deleteUpload } from "@/lib/files";
import type { Material, MaterialType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_TYPES: MaterialType[] = ["notes", "pdf", "video", "image", "file"];

function getString(field: string): string {
  if (typeof field === "string") return field.trim();
  return "";
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = db.prepare("SELECT * FROM materials WHERE id = ?").get(Number(id)) as
    | Material
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const existing = db.prepare("SELECT * FROM materials WHERE id = ?").get(Number(id)) as
    | Material
    | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let title: string | undefined;
  let type: MaterialType | undefined;
  let subject: string | undefined;
  let url: string | undefined;
  let content: string | undefined;
  let favorite: number | undefined;
  let file: File | null = null;
  let removeFile = false;

  if (isJson) {
    const body = await req.json();
    title = body.title;
    type = body.type;
    subject = body.subject;
    url = body.url;
    content = body.content;
    favorite = body.favorite;
    removeFile = Boolean(body.removeFile);
  } else {
    const formData = await req.formData();
    const rawTitle = formData.get("title");
    if (rawTitle) title = getString(rawTitle as string);
    const rawType = formData.get("type");
    if (rawType) type = rawType as MaterialType;
    const rawSubject = formData.get("subject");
    if (rawSubject) subject = getString(rawSubject as string);
    const rawUrl = formData.get("url");
    if (rawUrl) url = getString(rawUrl as string);
    const rawContent = formData.get("content");
    if (rawContent) content = getString(rawContent as string);
    const rawFav = formData.get("favorite");
    if (rawFav) favorite = Number(rawFav);
    file = (formData.get("file") as File | null) ?? null;
    removeFile = formData.get("removeFile") === "1";
  }

  const finalTitle = title !== undefined ? title : existing.title;
  const finalType = (type && ALLOWED_TYPES.includes(type) ? type : existing.type) as MaterialType;
  const finalSubject = subject !== undefined ? subject : existing.subject;
  const finalUrl = url !== undefined ? url : existing.url;
  const finalContent = content !== undefined ? content : existing.content;
  const finalFavorite = favorite !== undefined ? favorite : existing.favorite;

  let filePath = existing.file_path;
  let fileName = existing.file_name;
  let fileSize = existing.file_size;

  if (file && file.size > 0) {
    const info = await saveUpload(file);
    if (existing.file_path) await deleteUpload(existing.file_path);
    filePath = info.storedName;
    fileName = info.fileName;
    fileSize = info.size;
  } else if (removeFile && existing.file_path) {
    await deleteUpload(existing.file_path);
    filePath = null;
    fileName = null;
    fileSize = null;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE materials
       SET title = ?, type = ?, subject = ?, content = ?, url = ?,
           file_name = ?, file_path = ?, file_size = ?, favorite = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    finalTitle,
    finalType,
    finalSubject,
    finalContent || null,
    finalUrl || null,
    fileName,
    filePath,
    fileSize,
    finalFavorite,
    now,
    Number(id)
  );

  const row = db.prepare("SELECT * FROM materials WHERE id = ?").get(Number(id));
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const existing = db.prepare("SELECT * FROM materials WHERE id = ?").get(Number(id)) as
    | Material
    | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.file_path) await deleteUpload(existing.file_path);
  db.prepare("DELETE FROM materials WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}