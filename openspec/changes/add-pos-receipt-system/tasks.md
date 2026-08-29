## 1. Project scaffold & tooling

- [x] 1.1 Scaffold Next.js (App Router, TypeScript, ESLint) into the repo root; verify `npm run dev` serves the default page at `http://localhost:3000`
- [x] 1.2 Add `.gitignore` covering `node_modules`, `.next`, `.env`, `prisma/dev.db`; verify `git status` shows none of them
- [x] 1.3 Add and pin dependencies: `prisma`, `@prisma/client`, `html-to-image`, `jspdf`, a bcrypt/scrypt lib; verify `npm install` succeeds and `npx prisma -v` runs
- [x] 1.4 Add `.env.example` with `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`; verify a fresh clone can copy it to `.env` and boot

## 2. Data layer (Prisma + SQLite)

- [x] 2.1 Create `prisma/schema.prisma` with `Product`, `Sale`, `SaleItem`, `ShopSettings` models per design.md; verify `npx prisma validate` passes
- [x] 2.2 Run initial migration and generate client; verify `prisma/dev.db` is created and `npx prisma studio` shows all tables
- [x] 2.3 Add a seed that inserts `ShopSettings` row id=1 with defaults (`startingReceiptNo = 1000`, blank header/footer); verify seed is idempotent on re-run
- [x] 2.4 Add a shared Prisma client singleton module; verify it does not create multiple instances under `next dev` hot reload

## 3. Admin auth

- [x] 3.1 Add `npm run set-password` script that hashes a password and writes `ADMIN_PASSWORD_HASH` + a random `SESSION_SECRET` to `.env`; verify running it lets login succeed with that password
- [x] 3.2 Implement `/login` page + Server Action doing constant-time hash compare; verify wrong password shows a generic error and sets no cookie
- [x] 3.3 Set an HMAC-signed, HTTP-only, SameSite=Lax session cookie on success (`Secure` in production); verify the cookie is present and not readable from `document.cookie`
- [x] 3.4 Add `middleware.ts` protecting all routes except `/login`, `/_next/*`, static assets; verify direct navigation to `/pos` while logged out redirects to `/login`
- [x] 3.5 Add a `requireSession()` guard used by every Server Action; verify an unauthenticated sale-create call is rejected and writes nothing
- [x] 3.6 Add logout action clearing the cookie; verify protected pages redirect to `/login` afterward
- [x] 3.7 Handle "no password configured" — protected pages show setup instructions instead of serving; verify with `ADMIN_PASSWORD_HASH` unset

## 4. Product catalog

- [x] 4.1 Product list page: table of name, code, price, active status with search box (case-insensitive partial match on name/code); verify searching "ssd" filters correctly and an unmatched term shows the empty state
- [x] 4.2 Create-product form + Server Action with validation (non-empty name, integer price >= 0); verify invalid submissions are rejected with messages and create nothing
- [x] 4.3 Edit-product form + action; verify changing a price does not alter existing `SaleItem` rows
- [x] 4.4 Deactivate/reactivate action; verify a deactivated product disappears from POS search but still shows in the list marked inactive, and reactivating restores it
- [x] 4.5 Rupiah formatting helper (`Intl.NumberFormat('id-ID')` normalized to `Rp 700.000`); verify unit test covers 0, thousands, millions

## 5. POS / new sale

- [x] 5.1 New-sale screen with product search + add-to-cart; verify adding the same product twice increments quantity instead of duplicating the line
- [x] 5.2 Line quantity edit and remove; verify quantity < 1 is rejected and keeps the last valid value, and subtotal updates live
- [x] 5.3 Discount input (AMOUNT or PERCENT) with `discountAmount = floor(subtotal*pct/100)` for percent; verify grand total = subtotal - discount and is capped at 0
- [x] 5.4 Payment method (CASH/TRANSFER/QRIS) + amount paid for cash with change = paid - grandTotal; verify underpayment shows a warning but still allows completion, and non-cash hides change
- [x] 5.5 "Complete sale" Server Action: rejects empty sale; inside a `$transaction` computes `receiptNo = max(startingReceiptNo, maxReceiptNo+1)`, writes `Sale` + snapshotted `SaleItem`s; verify two sequential completions get strictly increasing numbers
- [x] 5.6 On completion redirect to the receipt preview for the new sale; verify no print dialog opens automatically

## 6. Receipt (nota) rendering & export

- [x] 6.1 `<Receipt>` component rendering header (`Shinzi Computer` fixed + editable address/phone/notes), receipt no + datetime, item table, subtotal/discount/grand total, payment/paid/change, footer note, and a VOID mark when voided; verify it matches the layout in design.md for a sample sale
- [x] 6.2 Receipt preview page (used post-sale and from history) showing the component plus three buttons: Download PDF, Download JPG, Print Nota; verify all three render and nothing prints until clicked
- [x] 6.3 Print: dedicated minimal print view + `@media print` isolating `#receipt-print-area`; "Print Nota" calls `window.print()`; verify printed/preview output excludes nav and buttons
- [x] 6.4 PDF export: `html-to-image` → `jspdf`, filename `nota-<receiptNo>.pdf`; verify downloaded PDF visually matches the preview
- [x] 6.5 JPG export: `html-to-image` `toJpeg`, filename `nota-<receiptNo>.jpg`; verify downloaded image matches the preview
- [x] 6.6 Client-only guards (dynamic import, `"use client"`) for the export libs; verify `npm run build` has no SSR errors

## 7. Sale history & void

- [x] 7.1 History list: receipt no, datetime, grand total, payment method, void badge, newest first, with date/range filter; verify filtering to one day lists only that day's sales
- [x] 7.2 Filtered daily total excluding voided sales; verify the shown total equals the sum of non-voided grand totals in the filter
- [x] 7.3 Open a past sale → same receipt preview + export/print actions; verify a price change after the sale does not change the reprinted receipt
- [x] 7.4 Void action with optional reason; verify the sale stays in history marked VOID, is excluded from totals, its number is never reused, and its receipt still previews with a VOID mark

## 8. Shop settings

- [x] 8.1 Settings page to edit address, phone, header note, footer note (no shop-name field) + `startingReceiptNo`; verify saved values appear on new and reprinted receipts
- [x] 8.2 Blank optional fields render with no empty gaps on the receipt; verify with header/footer notes cleared
- [x] 8.3 Lowering `startingReceiptNo` below used numbers does not cause collisions; verify next sale continues from `maxReceiptNo+1`
- [x] 8.4 Defaults available on first run; verify completing a sale before visiting settings still produces a valid numbered receipt with `Shinzi Computer`

## 9. End-to-end verification

- [x] 9.1 Full flow test: set password → login → add products → make a sale with discount + cash → preview → export PDF/JPG → print → find it in history → void it; verify each step matches its spec scenarios
- [x] 9.2 `npm run build && npm run start` runs clean; verify the production build serves login and all protected pages
- [x] 9.3 Update `README.md` with setup (Node LTS, `npm install`, `prisma migrate`, `set-password`, run) and the manual `prisma/dev.db` backup note; verify a new machine can follow it start to finish
- [x] 9.4 Run `openspec validate add-pos-receipt-system --strict`; verify it passes
