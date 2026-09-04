import "server-only";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { formatRupiah } from "./money";
import {
  effectiveShop,
  type ReceiptSale,
  type ReceiptSettings,
} from "@/components/Receipt";

/* ------------------------------------------------------------------ *
 * Template registry — dipakai UI untuk menawarkan pilihan desain.
 * ------------------------------------------------------------------ */
export const RECEIPT_TEMPLATES = {
  thermal: "Struk Kasir 80mm",
  nota: "Nota Toko (A5)",
  invoice: "Invoice (A4)",
} as const;
export type ReceiptTemplate = keyof typeof RECEIPT_TEMPLATES;

export const DEFAULT_TEMPLATE: ReceiptTemplate = "thermal";

/** Akhiran nama file per template, mis. nota-1004-a5.pdf */
export const TEMPLATE_SLUG: Record<ReceiptTemplate, string> = {
  thermal: "80mm",
  nota: "a5",
  invoice: "a4",
};

export function asTemplate(v: string | null | undefined): ReceiptTemplate {
  return v && v in RECEIPT_TEMPLATES ? (v as ReceiptTemplate) : DEFAULT_TEMPLATE;
}

/* ------------------------------------------------------------------ *
 * Helpers dipakai semua template
 * ------------------------------------------------------------------ */
const PAYMENT: Record<string, string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
};

function payLabel(m: string): string {
  return PAYMENT[m] ?? m;
}

