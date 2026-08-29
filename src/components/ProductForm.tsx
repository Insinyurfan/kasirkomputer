import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/products";
import { ImageUpload } from "@/components/ImageUpload";

type ProductValues = {
  id: number;
  name: string;
  code: string | null;
  unitPrice: number;
  imageUrl: string | null;
  categoryId: number | null;
};

type Category = { id: number; name: string };

export function ProductForm({
  error,
  product,
  categories,
}: {
  error?: string;
  product?: ProductValues;
  categories: Category[];
}) {
  const editing = !!product;
  return (
    <form
      action={editing ? updateProduct : createProduct}
      className="panel form-card-wide"
      encType="multipart/form-data"
    >
      {editing ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="product-form-grid">
        <div>
          <div className="field">
            <label htmlFor="name">Nama produk</label>
            <input id="name" name="name" type="text" defaultValue={product?.name ?? ""} required />
          </div>
          <div className="field">
            <label htmlFor="code">Kode / SKU (opsional)</label>
            <input id="code" name="code" type="text" defaultValue={product?.code ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="unitPrice">Harga satuan (Rp)</label>
            <input
              id="unitPrice"
              name="unitPrice"
              type="text"
              inputMode="numeric"
              defaultValue={product ? String(product.unitPrice) : ""}
              placeholder="mis. 25000"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="categoryId">Kategori</label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
            >
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ImageUpload
          name="image"
          label="Foto produk"
          currentUrl={product?.imageUrl}
          removeName="removeImage"
          shape="square"
          maxSide={900}
        />
      </div>

      {error ? <p className="error">{error}</p> : null}
      <div className="form-actions">
        <button className="btn" type="submit">
          {editing ? "Simpan perubahan" : "Tambah produk"}
        </button>
        <Link className="btn secondary" href="/products">
          Batal
        </Link>
      </div>
    </form>
  );
}
