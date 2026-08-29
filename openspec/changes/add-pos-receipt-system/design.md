## Context

Greenfield repository — only an `openspec/` root exists, no application code. Target is a single-machine, single-user POS for Shinzi Computer. See `proposal.md - Why` for motivation. Constraints that shape the approach:

- One admin, runs locally on the shop PC. No multi-tenant, no roles, no network exposure assumed (but the login still exists as a lock).
- "Next.js saja" — avoid a separate backend service or external database server.
- Printing must go through the browser; PDF and JPG exports must match what the admin previews.
- Money is whole Rupiah; no i18n beyond Indonesian formatting.

## Goals / Non-Goals

**Goals:**

- One deployable Next.js App Router project with server-side data access (Route Handlers / Server Actions) and a local SQLite file via Prisma.
- Deterministic, collision-free receipt numbering.
- A single receipt component that is the source of truth for preview, print, PDF, and JPG.
- Simple env-based auth enforced by middleware.

**Non-Goals:**

- Inventory/stock tracking, purchase orders, suppliers.
- Multi-user, permissions, audit log beyond the void flag/reason.
- Barcode scanner hardware integration (a scanner that acts as a keyboard still works with the search box, but nothing is designed for it).
- Cloud sync, backups automation (documented manual copy of the SQLite file instead).
- Native/thermal printer drivers — thermal support is only a narrow CSS page size.

## Decisions

### Framework & rendering: Next.js App Router + Server Actions

Next.js 15 App Router with TypeScript. Data mutations via Server Actions; reads via server components. Rationale: keeps everything in one project ("Next.js saja"), no separate API layer to maintain. Alternative considered: separate Route Handlers REST API — more boilerplate for a single-user app, rejected.

### Persistence: SQLite via Prisma

Prisma with `provider = "sqlite"`, DB file at `./prisma/dev.db` (path from `DATABASE_URL`). Rationale: zero-install DB, transactional (needed for receipt numbering), typed client, easy migrations. Alternatives: raw `better-sqlite3` (less ergonomic, manual migrations); JSON files (no transactions, risky for numbering and concurrent tabs) — rejected.

Data model (Prisma):

- `Product` — `id`, `name`, `code?`, `unitPrice Int`, `active Boolean @default(true)`, timestamps.
- `Sale` — `id`, `receiptNo Int @unique`, `createdAt`, `subtotal Int`, `discountType` (`NONE|AMOUNT|PERCENT`), `discountValue Int`, `discountAmount Int`, `grandTotal Int`, `paymentMethod` (`CASH|TRANSFER|QRIS`), `amountPaid Int?`, `changeAmount Int?`, `voided Boolean @default(false)`, `voidReason?`, `voidedAt?`.
- `SaleItem` — `id`, `saleId`, `productId?` (nullable so products can be deleted later without breaking history), `name String`, `unitPrice Int`, `qty Int`, `lineTotal Int`. Name and price are snapshots.
- `ShopSettings` — single row (`id = 1`): `address`, `phone`, `headerNote?`, `footerNote?`, `startingReceiptNo Int @default(1000)`.

### Receipt numbering: transaction + max()

On sale completion, run inside a Prisma `$transaction`: compute `next = max(startingReceiptNo, (max(receiptNo) ?? startingReceiptNo - 1) + 1)`, insert `Sale` with that `receiptNo`. `@unique` on `receiptNo` plus the transaction guarantees no reuse even with two browser tabs. Voided sales keep their number (never recycled) because we always take `max(receiptNo)+1`. Rationale: simplest correct approach for single-writer; a dedicated counter row was the alternative but `max()+unique` is self-healing.

### One receipt component for all four outputs

A single `<Receipt sale={...} settings={...} />` React component rendered into a preview container. Actions operate on that same DOM node:

- **Print**: a dedicated print route/page `/(print)/receipt/[id]` OR a `@media print` stylesheet that hides everything except `#receipt-print-area`; "Print Nota" calls `window.print()`. Chosen approach: dedicated minimal print view opened in the same tab is more reliable for isolating content; fall back to print CSS if needed.
- **PDF**: `html-to-image` (`toPng`) → embed into a `jspdf` document sized to the receipt. Alternative `react-pdf` rejected — would require a second layout implementation, breaking "matches preview".
- **JPG**: `html-to-image` `toJpeg` on the same node, trigger download.

Rationale: DOM-to-image keeps exact visual parity with the preview and print. Trade-off: fonts/screenshot fidelity depend on the browser; acceptable for an internal tool. Libraries are client-only (`"use client"`, dynamic import) to avoid SSR issues.

### Currency & layout

Format with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`, then normalize to "Rp 700.000". Receipt default width ~72mm content area (works for A5 and 80mm thermal); print CSS `@page { size: 80mm auto }` variant selectable later. Keep the layout single-column, monospace-ish for alignment.

### Auth: env password + signed cookie in middleware

`ADMIN_PASSWORD_HASH` (bcrypt/scrypt hash) + `SESSION_SECRET` in `.env`. Login Server Action verifies with a constant-time compare against the hash, then sets an HMAC-signed, HTTP-only, SameSite=Lax cookie (`Secure` when `NODE_ENV=production` over HTTPS). `middleware.ts` validates the cookie signature on every route except `/login`, `/_next/*`, and static assets; invalid → redirect to `/login` (pages) or 401 (Server Action rejects via a shared `requireSession()` guard). Rationale: no user table needed; middleware gives blanket coverage. Alternative: NextAuth/Auth.js — heavy for one hard-coded credential, rejected. Storing a hash (not the plaintext) limits exposure if `.env` leaks.

## Risks / Trade-offs

- **DOM-to-image inconsistency across browsers/printers** → Standardize on one browser (Chrome) for the shop; test print + PDF + JPG on that; keep the receipt layout simple (no web fonts, system monospace).
- **SQLite file loss (no automated backup)** → Document a one-line manual backup (copy `prisma/dev.db`); keep the file outside build output. Optionally add a "Download database backup" button later (out of scope now).
- **Two browser tabs completing sales at once** → `@unique` + `$transaction` on `receiptNo` makes the second write retry/fail cleanly; UI shows an error and the admin retries.
- **Percentage discount rounding** → Define discount amount as `floor(subtotal * pct / 100)` so totals never go negative and are reproducible; documented in the sales-pos spec scenarios.
- **`.env` password in plaintext repo by mistake** → `.env` gitignored from the first commit; store a hash; ship `.env.example` with instructions and a generator script (`npm run set-password`).
- **Next.js version drift** → Pin exact versions in `package.json` at scaffold time.

## Migration Plan

1. Scaffold the Next.js project in the repo root (`create-next-app`), add Prisma, commit with `.gitignore` covering `.env`, `node_modules`, `.next`, `prisma/dev.db`.
2. `prisma migrate dev` to create the schema; seed `ShopSettings` row 1 with defaults.
3. Provide `npm run set-password` to write `ADMIN_PASSWORD_HASH` + generate `SESSION_SECRET` into `.env`.
4. Run locally with `npm run dev`; for the shop PC use `npm run build && npm run start`.
5. Rollback: it is additive and greenfield — revert the branch; no data migration to undo. Backup = copy `prisma/dev.db`.

## Open Questions

- Preferred paper size for the day-to-day printer (A5 sheet vs 80mm thermal roll)? Layout supports both; the default page size can be set during implementation without spec changes.
- Should QRIS/Transfer capture a reference number on the receipt? Currently out of scope; can be added as an optional `paymentRef` field later without changing the approach.
