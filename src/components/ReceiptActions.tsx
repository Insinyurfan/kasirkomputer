"use client";

import { useState } from "react";

const TARGET_ID = "receipt-print-area";

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
    <div className="no-print" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="btn secondary" href={`/receipt/${saleId}/pdf`}>
          Download PDF
        </a>
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
