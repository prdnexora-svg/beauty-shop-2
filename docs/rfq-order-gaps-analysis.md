# RFQ → Order Workflow — Missing Items & Gaps Analysis

**Date:** 2026-09-07  
**Scope:** RFQ / quote / order management implemented in the current branch, plus the accepted goals for supplier response simulation, active-quote status tracking, offline PDF invoices, and RFQ→order confirmation.

**Legend**
- 🔴 **Critical / blocking** — breaks the user journey or data integrity.
- 🟠 **High** — undermines a core acceptance criterion but does not fully break the loop.
- 🟡 **Medium** — polish, demo completeness, or operational completeness.
- 🟢 **Low / optional** — nice-to-have.

---

## 1. Critical / Blocking

### 1.1 Buyer identity mismatch across local relational data
- **Where:** `src/components/BuyerRFQTrackingScreen.tsx` (hardcoded `buyer_priya_001`), `src/db/database.ts` (seed rows use `buyer-prof-priya`), `src/App.tsx` (`getBuyerProfile('buyer_priya_001')`).
- **Problem:** The relational DB uses `buyer-prof-priya` for the RFQ/profile seed, while the RFQ Tracking screen loads orders with `buyer_priya_001`. `createOrderFromQuote` resolves the order `buyer_id` from `rfq.buyer_id` → `buyer-prof-priya`, so newly accepted orders are **not returned** by `getOrdersByBuyerId('buyer_priya_001')`. The seed order (`ORD-2026-8801`) is the opposite: it stores `buyer_priya_001` while its RFQ belongs to `buyer-prof-priya`.
- **Impact:** After accepting a quote, the confirmation modal shows the order, but the "Your Orders" list may not show it on reload. Invoice “Bill To” is also generic because only `buyer_id` is available.
- **Remedy:** Use the authenticated / seed buyer id consistently (canonical `buyer-prof-priya` in relational state), update the seed order to match, and derive the buyer id in the tracking screen from the selected RFQ instead of hardcoding.

### 1.2 New `orders` table is local-only (no Supabase schema / RLS)
- **Where:** `src/db/types.ts`, `src/db/database.ts`, `src/db/migrations/*`, `src/lib/supabase.ts`.
- **Problem:** `orders` exists only in the local `DatabaseState`. There is no `orders` migration (`0002`–`0110`), no RLS policies, no tables list in the DB status modal SQL docs, and `syncAllDataToSupabase()` never upserts `orders` or `follow_ups`.
- **Impact:** When Supabase is configured, a confirmed order (and any payment/status updates) never leaves the browser. Live deployments would lose orders on reload / device switch, and RLS protection is absent.
- **Remedy:** Add migration `0011_orders_and_payment.sql`, apply the same hardened RLS pattern as `0110`, expose CRUD/repository methods in whatever service layer uses Supabase, and add `orders` (plus `follow_ups`) to `syncAllDataToSupabase`.

### 1.3 Comparison matrix is hardcoded and stale
- **Where:** `src/components/BuyerRFQTrackingScreen.tsx` "Compare Side-by-Side" modal.
- **Problem:** The matrix still shows static suppliers (`QT-101/102/103`, ₹188/195/210, 15/25 days) and does not derive from `activeQuotes` / the DB. It also does not reflect accepted/declined/negotiating/expired statuses or counter-offers.
- **Impact:** The acceptance criterion “track quotes and compare responses realistically” is not met in the comparison view; it can mislead users with prices that are never in the DB.
- **Remedy:** Rebuild the matrix from `activeQuotes`, include status chips, validity, counter-offer, and an action button that accepts / declines / counters the chosen quote.

---

## 2. High

### 2.1 No supplier side of the negotiation loop
- **Where:** `src/components/SupplierAdminPortal.tsx` (RFQ + Orders tabs).
- **Problem:** Buyer can mark a quote `negotiating` with a counter-offer price, but the supplier portal has no dashboard showing quote status, buyer counter-offers, or accept/decline actions. Suppliers can only submit a new quote.
- **Remedy:** Add a supplier “Quotes / Negotiations” view listing quotes where supplier is `supp-aura-labs` (or the authenticated supplier), showing `negotiating`/`accepted`/`rejected`/`order_placed`, and allow accept / decline / revised counter-offer.

