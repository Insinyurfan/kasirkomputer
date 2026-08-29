import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PosClient } from "@/components/PosClient";

export const metadata = { title: "Kasir — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function PosPage() {
  const me = await requireUser();

  const [products, categories, topAgg] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        unitPrice: true,
        imageUrl: true,
        categoryId: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, sale: { voided: false } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 24,
    }),
  ]);

  const activeIds = new Set(products.map((p) => p.id));
  const popularIds = topAgg
    .map((t) => t.productId)
    .filter((id): id is number => id != null && activeIds.has(id))
    .slice(0, 12);

  return (
    <>
      {products.length === 0 ? (
        <>
          <h1 className="page-title">Kasir</h1>
          <div className="panel">
            <p>
              Belum ada produk aktif.{" "}
              <Link href="/products/new">Tambah produk dulu</Link>.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="pos-rotate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="4" y="2" width="10" height="16" rx="2" transform="rotate(-20 9 10)" />
              <path d="M15 15l4 4M19 15l-4 4" strokeLinecap="round" />
            </svg>
            <strong>Miringkan HP ke mode landscape</strong>
            <span>Layar kasir butuh ruang lebih lebar. Putar HP ke posisi horizontal untuk mulai transaksi.</span>
          </div>
          <PosClient
            products={products}
            categories={categories}
            popularIds={popularIds}
            cashierName={me.displayName}
          />
        </>
      )}
    </>
  );
}
