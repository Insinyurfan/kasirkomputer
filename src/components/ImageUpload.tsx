"use client";

import { useRef, useState } from "react";

/* eslint-disable @next/next/no-img-element */

async function toWebp(file: File, maxSide: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > maxSide || height > maxSide) {
    const scale = maxSide / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", 0.8),
  );
  if (!blob) return file;
  return new File([blob], "upload.webp", { type: "image/webp" });
}

export function ImageUpload({
  name,
  label,
  currentUrl,
  removeName,
  shape = "square",
  maxSide = 1000,
}: {
  name: string;
  label: string;
  currentUrl: string | null | undefined;
  removeName?: string;
  shape?: "square" | "wide";
  maxSide?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setNote("File bukan gambar.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const webp = await toWebp(file, maxSide);
      const dt = new DataTransfer();
      dt.items.add(webp);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(URL.createObjectURL(webp));
      setRemove(false);
      const kb = Math.max(1, Math.round(webp.size / 1024));
      setNote(`Dikompres jadi WebP · ~${kb} KB`);
    } catch {
      setNote("Gagal memproses gambar, coba file lain.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="image-upload">
        <div className={`image-upload-preview ${shape}`}>
          {preview && !remove ? (
            <img src={preview} alt="" />
          ) : (
            <span className="image-upload-empty">Tidak ada gambar</span>
          )}
        </div>
        <div className="image-upload-body">
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="file"
            accept="image/*"
            onChange={onChange}
          />
          <p className="hint">
            {busy ? "Memproses…" : note || "PNG / JPG / WEBP — otomatis dikompres ke WebP."}
          </p>
          {removeName && currentUrl ? (
            <label className="auth-check">
              <input
                type="checkbox"
                name={removeName}
                value="1"
                checked={remove}
                onChange={(e) => {
                  setRemove(e.target.checked);
                  if (e.target.checked && inputRef.current) inputRef.current.value = "";
                }}
              />
              <span>Hapus gambar saat ini</span>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
