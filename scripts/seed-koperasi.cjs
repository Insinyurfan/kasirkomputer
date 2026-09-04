// One-off: mengisi katalog rinci + riwayat pesanan untuk pengadaan
// "Koperasi Merah Putih" (Juli–Agustus 2026, semua sudah berlangsung).
//
//   node scripts/seed-koperasi.cjs
//
// Aman dijalankan ulang: menghapus dulu produk (kode berawalan
// ADM-/ATK-/IT-/POSKO-/NET-), kategori, dan penjualan terkait yang dibuat
// script ini, lalu membuat ulang. TIDAK menyentuh akun pengguna / pengaturan.
//
// Nota dibelanjakan di dua toko berbeda (di-snapshot per nota):
//   AA = Toko Buku AA        -> kertas/tinta + ATK  (list 1 & 2)
//   SC = Shinzi Computer     -> kelistrikan, flashdisk, banner, paket data
//
// Tiap pertemuan Rp 100.000 (flashdisk & banner Rp 300.000). Kombinasi item
// dibuat berbeda-beda tiap nota supaya tidak terlihat seperti template.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SHOPS = {
  AA: {
    name: "Toko Buku AA",
    address:
      "Jl. RA Kartini No.3-4, RT.002/RW.002, Margahayu, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17113",
    phone: "",
  },
  SC: {
    name: "Shinzi Computer",
    address:
      "Jl. RA Kartini No. 66, RT.002/RW.002, Margahayu, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17113",
    phone: "",
  },
};

const CATEGORIES = [
  { name: "Kertas & Tinta Printer", sortOrder: 1 },
  { name: "ATK & Bahan Praktik", sortOrder: 2 },
  { name: "Kelistrikan & Kabel", sortOrder: 3 },
  { name: "Komputer & Aksesoris", sortOrder: 4 },
  { name: "Pulsa, Data & Cetak", sortOrder: 5 },
];
// Nama kategori dari versi script sebelumnya — ikut dibersihkan.
const OLD_CATEGORIES = [
  "ATK & Administrasi",
  "Peralatan Praktik IT",
  "Perlengkapan Posko",
  "Internet",
];

const KERTAS = "Kertas & Tinta Printer";
const ATK = "ATK & Bahan Praktik";
const LISTRIK = "Kelistrikan & Kabel";
const KOMP = "Komputer & Aksesoris";
const PDC = "Pulsa, Data & Cetak";