function fmtDateTime(v: Date | string): string {
  const d = typeof v === "string" ? new Date(v) : v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function discountLabel(sale: ReceiptSale): string {
  return sale.discountType === "PERCENT"
    ? `Diskon (${sale.discountValue}%)`
    : "Diskon";
}

/** Angka -> kata (Bahasa Indonesia). Cukup untuk nilai sampai miliaran. */
function terbilang(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "nol";
  const satuan = [
    "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan",
    "sembilan", "sepuluh", "sebelas",
  ];
  const below1000 = (x: number): string => {
    if (x === 0) return "";
    if (x < 12) return satuan[x];
    if (x < 20) return `${below1000(x - 10)} belas`;
    if (x < 100) {
      const p = Math.floor(x / 10);
      const r = x % 10;
      return `${satuan[p]} puluh${r ? ` ${satuan[r]}` : ""}`;
    }
    const h = Math.floor(x / 100);
    const r = x % 100;
    const head = h === 1 ? "seratus" : `${satuan[h]} ratus`;
    return `${head}${r ? ` ${below1000(r)}` : ""}`;
  };
  const units: { v: number; name: string }[] = [
    { v: 1_000_000_000, name: "miliar" },
    { v: 1_000_000, name: "juta" },
    { v: 1_000, name: "ribu" },
  ];
  let out = "";
  let rem = n;
  for (const u of units) {
    if (rem >= u.v) {
      const q = Math.floor(rem / u.v);
      rem %= u.v;
      out += u.v === 1000 && q === 1 ? "seribu " : `${below1000(q)} ${u.name} `;
    }
  }
  if (rem > 0) out += `${below1000(rem)} `;
  return out.trim().replace(/\s+/g, " ");
}

function terbilangRupiah(value: number): string {
  const s = `${terbilang(value)} rupiah`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function wrapByWidth(
  str: string,
  font: PDFFont,
  size: number,
  maxW: number,
): string[] {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (!cur || font.widthOfTextAtSize(t, size) <= maxW) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

type Fonts = {
  courier: PDFFont;
  courierBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
  sansItalic: PDFFont;
};

async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  return {
    courier: await doc.embedFont(StandardFonts.Courier),
    courierBold: await doc.embedFont(StandardFonts.CourierBold),
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
    sansItalic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
}

/* ================================================================== *
 * TEMPLATE 1 — Struk kasir thermal 80mm (monospace)
 * ================================================================== */
const MM = 2.834645669;
const T_PAGE_W = 80 * MM;
const T_MARGIN_X = 8;
const T_CONTENT_W = T_PAGE_W - T_MARGIN_X * 2;
const T_S = 8;
const T_LH = 11;
const T_RULE_H = 9;
const T_TOP_PAD = 10;
const T_BOTTOM_PAD = 14;

type Op =
  | { t: "text"; s: string; align: "left" | "center"; bold?: boolean; size?: number }
  | { t: "kv"; l: string; r: string; bold?: boolean }
  | { t: "rule" };

function buildThermalOps(
  sale: ReceiptSale,
  settings: ReceiptSettings,
  charW: number,
): { ops: Op[]; maxChars: number } {
  const maxChars = Math.max(10, Math.floor(T_CONTENT_W / charW));
  const ops: Op[] = [];
  const push = (o: Op) => ops.push(o);
  const wrap = (txt: string) => {
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
    wrap(txt).forEach((l) =>
      push({ t: "text", s: l, align: "center", bold, size }),
    );

  const shop = effectiveShop(sale, settings);
  center(shop.name, true, T_S + 2);
  if (shop.address) center(shop.address);
  if (shop.phone) center(`Telp: ${shop.phone}`);
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
    push({
      t: "kv",
      l: discountLabel(sale),
      r: `-${formatRupiah(sale.discountAmount)}`,
    });
  }
  push({ t: "kv", l: "TOTAL", r: formatRupiah(sale.grandTotal), bold: true });

  push({ t: "rule" });
  push({
    t: "kv",
    l: `Bayar (${payLabel(sale.paymentMethod)})`,
    r: sale.amountPaid != null ? formatRupiah(sale.amountPaid) : "-",
  });
  if (sale.changeAmount != null)
    push({ t: "kv", l: "Kembali", r: formatRupiah(sale.changeAmount) });

  if (sale.voided) {
    push({ t: "rule" });
    push({
      t: "text",
      s: "*** DIBATALKAN (VOID) ***",
      align: "center",
      bold: true,
    });
    if (sale.voidReason) center(`Alasan: ${sale.voidReason}`);
  }

  if (settings.footerNote) {
    push({ t: "rule" });
    settings.footerNote.split("\n").forEach((line) => center(line));
  }
  return { ops, maxChars };
}

function addThermalPage(
  doc: PDFDocument,
  f: Fonts,
  sale: ReceiptSale,
  settings: ReceiptSettings,
): void {
  const charW = f.courier.widthOfTextAtSize("M", T_S);
  const { ops, maxChars } = buildThermalOps(sale, settings, charW);
  const height =
    T_TOP_PAD +
    ops.reduce((h, o) => h + (o.t === "rule" ? T_RULE_H : T_LH), 0) +
    T_BOTTOM_PAD;

  const page = doc.addPage([T_PAGE_W, height]);
  let y = height - T_TOP_PAD;

  for (const op of ops) {
    if (op.t === "rule") {
      page.drawText("-".repeat(maxChars), {
        x: T_MARGIN_X,
        y: y - T_S,
        size: T_S,
        font: f.courier,
      });
      y -= T_RULE_H;
      continue;
    }
    if (op.t === "text") {
      const font = op.bold ? f.courierBold : f.courier;
      const size = op.size ?? T_S;
      const w = font.widthOfTextAtSize(op.s, size);
      const x =
        op.align === "center"
          ? T_MARGIN_X + (T_CONTENT_W - w) / 2
          : T_MARGIN_X;
      page.drawText(op.s, { x, y: y - size, size, font });
      y -= T_LH;
      continue;
    }
    const font = op.bold ? f.courierBold : f.courier;
    const rw = font.widthOfTextAtSize(op.r, T_S);
    page.drawText(op.l, { x: T_MARGIN_X, y: y - T_S, size: T_S, font });
    page.drawText(op.r, {
      x: T_MARGIN_X + T_CONTENT_W - rw,
      y: y - T_S,
      size: T_S,
      font,
    });
    y -= T_LH;
  }
}

/* ================================================================== *
 * TEMPLATE 2 & 3 — kertas A5 / A4 (sans-serif, tabel bergaris)
 * ================================================================== */
const INK = rgb(0.09, 0.11, 0.15);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.8, 0.82, 0.85);
const ZEBRA = rgb(0.965, 0.968, 0.973);
const BRAND = rgb(0.12, 0.16, 0.24);
const VOID_RED = rgb(0.7, 0.12, 0.12);
const WHITE = rgb(1, 1, 1);

type Sheet = {
  page: PDFPage;
  f: Fonts;
  H: number;
  y: number; // cursor: jarak dari tepi atas halaman
};

/** pdf-y untuk baseline teks / garis pada posisi cursor sekarang. */
function py(s: Sheet, dy = 0): number {
  return s.H - s.y - dy;
}

type TextOpts = {
  size?: number;
  font?: PDFFont;
  color?: RGB;
  align?: "left" | "right" | "center";
  width?: number;
};

function put(s: Sheet, str: string, x: number, opts: TextOpts = {}): void {
  const size = opts.size ?? 9;
  const font = opts.font ?? s.f.sans;
  const w = font.widthOfTextAtSize(str, size);
  let tx = x;
  if (opts.align === "right") tx = x - w;
  else if (opts.align === "center") tx = x + ((opts.width ?? 0) - w) / 2;
  s.page.drawText(str, {
    x: tx,
    y: py(s, size),
    size,
    font,
    color: opts.color ?? INK,
  });
}

function hline(s: Sheet, x1: number, x2: number, color: RGB = LINE, thickness = 0.75) {
  s.page.drawLine({
    start: { x: x1, y: py(s) },
    end: { x: x2, y: py(s) },
    thickness,
    color,
  });
}

type PaperOpts = {
  W: number;
  H: number;
  M: number;
  title: string;
  base: number;
  accentBand: boolean;
};

function addPaperPage(
  doc: PDFDocument,
  f: Fonts,
  sale: ReceiptSale,
  settings: ReceiptSettings,
  o: PaperOpts,
): void {
  const page = doc.addPage([o.W, o.H]);
  const s: Sheet = { page, f, H: o.H, y: o.M };
  const shop = effectiveShop(sale, settings);
  const R = o.W - o.M; // tepi kanan
  const CW = o.W - o.M * 2;
  const b = o.base;
  const adv = (dy: number) => {
    s.y += dy;
  };
  const para = (str: string, x: number, opts: TextOpts & { max: number }) => {
    for (const ln of wrapByWidth(str, opts.font ?? f.sans, opts.size ?? b, opts.max)) {
      put(s, ln, x, opts);
      adv((opts.size ?? b) + 3);
    }
  };

  /* ---- Kop ---- */
  if (o.accentBand) {
    const bandH = o.M + 42;
    page.drawRectangle({ x: 0, y: o.H - bandH, width: o.W, height: bandH, color: BRAND });
    put(s, shop.name, o.M, { size: b + 7, font: f.sansBold, color: WHITE });
    put(s, o.title.toUpperCase(), R, {
      size: b + 7,
      font: f.sansBold,
      color: WHITE,
      align: "right",
    });
    adv(b + 12);
    para(
      [shop.address, shop.phone ? `Telp ${shop.phone}` : ""].filter(Boolean).join("   "),
      o.M,
      { size: b - 2, color: rgb(0.82, 0.85, 0.9), max: CW },
    );
    s.y = bandH + 18;
  } else {
    put(s, shop.name, o.M, { size: b + 5, font: f.sansBold });
    put(s, o.title.toUpperCase(), R, {
      size: b + 9,
      font: f.sansBold,
      color: MUTED,
      align: "right",
    });
    adv(b + 8);
    para(shop.address, o.M, { size: b - 2, color: MUTED, max: CW * 0.6 });
    if (shop.phone) {
      put(s, `Telp ${shop.phone}`, o.M, { size: b - 2, color: MUTED });
      adv(b);
    }
    adv(6);
    hline(s, o.M, R, INK, 1);
    adv(15);
  }

  /* ---- Meta nota ---- */
  const metaTop = s.y;
  const kv = (k: string, v: string) => {
    put(s, k, o.M, { size: b - 2, color: MUTED });
    put(s, v, o.M + 76, { size: b, font: f.sansBold });
    adv(b + 4);
  };
  kv("No. Nota", `#${sale.receiptNo}`);
  kv("Tanggal", fmtDateTime(sale.createdAt));
  if (sale.cashierName) kv("Kasir", sale.cashierName);
  const metaLeftBottom = s.y;

  s.y = metaTop;
  put(s, "Metode Bayar", R, { size: b - 2, color: MUTED, align: "right" });
  adv(b + 4);
  put(s, payLabel(sale.paymentMethod), R, { size: b, font: f.sansBold, align: "right" });
  adv(b + 4);
  if (settings.headerNote) {
    put(s, settings.headerNote, R, { size: b - 2, color: MUTED, align: "right" });
    adv(b + 4);
  }
  s.y = Math.max(metaLeftBottom, s.y) + 12;

  /* ---- Tabel item ---- */
  const amtX = R;
  const priceX = R - 8.6 * b;
  const qtyX = priceX - 6.4 * b;
  const nameX = o.M + 6;
  const nameMax = qtyX - 3.4 * b - nameX;

  const thH = b + 9;
  page.drawRectangle({ x: o.M, y: py(s, thH), width: CW, height: thH, color: BRAND });
  adv(6);
  put(s, "Nama Barang", nameX, { size: b - 1, font: f.sansBold, color: WHITE });
  put(s, "Qty", qtyX, { size: b - 1, font: f.sansBold, color: WHITE, align: "right" });
  put(s, "Harga", priceX, { size: b - 1, font: f.sansBold, color: WHITE, align: "right" });
  put(s, "Jumlah", amtX, { size: b - 1, font: f.sansBold, color: WHITE, align: "right" });
  adv(thH - 6);

  sale.items.forEach((it, i) => {
    const lines = wrapByWidth(it.name, f.sans, b, nameMax);
    const rowH = Math.max(b + 8, lines.length * (b + 2) + 7);
    if (i % 2 === 1) {
      page.drawRectangle({ x: o.M, y: py(s, rowH), width: CW, height: rowH, color: ZEBRA });
    }
    const rowTop = s.y;
    adv(5.5);
    for (const ln of lines) {
      put(s, ln, nameX, { size: b });
      adv(b + 2);
    }
    s.y = rowTop + 5.5;
    put(s, String(it.qty), qtyX, { size: b, align: "right" });
    put(s, formatRupiah(it.unitPrice), priceX, { size: b, align: "right" });
    put(s, formatRupiah(it.lineTotal), amtX, { size: b, align: "right", font: f.sansBold });
    s.y = rowTop + rowH;
    hline(s, o.M, R);
  });
  adv(14);

  /* ---- Ringkasan ---- */
  const sumX = qtyX;
  const sumRow = (label: string, value: string, strong = false) => {
    put(s, label, sumX, {
      size: strong ? b + 1 : b,
      color: strong ? INK : MUTED,
      font: strong ? f.sansBold : f.sans,
    });
    put(s, value, R, {
      size: strong ? b + 2 : b,
      align: "right",
      font: f.sansBold,
      color: strong ? INK : INK,
    });
    adv(strong ? b + 7 : b + 5);
  };
  sumRow("Subtotal", formatRupiah(sale.subtotal));
  if (sale.discountAmount > 0)
    sumRow(discountLabel(sale), `-${formatRupiah(sale.discountAmount)}`);
  adv(2);
  hline(s, sumX, R, INK, 1);
  adv(9);
  sumRow("TOTAL", formatRupiah(sale.grandTotal), true);
  adv(3);
  sumRow(`Bayar (${payLabel(sale.paymentMethod)})`,
    sale.amountPaid != null ? formatRupiah(sale.amountPaid) : "-");
  if (sale.changeAmount != null)
    sumRow("Kembali", formatRupiah(sale.changeAmount));

  /* ---- Terbilang ---- */
  adv(12);
  put(s, "Terbilang", o.M, { size: b - 2, color: MUTED });
  adv(b + 2);
  para(`# ${terbilangRupiah(sale.grandTotal)} #`, o.M, {
    size: b,
    font: f.sansItalic,
    max: CW * 0.72,
  });

  /* ---- Void ---- */
  if (sale.voided) {
    adv(10);
    put(s, "*** NOTA DIBATALKAN (VOID) ***", o.M, {
      size: b + 1,
      font: f.sansBold,
      color: VOID_RED,
    });
    adv(b + 4);
    if (sale.voidReason) {
      put(s, `Alasan: ${sale.voidReason}`, o.M, { size: b, color: VOID_RED });
      adv(b + 4);
    }
  }

  /* ---- Tanda tangan (jangkar dari bawah) ---- */
  s.y = o.H - o.M - 58;
  const colB = o.M + CW * 0.6;
  put(s, "Hormat kami,", o.M, { size: b, color: MUTED });
  put(s, "Penerima,", colB, { size: b, color: MUTED });
  adv(42);
  hline(s, o.M, o.M + 135);
  hline(s, colB, colB + 135);
  adv(b + 3);
  put(s, `( ${sale.cashierName ?? "................." } )`, o.M, { size: b - 1 });
  put(s, "( ................................ )", colB, { size: b - 1 });

  /* ---- Footer note ---- */
  if (settings.footerNote) {
    s.y = o.H - o.M + 4;
    for (const line of settings.footerNote.split("\n")) {
      put(s, line, o.M, { size: b - 2, color: MUTED, align: "center", width: CW });
      adv(b);
    }
  }
}

function addNotaA5Page(
  doc: PDFDocument,
  f: Fonts,
  sale: ReceiptSale,
  settings: ReceiptSettings,
): void {
  addPaperPage(doc, f, sale, settings, {
    W: 419.53,
    H: 595.28,
    M: 34,
    title: "Nota",
    base: 8.5,
    accentBand: false,
  });
}

function addInvoiceA4Page(
  doc: PDFDocument,
  f: Fonts,
  sale: ReceiptSale,
  settings: ReceiptSettings,
): void {
  addPaperPage(doc, f, sale, settings, {
    W: 595.28,
    H: 841.89,
    M: 48,
    title: "Invoice",
    base: 9.5,
    accentBand: true,
  });
}

/* ================================================================== *
 * API publik
 * ================================================================== */
const RENDERERS: Record<
  ReceiptTemplate,
  (doc: PDFDocument, f: Fonts, sale: ReceiptSale, settings: ReceiptSettings) => void
> = {
  thermal: addThermalPage,
  nota: addNotaA5Page,
  invoice: addInvoiceA4Page,
};

/** Satu nota → PDF. */
export async function buildReceiptPdf(
  sale: ReceiptSale,
  settings: ReceiptSettings,
  template: ReceiptTemplate = DEFAULT_TEMPLATE,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Nota ${sale.receiptNo}`);
  const f = await loadFonts(doc);
  RENDERERS[template](doc, f, sale, settings);
  return doc.save();
}

/** Banyak nota → satu PDF, satu halaman per nota. */
export async function buildReceiptsPdf(
  entries: { sale: ReceiptSale; settings: ReceiptSettings }[],
  template: ReceiptTemplate = DEFAULT_TEMPLATE,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Riwayat Nota");
  const f = await loadFonts(doc);
  for (const e of entries) RENDERERS[template](doc, f, e.sale, e.settings);
  return doc.save();
}
