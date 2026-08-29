// All monetary values in this app are whole Rupiah stored as integers.

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 700000 -> "Rp 700.000" ; -5000 -> "-Rp 5.000" */
export function formatRupiah(value: number): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  // Intl gives "Rp 700.000" in some runtimes and "Rp700.000" in others; normalize.
  const formatted = idr.format(Math.abs(n)).replace(/^Rp\s?/, "Rp ");
  return n < 0 ? `-${formatted}` : formatted;
}

/** Parse user input like "700.000", "Rp 700000", "700000" into an integer. */
export function parseRupiah(input: string): number {
  const digits = String(input).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
