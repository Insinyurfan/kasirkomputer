"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function back(msg: string): never {
  redirect(`/categories?error=${encodeURIComponent(msg)}`);
}

function revalidateAll() {
  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/pos");
}

export async function createCategory(formData: FormData): Promise<void> {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 40) back("Nama kategori 1–40 karakter.");
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  try {
    await prisma.category.create({ data: { name, sortOrder } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      back("Kategori dengan nama itu sudah ada.");
    }
    throw e;
  }
  revalidateAll();
  redirect("/categories");
}

export async function updateCategory(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/categories");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 40) back("Nama kategori 1–40 karakter.");
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  try {
    await prisma.category.update({ where: { id }, data: { name, sortOrder } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      back("Kategori dengan nama itu sudah ada.");
    }
    throw e;
  }
  revalidateAll();
  redirect("/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/categories");
  // Products keep existing; their categoryId is set to null (onDelete: SetNull).
  await prisma.category.delete({ where: { id } });
  revalidateAll();
  redirect("/categories");
}
