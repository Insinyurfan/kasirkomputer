export type ParsedProduct =
  | { error: string }
  | {
      data: {
        name: string;
        code: string | null;
        unitPrice: number;
        categoryId: number | null;
      };
    };

export function parseProductForm(formData: FormData): ParsedProduct {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const priceRaw = String(formData.get("unitPrice") ?? "").trim();
  const categoryRaw = String(formData.get("categoryId") ?? "").trim();

  if (!name) return { error: "Nama produk wajib diisi." };

  // Accept "700000" or "700.000" (dots/spaces as thousands separators).
  // Reject anything else: negatives, letters, decimal values.
  const digitsOnly = priceRaw.replace(/[.\s]/g, "");
  if (!/^\d+$/.test(digitsOnly)) {
    return { error: "Harga harus berupa angka bulat >= 0." };
  }
  const unitPrice = parseInt(digitsOnly, 10);
  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    return { error: "Harga harus berupa angka bulat >= 0." };
  }

  const categoryId =
    categoryRaw && /^\d+$/.test(categoryRaw) ? parseInt(categoryRaw, 10) : null;

  return { data: { name, code: code || null, unitPrice, categoryId } };
}
