import { describe, it, expect } from "vitest";
import {
  computeTotals,
  discountAmountOf,
  grandTotalOf,
  subtotalOf,
} from "./totals";

const lines = [
  { unitPrice: 700000, qty: 2 }, // 1.400.000
  { unitPrice: 150000, qty: 1 }, // 150.000
];

describe("subtotal", () => {
  it("sums line totals", () => {
    expect(subtotalOf(lines)).toBe(1550000);
  });
});

describe("discountAmountOf", () => {
  it("no discount", () => {
    expect(discountAmountOf(850000, "NONE", 0)).toBe(0);
  });
  it("amount discount", () => {
    expect(discountAmountOf(850000, "AMOUNT", 50000)).toBe(50000);
  });
  it("percent discount uses floor", () => {
    expect(discountAmountOf(850000, "PERCENT", 10)).toBe(85000);
    expect(discountAmountOf(855, "PERCENT", 10)).toBe(85); // floor(85.5)
  });
  it("amount discount cannot exceed subtotal", () => {
    expect(discountAmountOf(100000, "AMOUNT", 150000)).toBe(100000);
  });
});

describe("grandTotal", () => {
  it("never goes negative", () => {
    expect(grandTotalOf(100000, 150000)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("computes change for cash", () => {
    const t = computeTotals(lines, "PERCENT", 10, 1500000);
    expect(t.subtotal).toBe(1550000);
    expect(t.discountAmount).toBe(155000);
    expect(t.grandTotal).toBe(1395000);
    expect(t.change).toBe(105000);
  });
  it("no change when amountPaid is null", () => {
    const t = computeTotals(lines, "NONE", 0, null);
    expect(t.change).toBeNull();
  });
});
