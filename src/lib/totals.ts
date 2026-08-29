// Pure sale-total math, shared by the POS screen and the "complete sale" action
// so the preview and the persisted record always agree.

export type DiscountType = "NONE" | "AMOUNT" | "PERCENT";

export type CartLine = {
  unitPrice: number;
  qty: number;
};

export function lineTotal(line: CartLine): number {
  return Math.max(0, Math.trunc(line.unitPrice)) * Math.max(1, Math.trunc(line.qty));
}

export function subtotalOf(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

/** Resolve a discount to a whole-Rupiah amount, never more than the subtotal. */
export function discountAmountOf(
  subtotal: number,
  type: DiscountType,
  value: number,
): number {
  if (subtotal <= 0) return 0;
  const v = Math.max(0, Math.trunc(value || 0));
  if (type === "AMOUNT") return Math.min(v, subtotal);
  if (type === "PERCENT") {
    const pct = Math.min(v, 100);
    return Math.min(Math.floor((subtotal * pct) / 100), subtotal);
  }
  return 0;
}

export function grandTotalOf(subtotal: number, discountAmount: number): number {
  return Math.max(0, subtotal - discountAmount);
}

export function changeOf(
  grandTotal: number,
  amountPaid: number | null | undefined,
): number | null {
  if (amountPaid == null || Number.isNaN(amountPaid)) return null;
  return Math.trunc(amountPaid) - grandTotal;
}

export type ComputedTotals = {
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  change: number | null;
};

export function computeTotals(
  lines: CartLine[],
  discountType: DiscountType,
  discountValue: number,
  amountPaid: number | null | undefined,
): ComputedTotals {
  const subtotal = subtotalOf(lines);
  const discountAmount = discountAmountOf(subtotal, discountType, discountValue);
  const grandTotal = grandTotalOf(subtotal, discountAmount);
  return {
    subtotal,
    discountAmount,
    grandTotal,
    change: changeOf(grandTotal, amountPaid),
  };
}
