## Why

Shinzi Computer needs a simple in-house Point of Sale (POS) tool to look up products and prices and produce a printed receipt (nota) for each sale. Today there is no application at all; sales notes are written or tracked by hand, which is slow and error-prone. The owner runs the shop alone and only needs a single admin account.

## What Changes

- Introduce a Next.js application (App Router) that runs locally for one admin user.
- **Product catalog**: create, edit, deactivate, and search products, each with name, optional SKU/code, unit price, and active flag. Prices stored in whole Rupiah (no decimals).
- **POS / new sale screen**: search catalog, add line items, adjust quantity, apply an optional per-sale discount, see running totals, and pick a payment method + amount paid to compute change.
- **Sale + receipt persistence**: every completed sale is saved with an auto-generated sequential receipt number, timestamp, line items (name/price snapshotted), totals, and payment info. Nothing is deleted; a sale can be voided (flagged) instead.
- **Receipt (nota) design**: a printable A5/58mm-friendly layout with an editable shop header (shop name fixed as "Shinzi Computer", address/phone/footer editable), the line items, totals, payment, change, and receipt number/date.
- **Receipt preview + export**: after a sale (and from history) show an on-screen preview of the nota with three actions — Download as PDF, Download as JPG, and Print Nota (opens the browser print dialog for the receipt only).
- **Sale history**: list past sales, filter by date, open any sale to re-preview / re-print / re-export its nota, and see a simple daily sales total.
- **Shop settings**: edit the receipt header fields (address, phone, footer note) and the starting receipt number; persisted in the database.
- **Single-admin auth**: one admin password stored in an environment variable; logging in sets an HTTP-only session cookie; all POS/admin routes require the session. No user table, no registration.

## Capabilities

### New Capabilities
- `product-catalog`: managing the list of products and their prices used as line items in a sale.
- `sales-pos`: creating a sale from catalog items, computing totals/discount/change, and persisting it with a sequential receipt number; listing and voiding past sales.
- `receipt`: rendering the nota layout with an editable shop header and providing preview, print, PDF export, and JPG export.
- `shop-settings`: storing and editing the editable receipt header fields and receipt-number configuration.
- `admin-auth`: single-password admin login with a session cookie protecting all application routes.

### Modified Capabilities
<!-- None. This is a greenfield project; there are no existing specs. -->

## Impact

- **New project scaffold**: `package.json`, Next.js App Router structure, TypeScript, and styling setup — the repository currently has no application code.
- **New dependencies**: `next`, `react`, `react-dom`, Prisma + `@prisma/client` with a SQLite datasource, a client-side DOM-to-image library and a PDF library for the JPG/PDF exports (e.g. `html-to-image` + `jspdf`), and a small password-hash/compare or timing-safe compare for the admin login.
- **New data store**: a SQLite database file (via Prisma migrations) holding `Product`, `Sale`, `SaleItem`, and `ShopSettings` (or equivalent) tables.
- **Configuration**: `.env` entries for `ADMIN_PASSWORD` (or its hash), `SESSION_SECRET`, and `DATABASE_URL`.
- **Deployment/runtime**: intended to run locally (`next dev` / `next start`) on the shop's PC; printing relies on the browser's print dialog and CSS print styles.
- **Tooling prerequisites** (developer machine): Node.js LTS and npm; no code change but required to build/run.
