"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseProductForm } from "@/lib/product-input";
import { saveImage, deleteImage } from "@/lib/uploads";

function revalidateProducts() {
  revalidatePath("/products");
  revalidatePath("/pos");
}

export async function createProduct(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = parseProductForm(formData);
  if ("error" in parsed) {
    redirect(`/products/new?error=${encodeURIComponent(parsed.error)}`);
  }
  const img = await saveImage(formData.get("image"), "products");
  if ("error" in img) {
    redirect(`/products/new?error=${encodeURIComponent(img.error)}`);
  }

  await prisma.product.create({
    data: { ...parsed.data, active: true, imageUrl: img.url },
  });
  revalidateProducts();
  redirect("/products");
}

export async function updateProduct(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/products");
  const P = `/products/${id}/edit`;

  const parsed = parseProductForm(formData);
  if ("error" in parsed) redirect(`${P}?error=${encodeURIComponent(parsed.error)}`);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) redirect("/products");

  const removeImage = String(formData.get("removeImage")) === "1";
  const img = await saveImage(formData.get("image"), "products");
  if ("error" in img) redirect(`${P}?error=${encodeURIComponent(img.error)}`);

  let imageUrl = existing.imageUrl;
  if (img.url) {
    await deleteImage(existing.imageUrl);
    imageUrl = img.url;
  } else if (removeImage) {
    await deleteImage(existing.imageUrl);
    imageUrl = null;
  }

  await prisma.product.update({
    where: { id },
    data: { ...parsed.data, imageUrl },
  });
  revalidateProducts();
  redirect("/products");
}

export async function setProductActive(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  if (!Number.isInteger(id)) return;
  await prisma.product.update({ where: { id }, data: { active } });
  revalidateProducts();
}
