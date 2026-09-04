import { formatRupiah } from "@/lib/money";

export type ReceiptSale = {
  receiptNo: number;
  createdAt: Date | string;
  cashierName: string | null;
  /** Snapshot toko saat nota dibuat; kalau null pakai ShopSettings global. */
  shopName?: string | null;
  shopAddress?: string | null;
  shopPhone?: string | null;
  items: { name: string; unitPrice: number; qty: number; lineTotal: number }[];
  subtotal: number;
  discountType: "NONE" | "AMOUNT" | "PERCENT";
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: "CASH" | "TRANSFER" | "QRIS";
  amountPaid: number | null;
  changeAmount: number | null;
  voided: boolean;
  voidReason?: string | null;
};

export type ReceiptSettings = {
  shopName: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  headerNote: string | null;
  footerNote: string | null;
};

/** Identitas toko yang dipakai di nota: snapshot per-nota kalau ada, kalau
 *  tidak jatuh ke ShopSettings global. Logo global hanya dipakai kalau nota
 *  tidak punya snapshot toko sendiri. */
export function effectiveShop(sale: ReceiptSale, settings: ReceiptSettings) {
  const hasSnapshot = !!sale.shopName;
  return {
    name: sale.shopName || settings.shopName,
    address: hasSnapshot ? sale.shopAddress ?? "" : settings.address,
    phone: hasSnapshot ? sale.shopPhone ?? "" : settings.phone,
    logoUrl: hasSnapshot ? null : settings.logoUrl,
  };
}

const PAYMENT_LABEL: Record<ReceiptSale["paymentMethod"], string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
};

function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function Receipt({
  sale,
  settings,
}: {
  sale: ReceiptSale;
  settings: ReceiptSettings;
}) {
  const discountLabel =
    sale.discountType === "PERCENT"
      ? `Diskon (${sale.discountValue}%)`
      : "Diskon";
  const shop = effectiveShop(sale, settings);

  return (
    <div id="receipt-print-area" className="receipt">
      {sale.voided ? <div className="receipt-void">VOID</div> : null}

      <div className="receipt-header">
        {shop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logoUrl} alt="" className="receipt-logo" />
        ) : null}
        <div className="receipt-shop">{shop.name}</div>
        {shop.address ? <div>{shop.address}</div> : null}
        {shop.phone ? <div>Telp: {shop.phone}</div> : null}
        {settings.headerNote ? <div>{settings.headerNote}</div> : null}
      </div>

      <div className="receipt-rule" />

      <div className="receipt-meta">
        <div>
          <span>No. Nota</span>
          <span>{sale.receiptNo}</span>
        </div>
        <div>
          <span>Tanggal</span>
          <span>{formatDateTime(sale.createdAt)}</span>
        </div>
        {sale.cashierName ? (
          <div>
            <span>Kasir</span>
            <span>{sale.cashierName}</span>
          </div>
        ) : null}
      </div>

      <div className="receipt-rule" />

      <div className="receipt-items">
        {sale.items.map((it, i) => (
          <div className="receipt-item" key={i}>
            <div className="receipt-item-name">{it.name}</div>
            <div className="receipt-item-line">
              <span>
                {it.qty} x {formatRupiah(it.unitPrice)}
              </span>
              <span>{formatRupiah(it.lineTotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-rule" />

      <div className="receipt-totals">
        <div>
          <span>Subtotal</span>
          <span>{formatRupiah(sale.subtotal)}</span>
        </div>
        {sale.discountAmount > 0 ? (
          <div>
            <span>{discountLabel}</span>
            <span>-{formatRupiah(sale.discountAmount)}</span>
          </div>
        ) : null}
        <div className="receipt-grand">
          <span>TOTAL</span>
          <span>{formatRupiah(sale.grandTotal)}</span>
        </div>
      </div>

      <div className="receipt-rule" />

      <div className="receipt-totals">
        <div>
          <span>Bayar ({PAYMENT_LABEL[sale.paymentMethod]})</span>
          <span>
            {sale.amountPaid != null ? formatRupiah(sale.amountPaid) : "—"}
          </span>
        </div>
        {sale.changeAmount != null ? (
          <div>
            <span>Kembali</span>
            <span>{formatRupiah(sale.changeAmount)}</span>
          </div>
        ) : null}
      </div>

      {sale.voided && sale.voidReason ? (
        <>
          <div className="receipt-rule" />
          <div className="receipt-footer">Dibatalkan: {sale.voidReason}</div>
        </>
      ) : null}

      {settings.footerNote ? (
        <>
          <div className="receipt-rule" />
          <div className="receipt-footer">{settings.footerNote}</div>
        </>
      ) : null}
    </div>
  );
}
