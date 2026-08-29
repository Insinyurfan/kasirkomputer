"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  computeTotals,
  type DiscountType,
} from "@/lib/totals";

export type CompleteSaleInput = {
  lines: { productId: number; qty: number }[];
  discountType: DiscountType;
  discountValue: number;
  paymentMethod: "CASH" | "TRANSFER" | "QRIS";
  amountPaid: number | null;
};

export type CompleteSaleResult = { error: string };

export async function completeSale(
  input: CompleteSaleInput,
): Promise<CompleteSaleResult> {
  const me = await requireUser();

  const cleanLines = (input.lines ?? []).filter(
    (l) => Number.isInteger(l.productId) && Number.isInteger(l.qty) && l.qty >= 1,
  );
  if (cleanLines.length === 0) {
    return { error: "Tambahkan minimal satu item sebelum menyelesaikan penjualan." };
  }

  // Snapshot name + price from the database; never trust prices from the client.
  const products = await prisma.product.findMany({
    where: { id: { in: cleanLines.map((l) => l.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const missing = cleanLines.find((l) => !byId.has(l.productId));
  if (missing) return { error: "Ada produk yang tidak ditemukan. Muat ulang halaman." };

  const itemData = cleanLines.map((l) => {
    const p = byId.get(l.productId)!;
    return {
      productId: p.id,
      name: p.name,
      unitPrice: p.unitPrice,
      qty: l.qty,
      lineTotal: p.unitPrice * l.qty,
    };
  });

  const totals = computeTotals(
    itemData.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty })),
    input.discountType,
    input.discountValue,
    input.paymentMethod === "CASH" ? input.amountPaid : null,
  );

  const amountPaid =
    input.paymentMethod === "CASH" && input.amountPaid != null
      ? Math.trunc(input.amountPaid)
      : null;
  const changeAmount =
    amountPaid != null ? amountPaid - totals.grandTotal : null;

  let saleId = -1;
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const sale = await prisma.$transaction(async (tx) => {
        const settings = await tx.shopSettings.upsert({
          where: { id: 1 },
          update: {},
          create: { id: 1 },
        });
        const agg = await tx.sale.aggregate({ _max: { receiptNo: true } });
        const maxNo = agg._max.receiptNo ?? settings.startingReceiptNo - 1;
        const receiptNo = Math.max(settings.startingReceiptNo, maxNo + 1);

        return tx.sale.create({
          data: {
            receiptNo,
            subtotal: totals.subtotal,
            discountType: input.discountType,
            discountValue: Math.max(0, Math.trunc(input.discountValue || 0)),
            discountAmount: totals.discountAmount,
            grandTotal: totals.grandTotal,
            paymentMethod: input.paymentMethod,
            amountPaid,
            changeAmount,
            cashierId: me.id,
            cashierName: me.displayName,
            items: { create: itemData },
          },
        });
      });
      saleId = sale.id;
      break;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt < MAX_ATTEMPTS - 1
      ) {
        continue; // receiptNo race — recompute and retry
      }
      throw e;
    }
  }

  if (saleId < 0) {
    return { error: "Gagal menyimpan penjualan, coba lagi." };
  }

  revalidatePath("/history");
  redirect(`/receipt/${saleId}`);
}

export async function voidSale(formData: FormData) {
  "use server";
  const me = await requireUser();
  // Only the Owner may cancel/void a sale — Admin & Member can add sales but
  // never remove them from the history.
  if (!me.isOwner) {
    redirect(
      "/history?error=" +
        encodeURIComponent("Hanya Owner yang bisa membatalkan penjualan."),
    );
  }
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!Number.isInteger(id)) return;

  await prisma.sale.update({
    where: { id },
    data: { voided: true, voidReason: reason, voidedAt: new Date() },
  });
  revalidatePath("/history");
  revalidatePath(`/receipt/${id}`);
}
