import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSaleForReceipt } from "@/lib/sales-query";
import { getSettings } from "@/lib/settings";
import {
  buildReceiptPdf,
  asTemplate,
  TEMPLATE_SLUG,
} from "@/lib/receipt-pdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await params;
  const saleId = Number(id);
  if (!Number.isInteger(saleId)) {
    return new NextResponse(null, { status: 404 });
  }
  const template = asTemplate(new URL(req.url).searchParams.get("tpl"));

  const [sale, settings] = await Promise.all([
    getSaleForReceipt(saleId),
    getSettings(),
  ]);
  if (!sale) return new NextResponse(null, { status: 404 });

  const bytes = await buildReceiptPdf(sale, settings, template);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nota-${sale.receiptNo}-${TEMPLATE_SLUG[template]}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
