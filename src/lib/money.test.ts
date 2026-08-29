import { describe, it, expect } from "vitest";
import { formatRupiah, parseRupiah } from "./money";

describe("formatRupiah", () => {
  it("formats zero", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });
  it("formats thousands with a dot separator", () => {
    expect(formatRupiah(150000)).toBe("Rp 150.000");
  });
  it("formats millions", () => {
    expect(formatRupiah(1400000)).toBe("Rp 1.400.000");
  });
  it("formats negative change", () => {
    expect(formatRupiah(-5000)).toBe("-Rp 5.000");
  });
});

describe("parseRupiah", () => {
  it("strips separators and currency text", () => {
    expect(parseRupiah("Rp 700.000")).toBe(700000);
    expect(parseRupiah("700000")).toBe(700000);
    expect(parseRupiah("")).toBe(0);
  });
});
