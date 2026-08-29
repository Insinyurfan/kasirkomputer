// One-off: mengisi katalog rinci + riwayat pesanan untuk pengadaan
// "Koperasi Merah Putih" (Juli–Agustus 2026, semua sudah berlangsung).
//
//   node scripts/seed-koperasi.cjs
//
// Aman dijalankan ulang: menghapus dulu produk (kode berawalan
// ADM-/ATK-/IT-/POSKO-/NET-), kategori, dan penjualan terkait yang dibuat
// script ini, lalu membuat ulang. TIDAK menyentuh akun pengguna / pengaturan.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "ATK & Administrasi", sortOrder: 1 },
  { name: "Peralatan Praktik IT", sortOrder: 2 },
  { name: "Perlengkapan Posko", sortOrder: 3 },
  { name: "Internet", sortOrder: 4 },
];

const PRODUCTS = [
  // --- ATK & Administrasi ---
  { code: "ADM-HVS-A4", name: "Kertas HVS A4 70gr (Copy Paper) - 1 rim", price: 40000, cat: "ATK & Administrasi" },
  { code: "ADM-HVS-F4", name: "Kertas HVS F4 70gr (Copy Paper) - 1 rim", price: 45000, cat: "ATK & Administrasi" },
  { code: "ADM-TINTA-CNB", name: "Tinta Printer Canon GI-790 Black", price: 40000, cat: "ATK & Administrasi" },
  { code: "ADM-TINTA-CNC", name: "Tinta Printer Canon GI-790 Warna", price: 20000, cat: "ATK & Administrasi" },
  { code: "ADM-KLIP-SET", name: "Klip Kertas + Isi Staples (set)", price: 15000, cat: "ATK & Administrasi" },
  { code: "ATK-BUKU-5", name: "Buku Tulis Sinar Dunia (pak isi 5)", price: 32000, cat: "ATK & Administrasi" },
  { code: "ATK-PULPEN-12", name: "Pulpen Standard AE7 (pak isi 12)", price: 24000, cat: "ATK & Administrasi" },
  { code: "ATK-PENSIL-12", name: "Pensil 2B Faber-Castell (pak isi 12)", price: 20000, cat: "ATK & Administrasi" },
  { code: "ATK-SPIDOL-4", name: "Spidol Whiteboard Snowman (isi 4)", price: 32000, cat: "ATK & Administrasi" },
  { code: "ATK-MAP-10", name: "Map Plastik Snelhecter (isi 10)", price: 24000, cat: "ATK & Administrasi" },
  { code: "ATK-HAPUS-SET", name: "Penghapus + Rautan (set)", price: 12000, cat: "ATK & Administrasi" },
  // --- Peralatan Praktik IT ---
  { code: "IT-ROLL-3M", name: "Kabel Roll 3 Meter 4 Socket (Uticon)", price: 65000, cat: "Peralatan Praktik IT" },
  { code: "IT-ROLL-5M", name: "Kabel Roll 5 Meter 4 Socket (Uticon)", price: 85000, cat: "Peralatan Praktik IT" },
  { code: "IT-TERM-4", name: "Terminal Colokan 4 Lubang + Saklar (Broco)", price: 35000, cat: "Peralatan Praktik IT" },
  { code: "IT-STEKER", name: "Steker Arde / Colokan (Broco)", price: 15000, cat: "Peralatan Praktik IT" },
  { code: "IT-FD-64", name: "Flashdisk 64GB SanDisk USB 3.0", price: 150000, cat: "Peralatan Praktik IT" },
  // --- Perlengkapan Posko ---
  { code: "POSKO-BANNER", name: "Banner Flexi 280gsm 4x2 m (cetak + mata ayam)", price: 300000, cat: "Perlengkapan Posko" },
  // --- Internet ---
  { code: "NET-TSEL-25", name: "Paket Data Telkomsel 25GB / 30 Hari", price: 75000, cat: "Internet" },
  { code: "NET-TSEL-15", name: "Paket Data Telkomsel 15GB / 30 Hari", price: 55000, cat: "Internet" },
  { code: "NET-TSEL-10", name: "Paket Data Telkomsel 10GB (Tambahan)", price: 25000, cat: "Internet" },
  { code: "NET-XL-20", name: "Paket Data XL 20GB / 30 Hari", price: 45000, cat: "Internet" },
];

