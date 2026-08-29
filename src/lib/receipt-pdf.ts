import "server-only";
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { formatRupiah } from "./money";
import type { ReceiptSale, ReceiptSettings } from "@/components/Receipt";

const MM = 2.834645669; // 1mm in pt
const PAGE_W = 80 * MM; // 80mm thermal
const MARGIN_X = 8;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const S = 8; // body font size
const LH = 11; // line height
const RULE_H = 9;
const TOP_PAD = 10;
const BOTTOM_PAD = 14;

const PAYMENT: Record<string, string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
};

function fmtDateTime(v: Date | string): string {
  const d = typeof v === "string" ? new Date(v) : v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Op =
  | { t: "text"; s: string; align: "left" | "center"; bold?: boolean; size?: number }
  | { t: "kv"; l: string; r: string; bold?: boolean }
  | { t: "rule" };

function buildOps(
  sale: ReceiptSale,
  settings: ReceiptSettings,
  charW: number,
): { ops: Op[]; maxChars: number } {
  const maxChars = Math.max(10, Math.floor(CONTENT_W / charW));
  const ops: Op[] = [];
  const push = (o: Op) => ops.push(o);

  const wrap = (txt: string): string[] => {
    const words = String(txt).split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length <= maxChars) cur = next;
      else {
        if (cur) out.push(cur);
        cur = w.length > maxChars ? w.slice(0, maxChars) : w;
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  };
  const center = (txt: string, bold?: boolean, size?: number) =>
    wrap(txt).forEach((l) => push({ t: "text", s: l, align: "center", bold, size }));

  center(settings.shopName, true, S + 2);
  if (settings.address) center(settings.address);
  if (settings.phone) center(`Telp: ${settings.phone}`);
  if (settings.headerNote) center(settings.headerNote);

  push({ t: "rule" });
  push({ t: "kv", l: "No. Nota", r: String(sale.receiptNo) });
  push({ t: "kv", l: "Tanggal", r: fmtDateTime(sale.createdAt) });
  if (sale.cashierName) push({ t: "kv", l: "Kasir", r: sale.cashierName });

  push({ t: "rule" });
  for (const it of sale.items) {
    wrap(it.name).forEach((l) => push({ t: "text", s: l, align: "left" }));
    push({
      t: "kv",
      l: `${it.qty} x ${formatRupiah(it.unitPrice)}`,
      r: formatRupiah(it.lineTotal),
    });
  }

  push({ t: "rule" });
  push({ t: "kv", l: "Subtotal", r: formatRupiah(sale.subtotal) });
  if (sale.discountAmount > 0) {
    const label =
      sale.discountType === "PERCENT"
        ? `Diskon (${sale.discountValue}%)`
        : "Diskon";
    push({ t: "kv", l: label, r: `-${formatRupiah(sale.discountAmount)}` });
  }
  push({ t: "kv", l: "TOTAL", r: formatRupiah(sale.grandTotal), bold: true });

  push({ t: "rule" });
  push({
    t: "kv",
    l: `Bayar (${PAYMENT[sale.paymentMethod] ?? sale.paymentMethod})`,
    r: sale.amountPaid != null ? formatRupiah(sale.amountPaid) : "-",
  });
  if (sale.changeAmount != null) {
    push({ t: "kv", l: "Kembali", r: formatRupiah(sale.changeAmount) });
  }

  if (sale.voided) {
    push({ t: "rule" });
    push({ t: "text", s: "*** DIBATALKAN (VOID) ***", align: "center", bold: true });
    if (sale.voidReason) center(`Alasan: ${sale.voidReason}`);
  }

  if (settings.footerNote) {
    push({ t: "rule" });
    settings.footerNote.split("\n").forEach((line) => center(line));
  }

  return { ops, maxChars };
}

function opHeight(op: Op): number {
  return op.t === "rule" ? RULE_H : LH;
}

function addReceiptPage(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  sale: ReceiptSale,
  settings: ReceiptSettings,
): void {
  const charW = font.widthOfTextAtSize("M", S);
  const { ops, maxChars } = buildOps(sale, settings, charW);
  const height = TOP_PAD + ops.reduce((h, o) => h + opHeight(o), 0) + BOTTOM_PAD;

  const page: PDFPage = doc.addPage([PAGE_W, height]);
  let y = height - TOP_PAD;

  for (const op of ops) {
    if (op.t === "rule") {
      page.drawText("-".repeat(maxChars), {
        x: MARGIN_X,
        y: y - S,
        size: S,
        font,
      });
      y -= RULE_H;
      continue;
    }
    if (op.t === "text") {
      const f = op.bold ? bold : font;
      const size = op.size ?? S;
      const w = f.widthOfTextAtSize(op.s, size);
      const x = op.align === "center" ? MARGIN_X + (CONTENT_W - w) / 2 : MARGIN_X;
      page.drawText(op.s, { x, y: y - size, size, font: f });
      y -= LH;
      continue;
    }
    // kv
    const f = op.bold ? bold : font;
    const rw = f.widthOfTextAtSize(op.r, S);
    page.drawText(op.l, { x: MARGIN_X, y: y - S, size: S, font: f });
    page.drawText(op.r, {
      x: MARGIN_X + CONTENT_W - rw,
      y: y - S,
      size: S,
      font: f,
    });
    y -= LH;
  }
}

async function fonts(doc: PDFDocument) {
  return {
    font: await doc.embedFont(StandardFonts.Courier),
    bold: await doc.embedFont(StandardFonts.CourierBold),
  };
}

/** Single receipt → PDF bytes. */
export async function buildReceiptPdf(
  sale: ReceiptSale,
  settings: ReceiptSettings,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Nota ${sale.receiptNo}`);
  const { font, bold } = await fonts(doc);
  addReceiptPage(doc, font, bold, sale, settings);
  return doc.save();
}

/** Many receipts → one PDF, one page per nota. */
export async function buildReceiptsPdf(
  entries: { sale: ReceiptSale; settings: ReceiptSettings }[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Riwayat Nota");
  const { font, bold } = await fonts(doc);
  for (const e of entries) addReceiptPage(doc, font, bold, e.sale, e.settings);
  return doc.save();
}
