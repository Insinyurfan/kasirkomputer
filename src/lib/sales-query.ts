import "server-only";
import { prisma } from "./prisma";
import type { ReceiptSale } from "@/components/Receipt";

export async function getSaleForReceipt(id: number): Promise<ReceiptSale | null> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!sale) return null;
  return {
    receiptNo: sale.receiptNo,
    createdAt: sale.createdAt,
    cashierName: sale.cashierName,
    items: sale.items.map((it) => ({
      name: it.name,
      unitPrice: it.unitPrice,
      qty: it.qty,
      lineTotal: it.lineTotal,
    })),
    subtotal: sale.subtotal,
    discountType: sale.discountType,
    discountValue: sale.discountValue,
    discountAmount: sale.discountAmount,
    grandTotal: sale.grandTotal,
    paymentMethod: sale.paymentMethod,
    amountPaid: sale.amountPaid,
    changeAmount: sale.changeAmount,
    voided: sale.voided,
    voidReason: sale.voidReason,
  };
}
