# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript in `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/products.js` — serves product catalog and active coupon endpoints.
- `routes/orders.js` — serves order list/detail, creates orders, and cancels orders.
- `routes/customers.js` — serves customer/settlement data and records Khata settlements.
- `routes/reports.js` — serves dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/store.js` — reads and writes the JSON data file and appends audit entries.
- `lib/orders.js` — adds, gets, cancels, and filters/sorts orders.
- `lib/dates.js` — formats today's date, normalizes date keys, and derives fiscal years.
- `lib/ledger.js` — looks up customers, tracks Khata charges/reversals, and records settlements.
- `lib/inventory.js` — looks up products, checks and changes stock, and summarizes inventory.
- `lib/pricing.js` — calculates subtotals, discounts, GST totals, and line breakdowns.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupon codes.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.
- `lib/invoice.js` — calculates invoice figures and renders printable invoice HTML.
- `lib/reports.js` — calculates dashboard summaries and compares GST invoice/order totals.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.
- `package.json` currently has no implemented test script; its `test` script exits with “no test specified”.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Order history sorting and date filtering are broken, and Khata settlements corrupt customer balances.
- Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
