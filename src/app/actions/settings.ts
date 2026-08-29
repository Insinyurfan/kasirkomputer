"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveImage, deleteImage } from "@/lib/uploads";

function back(msg: string): never {
  redirect(`/settings?error=${encodeURIComponent(msg)}`);
}

export async function updateSettings(formData: FormData): Promise<void> {
  await requireUser();

  const shopName = String(formData.get("shopName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const headerNote = String(formData.get("headerNote") ?? "").trim();
  const footerNote = String(formData.get("footerNote") ?? "").trim();
  const startRaw = String(formData.get("startingReceiptNo") ?? "").trim();

  if (shopName.length < 1 || shopName.length > 40) {
    back("Nama toko wajib diisi (maks 40 karakter).");
  }
  const startingReceiptNo = Number(startRaw);
  if (!Number.isInteger(startingReceiptNo) || startingReceiptNo < 1) {
    back("Nomor awal nota harus berupa angka bulat minimal 1.");
  }

  const existing = await prisma.shopSettings.findUnique({ where: { id: 1 } });

  const removeLogo = String(formData.get("removeLogo")) === "1";
  const uploaded = await saveImage(formData.get("logo"), "shop");
  if ("error" in uploaded) back(uploaded.error);

  let logoUrl = existing?.logoUrl ?? null;
  if (uploaded.url) {
    await deleteImage(existing?.logoUrl);
    logoUrl = uploaded.url;
  } else if (removeLogo) {
    await deleteImage(existing?.logoUrl);
    logoUrl = null;
  }

  const values = {
    shopName,
    logoUrl,
    address,
    phone,
    headerNote: headerNote || null,
    footerNote: footerNote || null,
    startingReceiptNo,
  };

  await prisma.shopSettings.upsert({
    where: { id: 1 },
    update: values,
    create: { id: 1, ...values },
  });

  revalidatePath("/settings");
  redirect("/settings?ok=1");
}
