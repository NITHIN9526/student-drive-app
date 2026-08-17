import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/files";
import type { MaterialType } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: MaterialType[] = ["notes", "pdf", "video", "image", "file"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type");
  const subject = searchParams.get("subject");
  const favorite = searchParams.get("favorite");

  let sql = "SELECT * FROM materials";
  const where: string[] = [];
  const params: string[] = [];

  if (q) {
    where.push("(title LIKE ? OR subject LIKE ? OR content LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (type && type !== "all") {
    where.push("type = ?");
    params.push(type);
  }
  if (subject && subject !== "all") {
    where.push("subject = ?");
    params.push(subject);
  }
  if (favorite === "1") where.push("favorite = 1");

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY updated_at DESC, id DESC";

  const rows = db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "notes") as MaterialType;
  const subject = String(formData.get("subject") || "General").trim();
  const url = String(formData.get("url") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const file = (formData.get("file") as File | null) ?? null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  let fileInfo: { fileName: string; storedName: string; size: number } | null =
    null;
  if (file && file.size > 0) {
    fileInfo = await saveUpload(file);
  }

  if (type === "video" && !url) {
    return NextResponse.json(
      { error: "A YouTube link is required for videos" },
      { status: 400 }
    );
  }
  if ((type === "pdf" || type === "image" || type === "file") && !fileInfo && !url) {
    return NextResponse.json(
      { error: "Attach a file or add a link" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO materials
        (title, type, subject, content, url, file_name, file_path, file_size, favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(
      title,
      type,
      subject,
      content || null,
      url || null,
      fileInfo?.fileName ?? null,
      fileInfo?.storedName ?? null,
      fileInfo?.size ?? null,
      now,
      now
    );

  const id = Number(result.lastInsertRowid);
  const row = db.prepare("SELECT * FROM materials WHERE id = ?").get(id);
  return NextResponse.json(row, { status: 201 });
}