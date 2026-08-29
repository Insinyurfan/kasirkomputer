import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir, type UploadKind } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; name: string }> },
) {
  const { kind, name } = await params;
  if (kind !== "products" && kind !== "shop") {
    return new NextResponse(null, { status: 404 });
  }
  if (!/^[a-f0-9-]+\.(webp|jpg|jpeg|png)$/i.test(name)) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const buf = await readFile(path.join(uploadDir(kind as UploadKind), name));
    const ext = name.split(".").pop()!.toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