const PRODUCTS = [
  // --- Kertas & Tinta Printer (Toko Buku AA) ---
  { code: "ADM-K-A4-70", name: "Kertas HVS A4 70gr Copy Paper (1 rim)", price: 40000, cat: KERTAS },
  { code: "ADM-K-F4-70", name: "Kertas HVS F4 70gr Copy Paper (1 rim)", price: 45000, cat: KERTAS },
  { code: "ADM-K-A4-75", name: "Kertas HVS A4 75gr Sinar Dunia (1 rim)", price: 50000, cat: KERTAS },
  { code: "ADM-K-A4-80", name: "Kertas HVS A4 80gr PaperOne (1 rim)", price: 55000, cat: KERTAS },
  { code: "ADM-K-BURAM", name: "Kertas Buram F4 (1 rim)", price: 15000, cat: KERTAS },
  { code: "ADM-K-FOTO", name: "Kertas Foto Glossy A4 (isi 10)", price: 15000, cat: KERTAS },
  { code: "ADM-K-AMPCK", name: "Amplop Coklat A4 (isi 20)", price: 15000, cat: KERTAS },
  { code: "ADM-K-AMPPT", name: "Amplop Putih Paperline (isi 30)", price: 10000, cat: KERTAS },
  { code: "ADM-T-CNB", name: "Tinta Printer Canon GI-790 Black", price: 40000, cat: KERTAS },
  { code: "ADM-T-CNC", name: "Tinta Printer Canon GI-790 Warna", price: 20000, cat: KERTAS },
  { code: "ADM-T-EPB", name: "Tinta Printer Epson 003 Black", price: 45000, cat: KERTAS },
  { code: "ADM-T-EPC", name: "Tinta Printer Epson 003 Warna (per botol)", price: 35000, cat: KERTAS },
  { code: "ADM-T-DP", name: "Tinta Suntik Data-Print Black 20ml", price: 25000, cat: KERTAS },
  { code: "ADM-T-BRB", name: "Tinta Refill Brother BT-D60 Black", price: 50000, cat: KERTAS },

  // --- ATK & Bahan Praktik (Toko Buku AA) ---
  { code: "ATK-BUKU6", name: "Buku Tulis Sidu 58 lembar (pak isi 6)", price: 35000, cat: ATK },
  { code: "ATK-FOLIO", name: "Buku Folio Bergaris 100 lembar", price: 20000, cat: ATK },
  { code: "ATK-PULSNOW", name: "Pulpen Snowman V-1 Hitam (isi 12)", price: 25000, cat: ATK },
  { code: "ATK-PULAE7", name: "Pulpen Standard AE7 (isi 12)", price: 20000, cat: ATK },
  { code: "ATK-PSLFC", name: "Pensil Faber-Castell 2B (isi 12)", price: 30000, cat: ATK },
  { code: "ATK-SPDWB", name: "Spidol Whiteboard Snowman (isi 4)", price: 30000, cat: ATK },
  { code: "ATK-SPDPM", name: "Spidol Permanen Snowman (isi 6)", price: 30000, cat: ATK },
  { code: "ATK-STABILO", name: "Stabilo Boss Pastel (isi 4)", price: 40000, cat: ATK },
  { code: "ATK-HAPUS", name: "Penghapus + Rautan Joyko (set)", price: 10000, cat: ATK },
  { code: "ATK-PENGGARIS", name: "Penggaris Butterfly 30cm (isi 5)", price: 15000, cat: ATK },
  { code: "ATK-TIPEX", name: "Tipe-X Kertas Kenko (isi 2)", price: 15000, cat: ATK },
  { code: "ATK-LEM", name: "Lem Kertas Glukol + Lem UHU (set)", price: 20000, cat: ATK },
  { code: "ATK-GUNTING", name: "Gunting Kenko + Cutter L-500 (set)", price: 25000, cat: ATK },
  { code: "ATK-ISICUT", name: "Isi Cutter + Isi Staples (set)", price: 10000, cat: ATK },
  { code: "ATK-STAPLER", name: "Staples Kenko HD-10 + isi (set)", price: 25000, cat: ATK },
  { code: "ATK-BINDER", name: "Binder Clip Aneka Ukuran (box)", price: 20000, cat: ATK },
  { code: "ATK-STICKY", name: "Sticky Notes Joyko 3x3 (isi 4)", price: 20000, cat: ATK },
  { code: "ATK-MAPSNEL", name: "Map Snelhecter Plastik (isi 10)", price: 25000, cat: ATK },
  { code: "ATK-MAPBATIK", name: "Map Batik Kertas (isi 25)", price: 20000, cat: ATK },
  { code: "ATK-KWITANSI", name: "Buku Kwitansi + Nota Kontan (set)", price: 20000, cat: ATK },
  { code: "ATK-AMPRAFIA", name: "Amplop Coklat A4 + Tali Rafia (set)", price: 15000, cat: ATK },
  { code: "ATK-KALKU", name: "Kalkulator Citizen SDC-812", price: 55000, cat: ATK },
  { code: "ATK-CLIPBOARD", name: "Papan Jalan / Clipboard Joyko (isi 3)", price: 30000, cat: ATK },
  { code: "ATK-KARTON", name: "Kertas Karton Manila + Origami (set)", price: 15000, cat: ATK },
  { code: "ATK-STEMPEL", name: "Tinta Stempel + Bantalan (set)", price: 20000, cat: ATK },
  { code: "ATK-DVDR", name: "DVD-R Blank GSM (isi 10)", price: 25000, cat: ATK },
  { code: "ATK-CDR", name: "CD-R Blank (isi 10)", price: 20000, cat: ATK },
  { code: "ATK-LABEL", name: "Kertas Label A4 Tom&Jerry (pak isi 20)", price: 20000, cat: ATK },
  { code: "ATK-MOUSEPAD", name: "Mouse Pad Standar", price: 15000, cat: ATK },

  // --- Kelistrikan & Kabel (Shinzi Computer) ---
  { code: "IT-L-ROLL3", name: "Kabel Roll 3 Meter 4 Socket (Uticon)", price: 65000, cat: LISTRIK },
  { code: "IT-L-ROLL5", name: "Kabel Roll 5 Meter 4 Socket (Uticon)", price: 85000, cat: LISTRIK },
  { code: "IT-L-ROLL2", name: "Kabel Roll 2 Meter 4 Socket (Broco)", price: 55000, cat: LISTRIK },
  { code: "IT-L-TERM4", name: "Terminal Colokan 4 Lubang + Saklar (Broco)", price: 35000, cat: LISTRIK },
  { code: "IT-L-TERM6", name: "Terminal Colokan 6 Lubang (Broco)", price: 45000, cat: LISTRIK },
  { code: "IT-L-STKARDE", name: "Steker Arde / Colokan (Broco)", price: 15000, cat: LISTRIK },
  { code: "IT-L-STOPTAN", name: "Stop Kontak Tanam Broco + Box", price: 30000, cat: LISTRIK },
  { code: "IT-L-SERABUT", name: "Kabel Listrik Serabut 2x0.75 (roll 10 m)", price: 30000, cat: LISTRIK },
  { code: "IT-L-FITTING", name: "Fitting Lampu + Saklar Engkel (set)", price: 20000, cat: LISTRIK },
  { code: "IT-L-ISOLASI", name: "Isolasi Listrik Nachi (isi 3)", price: 10000, cat: LISTRIK },
  { code: "IT-L-LEDPHI", name: "Lampu LED Philips 12W", price: 45000, cat: LISTRIK },
  { code: "IT-L-TESTPEN", name: "Test Pen + Tang Kombinasi Kecil (set)", price: 25000, cat: LISTRIK },
  { code: "IT-L-CHGUSB", name: "Kepala Charger USB 2 Port + Kabel (set)", price: 35000, cat: LISTRIK },
  { code: "IT-L-USBEXT", name: "Kabel USB Extension 3 Meter", price: 25000, cat: LISTRIK },
  { code: "IT-L-GEPENG", name: "Colokan Steker Gepeng (isi 3)", price: 15000, cat: LISTRIK },
  { code: "IT-L-MULTI4", name: "Multi Stop Kontak 4 Lubang Kabel 1.5 m", price: 40000, cat: LISTRIK },

  // --- Komputer & Aksesoris (Shinzi Computer) ---
  { code: "IT-FD-SANDISK", name: "Flashdisk 64GB SanDisk Ultra USB 3.0", price: 155000, cat: KOMP },
  { code: "IT-FD-KINGSTON", name: "Flashdisk 64GB Kingston DataTraveler", price: 145000, cat: KOMP },

  // --- Cetak Banner (Shinzi Computer) ---
  { code: "POSKO-BANNER-M2", name: "Cetak Banner Flexi 280gr China (per m2)", price: 25000, cat: PDC },
  { code: "POSKO-BANNER-DSN", name: "Jasa Desain & Setting Banner", price: 60000, cat: PDC },
  { code: "POSKO-BANNER-PSG", name: "Mata Ayam + Pemasangan Rangka Banner", price: 40000, cat: PDC },

  // --- Pulsa & Paket Data (Shinzi Computer) ---
  { code: "NET-TSEL25", name: "Paket Data Telkomsel 25GB / 30 Hari", price: 75000, cat: PDC },
  { code: "NET-TSEL15", name: "Paket Data Telkomsel 15GB / 30 Hari", price: 55000, cat: PDC },
  { code: "NET-TSEL10", name: "Paket Data Telkomsel 10GB (Tambahan)", price: 25000, cat: PDC },
  { code: "NET-XL20", name: "Paket Data XL 20GB / 30 Hari", price: 45000, cat: PDC },
  { code: "NET-ISAT30", name: "Paket Data Indosat 30GB / 30 Hari", price: 60000, cat: PDC },
  { code: "NET-TRI20", name: "Paket Data Tri 20GB / 30 Hari", price: 40000, cat: PDC },
  { code: "NET-SF-UNL", name: "Paket smartfren Unlimited Harian 30 Hari", price: 50000, cat: PDC },
  { code: "NET-TELP-SMS", name: "Paket Telepon + SMS Telkomsel", price: 30000, cat: PDC },
  { code: "NET-PERDANA", name: "Kartu Perdana Telkomsel Prabayar", price: 20000, cat: PDC },
  { code: "NET-WIFIID", name: "Voucher WiFi.id 5 Hari", price: 25000, cat: PDC },
];

