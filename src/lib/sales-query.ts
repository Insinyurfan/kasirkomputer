import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { ReceiptSale } from "@/components/Receipt";

type SaleWithItems = Prisma.SaleGetPayload<{ include: { items: true } }>;

export function mapSaleToReceipt(sale: SaleWithItems): ReceiptSale {
  return {
    receiptNo: sale.receiptNo,
    createdAt: sale.createdAt,
    cashierName: sale.cashierName,
    shopName: sale.shopName,
    shopAddress: sale.shopAddress,
    shopPhone: sale.shopPhone,
    items: [...sale.items]
      .sort((a, b) => a.id - b.id)
      .map((it) => ({
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

export async function getSaleForReceipt(id: number): Promise<ReceiptSale | null> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  return sale ? mapSaleToReceipt(sale) : null;
}
