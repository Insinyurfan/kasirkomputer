import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { mapSaleToReceipt } from "@/lib/sales-query";
import { parseHistoryRange } from "@/lib/history-range";
import { buildReceiptsPdf, asTemplate, TEMPLATE_SLUG } from "@/lib/receipt-pdf";

export async function GET(req: Request) {
  await requireUser();
  const { searchParams } = new URL(req.url);

  // Optional: ?nota=1004,1010,1017 — pilih nota tertentu berdasarkan nomornya.
  const notaParam = searchParams.get("nota");
  const receiptNos = notaParam
    ? notaParam
        .split(",")
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => Number.isInteger(n))
    : null;

  const range = parseHistoryRange(searchParams.get("from"), searchParams.get("to"));
  const template = asTemplate(searchParams.get("tpl"));

  const sales = await prisma.sale.findMany({
    where: receiptNos ? { receiptNo: { in: receiptNos } } : range.where,
    orderBy: { receiptNo: "asc" },
    include: { items: true },
  });
  if (sales.length === 0) {
    return new NextResponse("Tidak ada nota untuk diunduh.", { status: 404 });
  }

  const settings = await getSettings();
  const bytes = await buildReceiptsPdf(
    sales.map((s) => ({ sale: mapSaleToReceipt(s), settings })),
    template,
  );

  const first = sales[0].receiptNo;
  const last = sales[sales.length - 1].receiptNo;
  const slug = TEMPLATE_SLUG[template];
  const filename = receiptNos
    ? `nota-terpilih-${first}-${last}-${slug}.pdf`
    : range.filtered
      ? `nota-${range.from ?? "awal"}-sd-${range.to ?? "akhir"}-${slug}.pdf`
      : `nota-${first}-${last}-${slug}.pdf`;

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
