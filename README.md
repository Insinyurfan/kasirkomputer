# Shinzi Computer POS

Aplikasi kasir (Point of Sale) untuk **Shinzi Computer**: kelola produk, kategori,
foto produk, dan pengguna; buat penjualan dari grid produk bergaya POS; cetak /
unduh nota.

Next.js (App Router) + Prisma + SQLite. Berjalan lokal di PC toko.

## Fitur

- **Login username + password**, dengan 2 role:
  - **Owner** — akun pertama (dibuat saat setup). Akses penuh + satu-satunya yang
    bisa **menghapus akun**. Akun Owner tidak bisa dihapus siapa pun.
  - **Admin** — akses penuh kasir + bisa **menambah & mengubah** akun (termasuk
    reset password & ganti role), tapi **tidak bisa menghapus** akun.
  - **Member** — akses penuh kasir (jualan, produk, kategori, riwayat,
    pengaturan) tapi **tidak bisa membuka menu Pengguna** sama sekali.
- **Pengaturan Akun** (`/account`) — setiap user bisa ganti nama tampilan,
  username, dan password sendiri (role tidak bisa diubah sendiri).
- **Kasir** bergaya POS: grid produk berkartu dengan foto, tab kategori
  (Semua / Populer / per-kategori), pencarian, panel keranjang, bar total hijau,
  diskon nominal/persen, pembayaran Tunai/Transfer/QRIS + kembalian.
- **Produk**: nama, kode, harga, kategori, **foto** (upload), aktif/nonaktif.
- **Kategori**: buat/urutkan/hapus (produk tidak ikut terhapus).
- **Nota**: nomor otomatis, nama kasir, preview + **Download PDF / JPG / Print**.
- **Riwayat**: filter tanggal, total harian, kolom kasir, batalkan (void).

## Prasyarat

- **Node.js LTS** (v20+) — <https://nodejs.org>
- **Git** (opsional)

## Setup pertama kali

```bash
npm install
npm run setup          # buat .env (+ SESSION_SECRET), migrasi DB, seed
npm run dev            # atau: npm run build && npm run start
```

Buka <http://localhost:3000>. Karena belum ada akun, aplikasi akan menampilkan
halaman **Setup** — buat akun **Owner** di situ, lalu langsung masuk.

> `.env` dan `SESSION_SECRET` dibuat otomatis saat pertama kali `npm run dev` /
> `build` / `start`. Tidak perlu mengaturnya manual.

## Menjalankan sehari-hari

```bash
npm run build
npm run start
```

## Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run set-password -- <username> <password-baru>` | Reset password bila lupa (langsung ke DB) |
| `npm run db:studio` | Lihat / edit data (Prisma Studio) |
| `npm test` | Unit test |
| `npm run lint` | Cek lint |

## Deploy / hosting

Aplikasi ini memakai **SQLite** (`prisma/dev.db`) dan menyimpan foto di
**disk lokal** (`data/uploads/`). Ini pas untuk dijalankan langsung di **PC
toko** (`npm run build && npm run start`).

Untuk hosting serverless (Vercel/Netlify) SQLite + disk lokal **tidak bisa**
(filesystem read-only & ephemeral). Perlu diganti dulu:

- Database → **Turso** (libSQL, kompatibel Prisma) atau **Postgres**
  (Neon/Supabase/Vercel Postgres).
- Upload foto → **Vercel Blob / S3 / Cloudinary** menggantikan `src/lib/uploads.ts`.

Kalau mau jalan tanpa server (1 PC), cara paling gampang tetap `npm run start`
di PC toko, atau bungkus jadi app desktop.

## Backup data

- Database: satu file **`prisma/dev.db`** — salin secara berkala.
- Foto produk: folder **`data/uploads/products/`** — ikut disalin saat backup.

Restore = kembalikan kedua-duanya, lalu jalankan ulang server.

> `.env`, `prisma/dev.db`, dan isi `data/uploads/products/` tidak masuk Git.

## Struktur singkat

```
prisma/schema.prisma      User, Category, Product(+imageUrl,+categoryId),
                          Sale(+cashier), SaleItem, ShopSettings
src/lib/                  auth, session, prisma, money, totals, settings, uploads
src/middleware.ts         proteksi semua route (kecuali /login, /setup, /logout)
src/app/setup, /login     halaman auth (split-panel biru-putih)
src/app/(app)/            halaman terproteksi: pos, products, categories,
                          history, settings, account, users, receipt
src/components/           Nav, PosClient, ProductForm, UserForm, Receipt, ...
```