// Setiap entri = 1 pesanan/nota (belanja 1 pertemuan). `items` = [kode, qty].
const A = "A";
const B = "B";
const BASKETS = {
  // Baris 1 — Tinta & HVS, tiap pertemuan Rp 100.000
  L1: {
    [A]: [["ADM-HVS-A4", 1], ["ADM-TINTA-CNB", 1], ["ADM-TINTA-CNC", 1]], // 40+40+20
    [B]: [["ADM-HVS-F4", 1], ["ADM-TINTA-CNB", 1], ["ADM-KLIP-SET", 1]], // 45+40+15
  },
  // Baris 2 — ATK & Bahan Praktik Digital, Rp 100.000
  L2: {
    [A]: [["ATK-BUKU-5", 1], ["ATK-PULPEN-12", 1], ["ATK-SPIDOL-4", 1], ["ATK-HAPUS-SET", 1]], // 32+24+32+12
    [B]: [["ATK-PULPEN-12", 1], ["ATK-PENSIL-12", 1], ["ATK-MAP-10", 1], ["ATK-SPIDOL-4", 1]], // 24+20+24+32
  },
  // Baris 3 — Kabel Roll & Terminal, Rp 100.000
  L3: {
    [A]: [["IT-ROLL-3M", 1], ["IT-TERM-4", 1]], // 65+35
    [B]: [["IT-ROLL-5M", 1], ["IT-STEKER", 1]], // 85+15
  },
  // Baris 6 — Paket Data, Rp 100.000
  L6: {
    [A]: [["NET-TSEL-25", 1], ["NET-TSEL-10", 1]], // 75+25
    [B]: [["NET-TSEL-15", 1], ["NET-XL-20", 1]], // 55+45
  },
};

const ORDERS = [
  // 1. Tinta & HVS — 5 pertemuan (Jul–Agu; sudah berlangsung, semua <= 29 Agu 2026)
  { date: "2026-07-09", items: BASKETS.L1[A] },
  { date: "2026-07-23", items: BASKETS.L1[B] },
  { date: "2026-08-06", items: BASKETS.L1[A] },
  { date: "2026-08-16", items: BASKETS.L1[B] },
  { date: "2026-08-27", items: BASKETS.L1[A] },
  // 2. ATK Digital — 7 pertemuan (Jul–Agu)
  { date: "2026-07-03", items: BASKETS.L2[A] },
  { date: "2026-07-10", items: BASKETS.L2[B] },
  { date: "2026-07-17", items: BASKETS.L2[A] },
  { date: "2026-07-24", items: BASKETS.L2[B] },
  { date: "2026-07-31", items: BASKETS.L2[A] },
  { date: "2026-08-07", items: BASKETS.L2[B] },
  { date: "2026-08-14", items: BASKETS.L2[A] },
  // 3. Kabel Roll & Terminal — 7 pertemuan (Jul–Agu)
  { date: "2026-07-04", items: BASKETS.L3[A] },
  { date: "2026-07-11", items: BASKETS.L3[B] },
  { date: "2026-07-18", items: BASKETS.L3[A] },
  { date: "2026-07-25", items: BASKETS.L3[B] },
  { date: "2026-08-01", items: BASKETS.L3[A] },
  { date: "2026-08-08", items: BASKETS.L3[B] },
  { date: "2026-08-15", items: BASKETS.L3[A] },
  // 4. Flashdisk 64GB — anggaran 300rb (beli 2), 1 nota
  { date: "2026-07-28", items: [["IT-FD-64", 2]] },
  // 5. Banner Posko 4x2 — 300rb, 1 nota
  { date: "2026-07-05", items: [["POSKO-BANNER", 1]] },
  // 6. Paket Data — 5 pertemuan (Jul–Agu)
  { date: "2026-07-07", items: BASKETS.L6[A] },
  { date: "2026-07-21", items: BASKETS.L6[B] },
  { date: "2026-08-04", items: BASKETS.L6[A] },
  { date: "2026-08-18", items: BASKETS.L6[B] },
  { date: "2026-08-25", items: BASKETS.L6[A] },
];

