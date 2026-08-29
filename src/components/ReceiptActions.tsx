"use client";

import { useState } from "react";

const TARGET_ID = "receipt-print-area";

function getNode(): HTMLElement {
  const el = document.getElementById(TARGET_ID);
  if (!el) throw new Error("Receipt element not found");
  return el;
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function ReceiptActions({ receiptNo }: { receiptNo: number }) {
  const [busy, setBusy] = useState<null | "pdf" | "jpg">(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadJpg() {
    setBusy("jpg");
    setError(null);
    try {
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(getNode(), {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      triggerDownload(dataUrl, `nota-${receiptNo}.jpg`);
    } catch {
      setError("Gagal membuat JPG.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const [{ toPng }, jspdfMod] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const node = getNode();
      const dataUrl = await toPng(node, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const jsPDF = jspdfMod.jsPDF ?? jspdfMod.default;
      const pdf = new jsPDF({
        orientation: height >= width ? "portrait" : "landscape",
        unit: "px",
        format: [width, height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`nota-${receiptNo}.pdf`);
    } catch {
      setError("Gagal membuat PDF.");
    } finally {
      setBusy(null);
    }
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div className="no-print" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="btn secondary"
          type="button"
          onClick={downloadPdf}
          disabled={busy !== null}
        >
          {busy === "pdf" ? "Memproses…" : "Download PDF"}
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={downloadJpg}
          disabled={busy !== null}
        >
          {busy === "jpg" ? "Memproses…" : "Download JPG"}
        </button>
        <button
          className="btn"
          type="button"
          onClick={printReceipt}
          disabled={busy !== null}
        >
          Print Nota
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
