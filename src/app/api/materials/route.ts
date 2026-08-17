import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { saveUpload } from "@/lib/files";
import type { MaterialType } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: MaterialType[] = ["notes", "pdf", "video", "image", "file"];

export async function GET(req: NextRequest) {
  await initDb();
  const db = getDb();
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type");
  const subject = searchParams.get("subject");
  const favorite = searchParams.get("favorite");

  let sql = "SELECT * FROM materials";
  const where: string[] = [];
  const args: (string | number)[] = [];

  if (q) {
    where.push("(title LIKE ? OR subject LIKE ? OR content LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (type && type !== "all") {
    where.push("type = ?");
    args.push(type);
  }
  if (subject && subject !== "all") {
    where.push("subject = ?");
    args.push(subject);
  }
  if (favorite === "1") where.push("favorite = 1");

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY updated_at DESC, id DESC";

  const { rows } = await db.execute({ sql, args });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
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
    const result = await db.execute({
      sql: `INSERT INTO materials
        (title, type, subject, content, url, file_name, file_path, file_size, favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [
        title,
        type,
        subject,
        content || null,
        url || null,
        fileInfo?.fileName ?? null,
        fileInfo?.storedName ?? null,
        fileInfo?.size ?? null,
        now,
        now,
      ],
    });

    const id = Number(result.lastInsertRowid);
    const { rows } = await db.execute({
      sql: "SELECT * FROM materials WHERE id = ?",
      args: [id],
    });
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}