// Tiap entri = 1 nota. `[kode, qty]`. Komentar = rincian harga.
const ORDERS = [
  // === 1. Kertas HVS & Tinta Printer — 5 pertemuan @ Rp 100.000 — Toko Buku AA
  { list: "1. Kertas HVS & Tinta Printer", shop: "AA", date: "2026-07-09", expect: 100000,
    items: [["ADM-K-A4-80", 1], ["ADM-T-CNC", 1], ["ADM-T-DP", 1]] }, // 55+20+25
  { list: "1. Kertas HVS & Tinta Printer", shop: "AA", date: "2026-07-23", expect: 100000,
    items: [["ADM-K-F4-70", 1], ["ADM-T-CNB", 1], ["ADM-K-BURAM", 1]] }, // 45+40+15
  { list: "1. Kertas HVS & Tinta Printer", shop: "AA", date: "2026-08-06", expect: 100000,
    items: [["ADM-T-BRB", 1], ["ADM-T-DP", 1], ["ADM-K-AMPCK", 1], ["ADM-K-AMPPT", 1]] }, // 50+25+15+10
  { list: "1. Kertas HVS & Tinta Printer", shop: "AA", date: "2026-08-16", expect: 100000,
    items: [["ADM-K-A4-70", 1], ["ADM-T-EPB", 1], ["ADM-K-FOTO", 1]] }, // 40+45+15
  { list: "1. Kertas HVS & Tinta Printer", shop: "AA", date: "2026-08-27", expect: 100000,
    items: [["ADM-K-A4-75", 1], ["ADM-T-EPC", 1], ["ADM-K-FOTO", 1]] }, // 50+35+15

  // === 2. ATK & Bahan Praktik Digital — 7 pertemuan @ Rp 100.000 — Toko Buku AA
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-07-03", expect: 100000,
    items: [["ATK-BUKU6", 1], ["ATK-PULSNOW", 1], ["ATK-SPDWB", 1], ["ATK-HAPUS", 1]] }, // 35+25+30+10
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-07-10", expect: 100000,
    items: [["ATK-KALKU", 1], ["ATK-STAPLER", 1], ["ATK-BINDER", 1]] }, // 55+25+20
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-07-17", expect: 100000,
    items: [["ATK-STABILO", 1], ["ATK-PSLFC", 1], ["ATK-PENGGARIS", 1], ["ATK-TIPEX", 1]] }, // 40+30+15+15
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-07-24", expect: 100000,
    items: [["ATK-SPDPM", 1], ["ATK-GUNTING", 1], ["ATK-MAPSNEL", 1], ["ATK-LEM", 1]] }, // 30+25+25+20
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-07-31", expect: 100000,
    items: [["ATK-DVDR", 1], ["ATK-CDR", 1], ["ATK-LABEL", 1], ["ATK-MOUSEPAD", 1], ["ATK-MAPBATIK", 1]] }, // 25+20+20+15+20
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-08-07", expect: 100000,
    items: [["ATK-PULAE7", 1], ["ATK-PSLFC", 1], ["ATK-FOLIO", 1], ["ATK-CLIPBOARD", 1]] }, // 20+30+20+30
  { list: "2. ATK & Bahan Praktik Digital", shop: "AA", date: "2026-08-14", expect: 100000,
    items: [["ATK-KWITANSI", 1], ["ATK-AMPRAFIA", 1], ["ATK-STEMPEL", 1], ["ATK-KARTON", 1], ["ATK-ISICUT", 1], ["ATK-STICKY", 1]] }, // 20+15+20+15+10+20

  // === 3. Kabel Roll & Terminal Colokan — 7 pertemuan @ Rp 100.000 — Shinzi Computer
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-07-04", expect: 100000,
    items: [["IT-L-ROLL3", 1], ["IT-L-TERM4", 1]] }, // 65+35
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-07-11", expect: 100000,
    items: [["IT-L-ROLL5", 1], ["IT-L-STKARDE", 1]] }, // 85+15
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-07-18", expect: 100000,
    items: [["IT-L-ROLL2", 1], ["IT-L-TERM6", 1]] }, // 55+45
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-07-25", expect: 100000,
    items: [["IT-L-LEDPHI", 1], ["IT-L-SERABUT", 1], ["IT-L-TESTPEN", 1]] }, // 45+30+25
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-08-01", expect: 100000,
    items: [["IT-L-USBEXT", 1], ["IT-L-TERM6", 1], ["IT-L-FITTING", 1], ["IT-L-ISOLASI", 1]] }, // 25+45+20+10
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-08-08", expect: 100000,
    items: [["IT-L-ROLL3", 1], ["IT-L-FITTING", 1], ["IT-L-STKARDE", 1]] }, // 65+20+15
  { list: "3. Kabel Roll & Terminal Colokan", shop: "SC", date: "2026-08-15", expect: 100000,
    items: [["IT-L-MULTI4", 1], ["IT-L-CHGUSB", 1], ["IT-L-GEPENG", 1], ["IT-L-ISOLASI", 1]] }, // 40+35+15+10

  // === 4. Flashdisk 64GB — anggaran Rp 300.000 (beli 2 unit), 1 nota — Shinzi Computer
  { list: "4. Flashdisk 64GB", shop: "SC", date: "2026-07-28", expect: 300000,
    items: [["IT-FD-SANDISK", 1], ["IT-FD-KINGSTON", 1]] }, // 155+145

  // === 5. Banner Posko Koperasi 4x2 m — Rp 300.000, 1 nota — Shinzi Computer
  { list: "5. Banner Posko Koperasi", shop: "SC", date: "2026-07-05", expect: 300000,
    items: [["POSKO-BANNER-M2", 8], ["POSKO-BANNER-DSN", 1], ["POSKO-BANNER-PSG", 1]] }, // 8x25 + 60 + 40

  // === 6. Paket Data Internet — 5 pertemuan @ Rp 100.000 — Shinzi Computer
  { list: "6. Paket Data Internet", shop: "SC", date: "2026-07-07", expect: 100000,
    items: [["NET-TSEL25", 1], ["NET-TSEL10", 1]] }, // 75+25
  { list: "6. Paket Data Internet", shop: "SC", date: "2026-07-21", expect: 100000,
    items: [["NET-TSEL15", 1], ["NET-XL20", 1]] }, // 55+45
  { list: "6. Paket Data Internet", shop: "SC", date: "2026-08-04", expect: 100000,
    items: [["NET-ISAT30", 1], ["NET-TRI20", 1]] }, // 60+40
  { list: "6. Paket Data Internet", shop: "SC", date: "2026-08-18", expect: 100000,
    items: [["NET-SF-UNL", 1], ["NET-TELP-SMS", 1], ["NET-PERDANA", 1]] }, // 50+30+20
  { list: "6. Paket Data Internet", shop: "SC", date: "2026-08-25", expect: 100000,
    items: [["NET-XL20", 1], ["NET-WIFIID", 1], ["NET-TELP-SMS", 1]] }, // 45+25+30
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
    where: { name: { in: [...CATEGORIES.map((c) => c.name), ...OLD_CATEGORIES] } },
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
      if (!p) throw new Error(`Produk tidak ditemukan: ${code}`);
      return { productId: p.id, name: p.name, unitPrice: p.unitPrice, qty, lineTotal: p.unitPrice * qty };
    });
    const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
    if (subtotal !== o.expect) {
      throw new Error(
        `Total nota ${o.date} (${o.list}) = ${subtotal}, seharusnya ${o.expect}`,
      );
    }
    grand += subtotal;
    const shop = SHOPS[o.shop];
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
        shopName: shop.name,
        shopAddress: shop.address,
        shopPhone: shop.phone,
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
