import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Kategori — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <h1 className="page-title">Kategori Produk</h1>
      {error ? <p className="error panel">{error}</p> : null}

      <form action={createCategory} className="panel inline-form">
        <div className="field grow">
          <label htmlFor="name">Nama kategori baru</label>
          <input id="name" name="name" type="text" placeholder="mis. Makanan" required />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label htmlFor="sortOrder">Urutan</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
        </div>
        <button className="btn" type="submit">
          Tambah
        </button>
      </form>

      <div className="panel table-wrap">
        {categories.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            Belum ada kategori. Produk tanpa kategori tetap muncul di tab
            &quot;Semua&quot;.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 110 }}>Urutan</th>
                <th>Nama</th>
                <th className="num">Produk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td colSpan={2}>
                    <form action={updateCategory} className="inline-form tight">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="sortOrder"
                        type="number"
                        defaultValue={c.sortOrder}
                        style={{ width: 80 }}
                      />
                      <input name="name" type="text" defaultValue={c.name} required />
                      <button className="btn btn-sm secondary" type="submit">
                        Simpan
                      </button>
                    </form>
                  </td>
                  <td className="num">{c._count.products}</td>
                  <td className="row-actions">
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton
                        confirm={`Hapus kategori "${c.name}"? Produk di dalamnya tidak ikut terhapus.`}
                      >
                        Hapus
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
