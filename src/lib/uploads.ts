import "server-only";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Stored outside /public so runtime uploads are served by a route handler
// (Next only serves files that existed in /public at build time).
export type UploadKind = "products" | "shop";

const BASE_DIR = path.join(process.cwd(), "data", "uploads");
const URL_PREFIX = "/media/";

export function uploadDir(kind: UploadKind): string {
  return path.join(BASE_DIR, kind);
}

const ALLOWED = new Map([
  ["image/webp", "webp"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);
const MAX_BYTES = 4 * 1024 * 1024;

export type SaveImageResult = { url: string | null } | { error: string };

/**
 * Save an uploaded image. The browser converts photos to compact WebP before
 * upload; JPG/PNG are still accepted as a no-JS fallback.
 */
export async function saveImage(
  file: FormDataEntryValue | null,
  kind: UploadKind,
): Promise<SaveImageResult> {
  if (!file || typeof file === "string") return { url: null };
  const f = file as File;
  if (f.size === 0) return { url: null };

  const ext = ALLOWED.get(f.type);
  if (!ext) return { error: "Gambar harus WEBP, JPG, atau PNG." };
  if (f.size > MAX_BYTES) return { error: "Ukuran gambar maksimal 4 MB." };

  const dir = uploadDir(kind);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  const buf = Buffer.from(await f.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return { url: `${URL_PREFIX}${kind}/${name}` };
}

export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(URL_PREFIX)) return;
  const rel = url.slice(URL_PREFIX.length); // "<kind>/<name>"
  const m = /^(products|shop)\/([a-f0-9-]+\.(webp|jpg|jpeg|png))$/i.exec(rel);
  if (!m) return;
  try {
    await unlink(path.join(BASE_DIR, m[1], m[2]));
  } catch {
    // already gone — fine
  }
}
