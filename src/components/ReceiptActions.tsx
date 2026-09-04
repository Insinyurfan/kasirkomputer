"use client";

import { useState } from "react";

const TARGET_ID = "receipt-print-area";

const PDF_TEMPLATES: { tpl: string; label: string }[] = [
  { tpl: "thermal", label: "Struk 80mm" },
  { tpl: "nota", label: "Nota A5" },
  { tpl: "invoice", label: "Invoice A4" },
];

function getNode(): HTMLElement {
  const el = document.getElementById(TARGET_ID);
  if (!el) throw new Error("Receipt element not found");
  return el;
}

export function ReceiptActions({
  saleId,
  receiptNo,
}: {
  saleId: number;
  receiptNo: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadJpg() {
    setBusy(true);
    setError(null);
    try {
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(getNode(), {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 3,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `nota-${receiptNo}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError("Gagal membuat JPG.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print receipt-actions">
      <div className="receipt-actions-row">
        <span className="receipt-actions-label">Unduh PDF —</span>
        {PDF_TEMPLATES.map((t) => (
          <a
            key={t.tpl}
            className="btn btn-sm secondary"
            href={`/receipt/${saleId}/pdf?tpl=${t.tpl}`}
          >
            {t.label}
          </a>
        ))}
      </div>
      <div className="receipt-actions-row">
        <button
          className="btn secondary"
          type="button"
          onClick={downloadJpg}
          disabled={busy}
        >
          {busy ? "Memproses…" : "Download JPG"}
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => window.print()}
          disabled={busy}
        >
          Print Nota
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
