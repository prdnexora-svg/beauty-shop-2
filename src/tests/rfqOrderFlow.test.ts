/**
 * RFQ → Order workflow coverage.
 *
 * Verifies the end-to-end behaviour the buyer uses on
 * BuyerRFQTrackingScreen and the supplier uses on SupplierAdminPortal:
 *
 *   RFQ published -> supplier response simulation -> quote status tracking
 *   -> accept final quote -> persisted order + invoice metadata
 *   -> order appears in buyer order history.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Browser environment shims so the local relational store runs under node:test.
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => { storage.set(k, String(v)); },
  removeItem: (k: string) => { storage.delete(k); },
  clear: () => { storage.clear(); },
};
const listeners = new Map<string, Set<(e: unknown) => void>>();
(globalThis as any).window = {
  addEventListener: (t: string, fn: (e: unknown) => void) => {
    if (!listeners.has(t)) listeners.set(t, new Set());
    listeners.get(t)!.add(fn);
  },
  removeEventListener: (t: string, fn: (e: unknown) => void) => { listeners.get(t)?.delete(fn); },
  dispatchEvent: (event: { type: string }) => {
    listeners.get(event.type)?.forEach((fn) => fn(event));
    return true;
  },
  atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
  btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
};
(globalThis as any).atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
(globalThis as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string; detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) { this.type = type; this.detail = init?.detail; }
  };
}

const { db } = await import('../db/database');
const {
  invoiceFileName,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
} = await import('../utils/invoicePdf');

test('rfq order flow: simulated supplier responses populate a clean RFQ', () => {
  const rfq = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: null,
    product_id: null,
    requirement_title: 'Bulk Niacinamide Serum Base (RFQ Order Flow Test)',
    category: 'Skincare & Serums',
    quantity_required: 2500,
    quantity_unit: 'Units',
    delivery_location: 'Jaipur, RJ',
    details: 'Automated workflow test requirement.',
    attachments: [],
    status: 'new',
    type: 'public_rfq',
    send_to_similar_suppliers: true,
  });

  const quotes = db.simulateSupplierResponses(rfq.id, 3);
  assert.equal(quotes.length, 3);

  const stored = db.getQuotesByRfqId(rfq.id);
  assert.equal(stored.length, 3);
  assert.ok(stored.every((q) => q.status === 'submitted'));
  assert.ok(stored.every((q) => q.validity_date));
  assert.ok(stored.every((q) => q.rfq_id === rfq.id));

  assert.equal(db.getRFQById(rfq.id)?.status, 'responded');
});

test('rfq order flow: accepting a quote creates a persisted order record', () => {
  const rfq = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: 'supp-aura-labs',
    product_id: null,
    requirement_title: 'Bulk Vitamin C Moisturiser Base (RFQ Order Flow Test)',
    category: 'Skincare & Serums',
    quantity_required: 2000,
    quantity_unit: 'Units',
    delivery_location: 'Mumbai (PIN: 400051)',
    details: 'Automated order-creation test requirement.',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: false,
  });

  const quote = db.createQuote({
    rfq_id: rfq.id,
    supplier_id: 'supp-aura-labs',
    unit_price: 175,
    total_price: 175 * 2000,
    moq_offered: 2000,
    lead_time: '12 business days',
    validity_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    terms_and_conditions: 'SOP-standard 50/50 terms.',
    status: 'submitted',
    sample_available: true,
  });

  db.updateQuoteStatus(quote.id, 'accepted');
  const order = db.createOrderFromQuote(quote.id);

  assert.ok(order);
  assert.match(order.order_no, /^ORD-\d{4}-\d{5}$/);
  assert.match(order.invoice_no, /^INV-\d{4}-\d{5}$/);
  assert.equal(order.quote_id, quote.id);
  assert.equal(order.rfq_id, rfq.id);
  assert.equal(order.quantity, 2000);
  assert.equal(order.unit_price, 175);
  assert.equal(order.subtotal, 350000);
  assert.equal(order.tax_rate, 18);
  assert.equal(order.tax_amount, 63000);
  assert.equal(order.total_amount, 413000);
  assert.equal(order.payment_status, 'pending');
  assert.equal(order.status, 'order_confirmed');

  // Quote + RFQ both transition away from the negotiating state.
  assert.equal(db.getQuoteById(quote.id)?.status, 'order_placed');
  assert.equal(db.getQuoteById(quote.id)?.order?.id, order.id);
  assert.equal(db.getRFQById(rfq.id)?.status, 'closed');

  // Buyer order history now contains the record.
  const buyerOrders = db.getOrdersByBuyerId('buyer-prof-priya');
  assert.ok(buyerOrders.some((o) => o.id === order.id));
  assert.ok(db.getOrderById(order.id)?.quote);
});

test('rfq order flow: order creation is idempotent for the same quote', () => {
  const rfq = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: 'supp-dermaglow',
    product_id: null,
    requirement_title: 'Bulk Aloe Gel Base (RFQ Order Flow Idempotency Test)',
    category: 'Skincare & Serums',
    quantity_required: 1000,
    quantity_unit: 'Units',
    delivery_location: 'Pune, MH',
    details: 'Automated idempotency test requirement.',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: false,
  });

  const quote = db.createQuote({
    rfq_id: rfq.id,
    supplier_id: 'supp-dermaglow',
    unit_price: 120,
    total_price: 120 * 1000,
    moq_offered: 1000,
    lead_time: '10 business days',
    validity_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    terms_and_conditions: 'Standard terms.',
    status: 'submitted',
    sample_available: false,
  });

  db.updateQuoteStatus(quote.id, 'accepted');
  const first = db.createOrderFromQuote(quote.id);
  const second = db.createOrderFromQuote(quote.id);

  assert.ok(first);
  assert.ok(second);
  assert.equal(first.id, second.id);
  assert.equal(db.getOrders().filter((o) => o.quote_id === quote.id).length, 1);
});

test('rfq order flow: order status labels and invoice filename are stable', () => {
  assert.equal(ORDER_STATUS_LABELS.order_confirmed, 'Confirmed');
  assert.equal(ORDER_STATUS_LABELS.in_production, 'In Production');
  assert.equal(ORDER_STATUS_LABELS.delivered, 'Delivered');
  assert.ok(ORDER_STATUS_STEPS.includes('shipped'));

  const name = invoiceFileName({ invoice_no: 'INV-2026-00007' });
  assert.match(name, /INV-2026-00007/);
  assert.match(name, /\.pdf$/);
});
