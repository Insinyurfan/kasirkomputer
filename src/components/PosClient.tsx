"use client";

import { useMemo, useState, useTransition } from "react";
import { formatRupiah, parseRupiah } from "@/lib/money";
import { computeTotals, type DiscountType } from "@/lib/totals";
import { completeSale } from "@/app/actions/sales";
import { ProductImage } from "@/components/ProductImage";

type Product = {
  id: number;
  name: string;
  code: string | null;
  unitPrice: number;
  imageUrl: string | null;
  categoryId: number | null;
};

type Category = { id: number; name: string };

type Line = { productId: number; name: string; unitPrice: number; qty: number };

type PaymentMethod = "CASH" | "TRANSFER" | "QRIS";

export function PosClient({
  products,
  categories,
  popularIds,
  cashierName,
}: {
  products: Product[];
  categories: Category[];
  popularIds: number[];
  cashierName: string;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [lines, setLines] = useState<Line[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValueStr, setDiscountValueStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaidStr, setAmountPaidStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const popularSet = useMemo(() => new Set(popularIds), [popularIds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (tab === "popular" && !popularSet.has(p.id)) return false;
      if (tab !== "all" && tab !== "popular" && String(p.categoryId) !== tab) {
        return false;
      }
      if (!q) return true;
      return `${p.name} ${p.code ?? ""}`.toLowerCase().includes(q);
    });
  }, [products, query, tab, popularSet]);

  const discountValue =
    discountType === "NONE" ? 0 : parseRupiah(discountValueStr);
  const amountPaid =
    paymentMethod === "CASH" && amountPaidStr.trim() !== ""
      ? parseRupiah(amountPaidStr)
      : null;

  const totals = computeTotals(lines, discountType, discountValue, amountPaid);
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);

  function addProduct(p: Product) {
    setError(null);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, unitPrice: p.unitPrice, qty: 1 }];
    });
  }

  function bumpQty(productId: number, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + delta } : l,
        )
        .filter((l) => l.qty >= 1),
    );
  }

  function removeLine(productId: number) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function resetSale() {
    setLines([]);
    setDiscountType("NONE");
    setDiscountValueStr("");
    setAmountPaidStr("");
    setError(null);
  }

  function submit() {
    setError(null);
    if (lines.length === 0) {
      setError("Tambahkan minimal satu item.");
      return;
    }
    startTransition(async () => {
      const res = await completeSale({
        lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        discountType,
        discountValue,
        paymentMethod,
        amountPaid,
      });
      if (res?.error) setError(res.error);
    });
  }

  const underpaid =
    paymentMethod === "CASH" &&
    amountPaid != null &&
    amountPaid < totals.grandTotal;

  return (
    <div className="pos">
      {/* -------- order panel -------- */}
      <section className="pos-order">
        <div className="pos-order-head">
          <span className="pos-avatar" aria-hidden>
            {cashierName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>PENJUALAN</strong>
            <em>Kasir: {cashierName}</em>
          </div>
        </div>

        <div className="pos-order-list">
          {lines.length === 0 ? (
            <p className="pos-empty">Pilih produk di sebelah kanan.</p>
          ) : (
            lines.map((l) => (
              <div className="pos-line" key={l.productId}>
                <div className="pos-line-main">
                  <span className="pos-line-name">{l.name}</span>
                  <span className="pos-line-unit">{formatRupiah(l.unitPrice)}</span>
                </div>
                <div className="pos-stepper">
                  <button type="button" onClick={() => bumpQty(l.productId, -1)} aria-label="Kurangi">
                    −
                  </button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => bumpQty(l.productId, 1)} aria-label="Tambah">
                    +
                  </button>
                </div>
                <span className="pos-line-total">{formatRupiah(l.unitPrice * l.qty)}</span>
                <button
                  type="button"
                  className="pos-line-remove"
                  onClick={() => removeLine(l.productId)}
                  aria-label="Hapus"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pos-order-foot">
          <div className="pos-controls">
            <label>
              Diskon
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="NONE">Tanpa diskon</option>
                <option value="AMOUNT">Nominal (Rp)</option>
                <option value="PERCENT">Persen (%)</option>
              </select>
            </label>
            <label>
              Nilai
              <input
                type="text"
                inputMode="numeric"
                value={discountValueStr}
                disabled={discountType === "NONE"}
                onChange={(e) => setDiscountValueStr(e.target.value)}
              />
            </label>
            <label>
              Bayar
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Tunai</option>
                <option value="TRANSFER">Transfer</option>
                <option value="QRIS">QRIS</option>
              </select>
            </label>
            <label>
              Uang diterima
              <input
                type="text"
                inputMode="numeric"
                value={amountPaidStr}
                disabled={paymentMethod !== "CASH"}
                onChange={(e) => setAmountPaidStr(e.target.value)}
              />
            </label>
          </div>

          <dl className="pos-summary">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatRupiah(totals.subtotal)}</dd>
            </div>
            {totals.discountAmount > 0 ? (
              <div>
                <dt>Diskon</dt>
                <dd>−{formatRupiah(totals.discountAmount)}</dd>
              </div>
            ) : null}
            {paymentMethod === "CASH" && totals.change != null ? (
              <div>
                <dt>Kembali</dt>
                <dd>{formatRupiah(totals.change)}</dd>
              </div>
            ) : null}
            <div className="pos-summary-count">
              <dt>Jumlah item</dt>
              <dd>{itemCount}</dd>
            </div>
          </dl>

          {underpaid ? (
            <p className="warn">Uang diterima kurang dari total — tetap bisa diselesaikan.</p>
          ) : null}
          {error ? <p className="error">{error}</p> : null}

          <div className="pos-foot-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetSale}>
              Reset
            </button>
            <button
              type="button"
              className="pos-total-bar"
              onClick={submit}
              disabled={pending}
            >
              <span>{pending ? "Menyimpan…" : "Selesaikan"}</span>
              <strong>{formatRupiah(totals.grandTotal)}</strong>
            </button>
          </div>
        </div>
      </section>

      {/* -------- catalog panel -------- */}
      <section className="pos-catalog">
        <div className="pos-search">
          <span aria-hidden>&#128269;</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk…"
          />
        </div>

        <div className="pos-tabs">
          <button
            type="button"
            className={tab === "all" ? "active" : ""}
            onClick={() => setTab("all")}
          >
            Semua
          </button>
          {popularIds.length > 0 ? (
            <button
              type="button"
              className={tab === "popular" ? "active" : ""}
              onClick={() => setTab("popular")}
            >
              Populer
            </button>
          ) : null}
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={tab === String(c.id) ? "active" : ""}
              onClick={() => setTab(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="pos-grid">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pos-card"
              onClick={() => addProduct(p)}
            >
              <ProductImage src={p.imageUrl} name={p.name} size={110} className="pos-card-img" />
              <span className="pos-card-name">{p.name}</span>
              <span className="pos-card-price">{formatRupiah(p.unitPrice)}</span>
            </button>
          ))}
          {visible.length === 0 ? (
            <p className="pos-empty">Tidak ada produk.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
