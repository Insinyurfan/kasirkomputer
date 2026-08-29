import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/money";
import { setProductActive } from "@/app/actions/products";
import { ProductImage } from "@/components/ProductImage";

export const metadata = { title: "Produk — Shinzi Computer POS" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const { q = "", show = "all" } = await searchParams;
  const query = q.trim();

  const all = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { category: true },
  });
  const products = all.filter((p) => {
    if (show === "active" && !p.active) return false;
    if (!query) return true;
    const hay = `${p.name} ${p.code ?? ""}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Produk</h1>
        <Link className="btn" href="/products/new">
          + Tambah produk
        </Link>
      </div>

      <form className="panel inline-form" method="get">
        <div className="field grow">
          <label htmlFor="q">Cari</label>
          <input id="q" type="text" name="q" defaultValue={q} placeholder="Nama atau kode…" />
        </div>
        <div className="field" style={{ width: 160 }}>
          <label htmlFor="show">Tampilkan</label>
          <select id="show" name="show" defaultValue={show}>
            <option value="all">Semua</option>
            <option value="active">Aktif saja</option>
          </select>
        </div>
        <button className="btn secondary" type="submit">
          Cari
        </button>
      </form>

      <div className="panel table-wrap">
        {products.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            {query
              ? `Tidak ada produk yang cocok dengan "${query}".`
              : "Belum ada produk. Tambahkan produk pertama."}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}></th>
                <th>Nama</th>
                <th>Kategori</th>
                <th className="num">Harga</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <ProductImage src={p.imageUrl} name={p.name} size={40} />
                  </td>
                  <td>
                    {p.name}
                    {p.code ? <div className="cell-sub">{p.code}</div> : null}
                  </td>
                  <td>{p.category?.name ?? "—"}</td>
                  <td className="num">{formatRupiah(p.unitPrice)}</td>
                  <td>
                    {p.active ? (
                      <span className="badge badge-ok">Aktif</span>
                    ) : (
                      <span className="badge badge-inactive">Nonaktif</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <Link className="btn btn-sm secondary" href={`/products/${p.id}/edit`}>
                      Edit
                    </Link>
                    <form action={setProductActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={(!p.active).toString()} />
                      <button className="btn btn-sm secondary" type="submit">
                        {p.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
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
