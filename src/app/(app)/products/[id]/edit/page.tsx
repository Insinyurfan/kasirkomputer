import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Edit produk — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: Number(id) } }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  return (
    <>
      <h1 className="page-title">Edit produk</h1>
      <ProductForm
        error={error}
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          code: product.code,
          unitPrice: product.unitPrice,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
        }}
      />
    </>
  );
}
