import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Produk baru — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return (
    <>
      <h1 className="page-title">Tambah produk</h1>
      <ProductForm error={error} categories={categories} />
    </>
  );
}