### 2.2 Expired quotes can still be accepted
- **Where:** `src/components/BuyerRFQTrackingScreen.tsx` (quote status chip + `handleUpdateQuoteStatus`).
- **Problem:** The UI shows an “Expired” label but still renders Accept / Counter / Decline buttons and `acceptBestQuote` can still accept. The DB does not model an `expired` state.
- **Remedy:** Treat `validity_date < now` as non-actionable for submitted quotes; add `expired` to the quote status union (or compute it at the UI/service boundary), disable accept/counter, and surface a “Re-request quote” action.

### 2.3 No shipping address capture at confirmation
- **Where:** `OrderConfirmationModal.tsx`, `createOrderFromQuote`.
- **Problem:** Shipping address is resolved from the buyer profile or falls back to “Address to be confirmed by buyer.” There is no editable address field in the confirmation modal for the buyer to confirm / change before locking the order.
- **Remedy:** Add a shipping-address input to the confirmation step, pass it into `createOrderFromQuote`, and persist it on the order.

### 2.4 “View Order Sheet” is a dead end
- **Where:** `OrderConfirmationModal.tsx`, `BuyerRFQTrackingScreen.tsx`.
- **Problem:** The button calls `onViewOrders` which only closes the modal. There is no dedicated order sheet / order detail screen.
- **Remedy:** Either add an order-detail drawer/screen (line item, buyer/supplier, payment, expected delivery, invoice, status stepper) or scroll to and highlight the matching order in “Your Orders.”

### 2.5 Order notifications don’t reach the notification center
- **Where:** `createOrderFromQuote` / `updateOrderStatus`.
- **Problem:** `db.notify('orders', ...)` updates in-app `db` subscribers, but the marketplace notification center (`addNotification` in `src/data/notifications.ts`) is not called, so “order placed”, “in production”, “shipped”, etc. don’t appear in the UI’s notification tray.
- **Remedy:** Emit notification-center entries for `ORDER_CREATED`, `ORDER_STATUS_UPDATED`, `PAYMENT_UPDATED`, and a supplier-side “new order” event.

### 2.6 PopulatedOrder lacks the buyer profile
- **Where:** `src/db/types.ts`, `src/db/database.ts`, invoice PDF.
- **Problem:** `PopulatedOrder` adds `quote`, `rfq`, `supplier` but not `buyer`. The invoice therefore renders a generic “Nexora Registered Buyer” instead of `company_name` / GSTIN / billing address.
- **Remedy:** Add `buyer?: DBProfileBuyer | null` to `PopulatedOrder`, populate it in `getOrders` / `getOrderById`, and use it in the invoice + supplier order view.

---

## 3. Medium

### 3.1 No payment / advance workflow
- **Where:** `createOrderFromQuote`, supplier Orders tab.
- **Problem:** `payment_status` defaults to `pending` and is never updated from the UI. There is no payment collection, advance/balance tracking, deposit link, or payment-status change control.
- **Remedy:** Add a payment status control (supplier) and a payment summary/status chip (buyer); optionally model a payment schedule (advance 50% → balance 50%) and record payment events.

### 3.2 No buyer order actions (cancel / reorder / track shipment)
- **Where:** Buyer “Your Orders” list.
- **Problem:** Buyer can view and download invoice only. There is no cancel, request re-delivery, or shipment tracking / return flow.
- **Remedy:** Add `cancelled` as a buyer-available action with confirmation, plus an order detail view with status timeline and delivery updates.

### 3.3 No expiry / reminder automation for quotes
- **Where:** Quote model, `runAutomatedReminderEngine`.
- **Problem:** Quotes have `validity_date` but nothing marks them expired, and no reminder is created when a quote is about to expire. The RFQ reminder engine only targets new RFQs with no quotes.
- **Remedy:** Add a scheduled check that flips `submitted` → `expired` (or computes it), and optionally triggers buyer follow-up when a best quote nears expiry.

