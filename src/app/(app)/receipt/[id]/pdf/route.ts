import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSaleForReceipt } from "@/lib/sales-query";
import { getSettings } from "@/lib/settings";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await params;
  const saleId = Number(id);
  if (!Number.isInteger(saleId)) {
    return new NextResponse(null, { status: 404 });
  }

  const [sale, settings] = await Promise.all([
    getSaleForReceipt(saleId),
    getSettings(),
  ]);
  if (!sale) return new NextResponse(null, { status: 404 });

  const bytes = await buildReceiptPdf(sale, settings);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nota-${sale.receiptNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