const PREFIXES = ["ADM-", "ATK-", "IT-", "POSKO-", "NET-"];

// Jam transaksi diacak tapi deterministik (stabil kalau script diulang):
// turunan dari hash tanggal + nomor urut. Jam kerja 08:00–15:59.
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function randomClock(seed) {
  const h = hashStr(seed);
  const hour = 8 + (h % 8); // 8..15
  const minute = 1 + ((h >>> 3) % 58); // 1..58, hindari :00 yang terlihat "bulat"
  const second = 1 + ((h >>> 9) % 58);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(hour)}:${p(minute)}:${p(second)}`;
}

async function main() {
  // bersihkan data lama dari script ini
  const old = await prisma.product.findMany({
    where: { OR: PREFIXES.map((p) => ({ code: { startsWith: p } })) },
  });
  const oldIds = old.map((p) => p.id);
  if (oldIds.length) {
    await prisma.sale.deleteMany({
      where: { items: { some: { productId: { in: oldIds } } } },
    });
    await prisma.product.deleteMany({ where: { id: { in: oldIds } } });
  }
  await prisma.category.deleteMany({
    where: { name: { in: CATEGORIES.map((c) => c.name) } },
  });

  // kategori + produk
  const catId = {};
  for (const c of CATEGORIES) catId[c.name] = (await prisma.category.create({ data: c })).id;

  const prod = {};
  for (const p of PRODUCTS) {
    prod[p.code] = await prisma.product.create({
      data: { name: p.name, code: p.code, unitPrice: p.price, active: true, categoryId: catId[p.cat] },
    });
  }

  // nomor nota lanjut dari yang sudah ada
  const settings = await prisma.shopSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  const agg = await prisma.sale.aggregate({ _max: { receiptNo: true } });
  let receiptNo = Math.max(
    settings.startingReceiptNo,
    (agg._max.receiptNo ?? settings.startingReceiptNo - 1) + 1,
  );

  const orders = [...ORDERS].sort((a, b) => a.date.localeCompare(b.date));
  let grand = 0;
  for (let idx = 0; idx < orders.length; idx++) {
    const o = orders[idx];
    const clock = randomClock(`${o.date}#${idx}#${o.items.map((i) => i.join("x")).join(",")}`);
    const lineItems = o.items.map(([code, qty]) => {
      const p = prod[code];
      return { productId: p.id, name: p.name, unitPrice: p.unitPrice, qty, lineTotal: p.unitPrice * qty };
    });
    const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
    grand += subtotal;
    await prisma.sale.create({
      data: {
        receiptNo: receiptNo++,
        createdAt: new Date(`${o.date}T${clock}`),
        subtotal,
        discountType: "NONE",
        discountValue: 0,
        discountAmount: 0,
        grandTotal: subtotal,
        paymentMethod: "CASH",
        amountPaid: subtotal,
        changeAmount: 0,
        cashierId: null,
        cashierName: "Kasir", // catatan pengadaan — bukan transaksi kasir tertentu
        items: { create: lineItems },
      },
    });
  }

  console.log(
    `Selesai: ${PRODUCTS.length} produk, ${CATEGORIES.length} kategori, ${orders.length} nota. Total nilai: Rp ${grand.toLocaleString("id-ID")}.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