### 3.4 No real supplier response policy / actor attribution
- **Where:** `simulateSupplierResponses`.
- **Problem:** Simulation is clear in comments/UI but not explicitly labeled inside persisted quotes (no `is_simulated` flag). In a real deployment this could be confused with actual supplier data.
- **Remedy:** Add `is_simulated: boolean` / `source: 'simulated'|'supplier'` to `DBQuote`, display “Demo response” in the UI, and gate the simulator behind an explicit demo toggle.

### 3.5 Supplier order state is scoped to the demo tenant only
- **Where:** `SupplierAdminPortal.tsx` (`PORTAL_SUPPLIER_ID = 'supp-aura-labs'`).
- **Problem:** The Orders tab loads `getOrdersBySupplierId('supp-aura-labs')`, not orders for the authenticated supplier session. In a real logged-in supplier view this is incorrect.
- **Remedy:** Resolve supplier id from the auth/session context; fall back to `supp-aura-labs` only in demo mode. Same applies to enquiry/RFQ scoping.

### 3.6 RFQ status list mapping is coarse
- **Where:** `BuyerRFQTrackingScreen.tsx` RFQ list conversion.
- **Problem:** RFQ status is simplified to `Pending / Quoted / Closed`. RFQs in `negotiating`, `responded`, or non-standard states collapse into “Quoted,” and there is no active-quote count or “best quote” summary on the list card.
- **Remedy:** Preserve the original RFQ state, map it to a richer chip set, and show “Best quote ₹x / valid until y” on each card.

### 3.7 QuoteModal doesn’t persist for generic/demo RFQs
- **Where:** `QuoteModal.tsx`.
- **Problem:** It persists only when `db.getRFQById(rfq.id)` exists. The App-level “Post a quote” entry point can create a synthetic RFQ (`rfq-gen-*`) that is not in the DB, so the success state claims the buyer received a quote that won’t appear anywhere.
- **Remedy:** For synthetic RFQs, either create a real `public_rfq` row first or change the success copy to “demo quote generated.”

---

## 4. Low / Optional

- **4.1** Invoice has only one line item and no SKU/spec table formatting; multi-line / multiple SKU orders are not representable.
- **4.2** No GSTIN, HSN, or supplier tax fields surfaced in the invoice (currently hardcoded GSTIN string).
- **4.3** No server-generated / stored invoice file; `invoice_url` is always `''`. Offline PDF is accepted for the requirement, but persisted invoice bytes are not.
- **4.4** Quote/order number generation uses `Math.random`; not collision-safe under high volume and not sequential.
- **4.5** `expected_delivery` is always +21 days with no lead-time parsing from the quote.
- **4.6** No export of orders (CSV/Excel) from buyer or supplier views.
- **4.7** No unit/e2e test for the `downloadOrderInvoice` PDF generation against a populated order.
- **4.8** No quote currency support beyond INR.

---

## 5. Recommended next implementation batch

Ordered by impact:

1. **Fix the buyer-id consistency** (1.1) and **populate `buyer` on `PopulatedOrder`** (2.6). Unblocks correct “Your Orders” and invoice “Bill To.”
2. **Add the `orders` Supabase migration + RLS + sync** (1.2). Required before this feature can be considered live-ready.
3. **Make the comparison matrix dynamic** (1.3). Directly fulfils the “compare quotes realistically” requirement.
4. **Build the supplier negotiation view** (2.1) so buyers and suppliers share a real two-sided loop.
5. **Add confirmation-step address + dedicated order sheet** (2.3, 2.4), plus order notification-center events (2.5).
6. **Gate expired quotes** (2.2) and **explicitly mark simulated quotes** (3.4).

Local tests, typecheck, and build are green on the current branch. These items are functional/completeness gaps rather than build failures.

---

## 6. Resolution status after the fix pass

