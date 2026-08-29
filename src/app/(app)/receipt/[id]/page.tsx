import Link from "next/link";
import { notFound } from "next/navigation";
import { Receipt } from "@/components/Receipt";
import { ReceiptActions } from "@/components/ReceiptActions";
import { getSaleForReceipt } from "@/lib/sales-query";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Nota — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const saleId = Number(id);
  if (!Number.isInteger(saleId)) notFound();

  const [sale, settings] = await Promise.all([
    getSaleForReceipt(saleId),
    getSettings(),
  ]);
  if (!sale) notFound();

  return (
    <>
      <div className="no-print page-head">
        <h1 className="page-title">Nota #{sale.receiptNo}</h1>
        <Link className="btn secondary" href="/pos">
          Penjualan baru
        </Link>
      </div>

      <div style={{ marginTop: 12 }}>
        <Receipt sale={sale} settings={settings} />
      </div>

      <ReceiptActions receiptNo={sale.receiptNo} />
    </>
  );
}
