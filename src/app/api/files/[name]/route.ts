import { NextRequest } from "next/server";
import { readUpload, mimeFor } from "@/lib/files";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  try {
    const data = await readUpload(name);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeFor(name),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}