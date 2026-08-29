// One-off: mengisi katalog + riwayat pesanan untuk pengadaan
// "Koperasi Merah Putih" (Juli–September 2026).
//
//   node scripts/seed-koperasi.cjs
//
// Aman dijalankan ulang: menghapus dulu produk/kategori/penjualan lama yang
// dibuat script ini (berdasarkan kode produk), lalu membuat ulang. TIDAK
// menyentuh akun pengguna atau pengaturan toko.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "ATK & Administrasi", sortOrder: 1 },
  { name: "Peralatan Praktik IT", sortOrder: 2 },
  { name: "Perlengkapan Posko", sortOrder: 3 },
  { name: "Internet", sortOrder: 4 },
];

// price = nominal "1 pertemuan" / harga satuan sesuai daftar anggaran
const PRODUCTS = [
  { code: "ADM-TINTA-HVS", name: "Tinta Printer & Kertas HVS", price: 100000, cat: "ATK & Administrasi" },
  { code: "ADM-ATK-DIGITAL", name: "ATK & Bahan Praktik Digital Dasar", price: 100000, cat: "ATK & Administrasi" },
  { code: "IT-KABEL-ROLL", name: "Kabel Roll & Terminal Colokan", price: 100000, cat: "Peralatan Praktik IT" },
  { code: "IT-FD-64GB", name: "Flashdisk 64GB", price: 150000, cat: "Peralatan Praktik IT" },
  { code: "POSKO-BANNER-4X2", name: "Banner Posko Koperasi 4x2 m", price: 300000, cat: "Perlengkapan Posko" },
  { code: "NET-PAKET-DATA", name: "Paket Data Internet", price: 100000, cat: "Internet" },
];

// setiap entri = 1 pesanan (1 pertemuan / 1 pembelian)
const ORDERS = [
  // 1. Tinta Printer & Kertas HVS — Jul–Sep, 5 pertemuan
  { code: "ADM-TINTA-HVS", qty: 1, date: "2026-07-08" },
  { code: "ADM-TINTA-HVS", qty: 1, date: "2026-07-22" },
  { code: "ADM-TINTA-HVS", qty: 1, date: "2026-08-05" },
  { code: "ADM-TINTA-HVS", qty: 1, date: "2026-08-19" },
  { code: "ADM-TINTA-HVS", qty: 1, date: "2026-09-02" },
  // 2. ATK & Bahan Praktik Digital Dasar — Jul–Agu, 7 pertemuan
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-07-03" },
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-07-10" },
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-07-17" },
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-07-24" },
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-07-31" },
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-08-07" },
  { code: "ADM-ATK-DIGITAL", qty: 1, date: "2026-08-14" },
  // 3. Kabel Roll & Terminal Colokan — Jul–Agu, 7 pertemuan
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-07-04" },
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-07-11" },
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-07-18" },
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-07-25" },
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-08-01" },
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-08-08" },
  { code: "IT-KABEL-ROLL", qty: 1, date: "2026-08-15" },
  // 4. Flashdisk 64GB — Jul–Agu, anggaran 300rb (beli 2)
  { code: "IT-FD-64GB", qty: 2, date: "2026-07-28" },
  // 5. Banner Posko — Juli, beli 1
  { code: "POSKO-BANNER-4X2", qty: 1, date: "2026-07-05" },
  // 6. Paket Data Internet — Jul–Agu, 5 pertemuan
  { code: "NET-PAKET-DATA", qty: 1, date: "2026-07-07" },
  { code: "NET-PAKET-DATA", qty: 1, date: "2026-07-21" },
  { code: "NET-PAKET-DATA", qty: 1, date: "2026-08-04" },
  { code: "NET-PAKET-DATA", qty: 1, date: "2026-08-18" },
  { code: "NET-PAKET-DATA", qty: 1, date: "2026-08-25" },
];

async function main() {
  const codes = PRODUCTS.map((p) => p.code);

  // bersihkan data lama dari script ini
  const oldProducts = await prisma.product.findMany({ where: { code: { in: codes } } });
  const oldIds = oldProducts.map((p) => p.id);
  if (oldIds.length) {
    await prisma.sale.deleteMany({
      where: { items: { some: { productId: { in: oldIds } } } },
    });
    await prisma.product.deleteMany({ where: { id: { in: oldIds } } });
  }
  await prisma.category.deleteMany({
    where: { name: { in: CATEGORIES.map((c) => c.name) } },
  });

  // kategori
  const catByName = {};
  for (const c of CATEGORIES) {
    const row = await prisma.category.create({ data: c });
    catByName[c.name] = row.id;
  }

  // produk
  const prodByCode = {};
  for (const p of PRODUCTS) {
    const row = await prisma.product.create({
      data: {
        name: p.name,
        code: p.code,
        unitPrice: p.price,
        active: true,
        categoryId: catByName[p.cat],
      },
    });
    prodByCode[p.code] = row;
  }

  // nomor nota lanjut dari yang sudah ada
  const settings = await prisma.shopSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  const agg = await prisma.sale.aggregate({ _max: { receiptNo: true } });
  let receiptNo = Math.max(
    settings.startingReceiptNo,
    (agg._max.receiptNo ?? settings.startingReceiptNo - 1) + 1,
  );

  const owner = await prisma.user.findFirst({ where: { isOwner: true } });

  // pesanan, urut tanggal
  const orders = [...ORDERS].sort((a, b) => a.date.localeCompare(b.date));
  let total = 0;
  for (const o of orders) {
    const prod = prodByCode[o.code];
    const lineTotal = prod.unitPrice * o.qty;
    total += lineTotal;
    const createdAt = new Date(`${o.date}T10:00:00`);
    await prisma.sale.create({
      data: {
        receiptNo: receiptNo++,
        createdAt,
        subtotal: lineTotal,
        discountType: "NONE",
        discountValue: 0,
        discountAmount: 0,
        grandTotal: lineTotal,
        paymentMethod: "CASH",
        amountPaid: lineTotal,
        changeAmount: 0,
        cashierId: owner ? owner.id : null,
        cashierName: owner ? owner.displayName : null,
        items: {
          create: [
            {
              productId: prod.id,
              name: prod.name,
              unitPrice: prod.unitPrice,
              qty: o.qty,
              lineTotal,
            },
          ],
        },
      },
    });
  }

  console.log(
    `Selesai: ${PRODUCTS.length} produk, ${CATEGORIES.length} kategori, ${orders.length} pesanan. Total nilai pesanan: Rp ${total.toLocaleString("id-ID")}.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