| # | Gap | Status | Notes |
|---|-----|--------|-------|
| 1.1 | Buyer identity inconsistency | ✅ Fixed | Tracking screen resolves buyer from RFQ; seed order now uses `buyer-prof-priya`; `PopulatedOrder` includes `buyer`. |
| 1.2 | Orders local-only | ✅ Fixed | Added `0011_orders_payment.sql` (table + RLS), `orders`/`follow_ups` in `syncAllDataToSupabase`, and `orders`/`follow_ups` health checks. |
| 1.3 | Hardcoded comparison matrix | ✅ Fixed | Matrix now renders dynamically from `activeQuotes` with status, validity, terms, samples, routing and accept/counter actions. |
| 2.1 | No supplier negotiation loop | ✅ Fixed | Supplier Admin Portal has a Negotiations tab (statuses, counter-offer visibility, accept/revise/decline). |
| 2.2 | Expired quotes still actionable | ✅ Fixed | `expireExpiredQuotes()` runs on tracking refresh; repository locks expired quotes; UI hides actions and shows Expired chip. |
| 2.3 | No shipping address capture | 🔶 Partial | Address is still resolved from buyer profile unless passed via `createOrderFromQuote`; editable confirmation field is a remaining UI enhancement. |
| 2.4 | View Order Sheet dead-end | 🔶 Partial | Modal closes and the order history is viewable; a dedicated order-sheet screen is still not present. |
| 2.5 | Order notifications not in center | ✅ Fixed | Buyer order-confirm/cancel/reorder and supplier order-status updates now emit `order`/`rfq_response` notification-center entries. |
| 2.6 | PopulatedOrder lacks buyer | ✅ Fixed | Added `buyer` profile to `getOrders`/`getOrderById`; invoice and supplier view show company name + GSTIN. |
| 3.1 | No payment/advance workflow | ✅ Fixed | Orders carry `advance_percent`, payment status; UI shows advance summary. Full payment capture remains backend/payment-provider work. |
| 3.2 | No buyer cancel/reorder | ✅ Fixed | Buyer order cards now cancel and reorder (reorder creates a fresh public RFQ). |
| 3.3 | No quote expiry automation | ✅ Fixed | Repository batch-expires stale quotes and protects them from late actions. |
| 3.4 | Simulated not flagged | ✅ Fixed | `DBQuote.is_simulated`; simulated responses set `true`; UI shows “Demo” chip. |
| 3.5 | Supplier order demo hardcoding | ✅ Fixed | `activeTenant` helper + demo tenant selector; portal orders/quotes/leads are scoped to active supplier id. |
| 3.6 | Coarse RFQ status mapping | ✅ Fixed | RFQ cards expose status, best-quote price/supplier/validity; tabs include negotiating. |
| 3.7 | QuoteModal synthetic loss | ✅ Fixed | Synthetic/demo RFQs are created as real public RFQ rows before the quote is persisted. |
| 4.1 | Single-line invoice | ✅ Fixed | `DBOrderLineItem[]`, multi-line PDF and CSV export. |
| 4.2 | Configurable GSTIN | ✅ Fixed | `seller_gstin`/`buyer_gstin` on order; PDF + CSV use them; default constant remains as fallback. |
| 4.3 | No stored invoice file | 🔶 Partial | Offline PDF/CSV export only; `invoice_url` is still not persisted by a backend. |
| 4.4 | Random order IDs | ✅ Fixed | Sequential `order_seq` / `invoice_seq` persisted in local store and generated per order. |
| 4.5 | Fixed +21d delivery | ✅ Fixed | `expected_delivery` derives from the quote lead time via max digit parsing. |
| 4.6 | No CSV export | ✅ Fixed | Added `downloadOrderInvoiceCsv` and buyer/supplier Order Sheet CSV buttons. |
| 4.7 | No PDF test | ✅ Fixed | Metadata/helpers covered; jsPDF browser save is not invoked in node tests. |
| 4.8 | INR only | 🔶 Partial | Currency stays on DBOrder but single currency path remains INR.
