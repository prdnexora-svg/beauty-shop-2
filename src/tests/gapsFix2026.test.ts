/**
 * End-to-end gaps & bugs regression suite (2026-09-08).
 *
 * Two layers of protection for the fixes made in the gaps-analysis pass:
 *
 *  A) Source-wiring guards — fail the build if a UI control regresses back to
 *     a dead/no-op state:
 *       · every <button> in src/components carries a real handler or is
 *         explicitly marked as an inert design-preview element
 *       · the counter-offer modal stays mounted and wired in the RFQ tracking
 *         screen (previously: state existed but no modal was ever rendered)
 *       · the buyer dashboard reads live RFQ records instead of mock fixtures
 *       · viewed buyer profiles can no longer hijack the signed-in identity
 *       · every declared screen keeps a route title (URL-sync completeness)
 *       · the deleted legacy/duplicate modules stay deleted
 *
 *  B) Behavioural flows over the local relational store (same shims as the
 *     RFQ/order workflow suite):
 *       · order shipping address edits persist and populate
 *       · a sample requisition persists as a direct enquiry routed to the
 *         resolved supplier and shows up in the buyer's enquiry listing
 *       · counter offers persist price + notes on the quote record
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

// ---------------------------------------------------------------------------
// A) Source-wiring guards
// ---------------------------------------------------------------------------

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

test('every button in the UI carries an action or is explicitly inert', () => {
  const ALLOWED = [/onClick/, /onMouseDown/, /onMouseUp/, /type\s*=\s*["'{]\s*submit\s*["'}]/, /\bdisabled\b/, /data-inert/];
  const offenders: Array<{ file: string; line: number; tag: string }> = [];
  for (const file of collectSourceFiles(path.join(REPO_ROOT, 'src', 'components'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<button\b[^>]*(?:\n[^>]*)*>/g)) {
      const tag = match[0];
      if (!ALLOWED.some((re) => re.test(tag))) {
        offenders.push({
          file: path.relative(REPO_ROOT, file),
          line: source.slice(0, match.index).split('\n').length,
          tag: tag.replace(/\s+/g, ' ').slice(0, 80),
        });
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `Found dead buttons without an action:\n${offenders.map((o) => `${o.file}:${o.line} ${o.tag}`).join('\n')}`
  );
});

test('RFQ tracking keeps the counter-offer modal mounted and wired', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'src', 'components', 'BuyerRFQTrackingScreen.tsx'), 'utf8');
  assert.ok(src.includes('isCounterModalOpen && counterQuoteId'), 'counter modal render branch missing');
  assert.ok(src.includes("handleUpdateQuoteStatus(counterQuoteId, 'counter'"), 'counter submit must persist via handleUpdateQuoteStatus');
  assert.ok(src.includes('counterNotesInput'), 'counter notes field missing');
  assert.ok(src.includes('onNavigateToChat(quote.supplier)'), 'chat must receive the supplier name, not the quote id');
  assert.ok(!src.includes('quotes_count + 1'), 'fabricated responses count must not return');
});

test('buyer dashboard RFQ cards read live relational data', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'src', 'components', 'BuyerDashboard.tsx'), 'utf8');
  assert.ok(!src.includes('BUYER_MOCK_RFQS'), 'dashboard must not fall back to mock RFQ fixtures');
  assert.ok(src.includes("db.getRFQsAndEnquiries({ buyer_id: 'buyer-prof-priya' })"), 'dashboard must read live RFQs');
  assert.ok(src.includes("onNavigate('rfq-tracking', { rfqId: rfq.id })"), 'Compare Quotes must deep-link into tracking');
  assert.ok(src.includes("openEdit: true"), 'Edit RFQ must deep-link into the tracking editor');
});

test('viewing a public buyer profile cannot hijack the signed-in identity', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'src', 'App.tsx'), 'utf8');
  assert.ok(src.includes('viewedBuyerProfile'), 'App must keep viewed profiles in a separate slot');
  assert.ok(src.includes('buyerProfile={viewedBuyerProfile ?? buyerProfile}'), 'profile route must fall back to the own profile');
  // The hijack pattern itself must not exist any more.
  assert.ok(!src.includes('setBuyerProfile({ ...found })'), 'viewed profile must not overwrite the own profile');
});

test('every screen has a route title and the screens stay URL mappable', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'src', 'App.tsx'), 'utf8');
  const roleAccess = fs.readFileSync(path.join(REPO_ROOT, 'src', 'lib', 'roleAccess.ts'), 'utf8');
  const screenIds = [...roleAccess.matchAll(/^ {2}'?([a-z0-9-]+)'?: '(?:public|buyer|supplier)'/gm)].map((m) => m[1]);
  assert.ok(screenIds.length > 0, 'no screen access map found');
  for (const id of screenIds) {
    assert.ok(
      src.includes(`'${id}':`),
      `App SCREEN_URL_TITLES (or path map) is missing an entry for screen "${id}"`,
    );
  }
});

test('deleted legacy/duplicate modules stay deleted', () => {
  const deleted = [
    'SponsoredImageAds.tsx',
    'SponsoredReelsSection.tsx',
    'SponsoredFullVideoSection.tsx',
    'SponsoredReelLightboxModal.tsx',
    'SponsoredVideoLightboxModal.tsx',
    'PostSocialBar.tsx',
    'SavedSuppliersSection.tsx',
    'LiveSourcingRequests.tsx',
    'LiveChatWidget.tsx',
    'DatabaseStatusModal.tsx',
    'QueryBuilderPanel.tsx',
  ];
  for (const file of deleted) {
    assert.ok(
      !fs.existsSync(path.join(REPO_ROOT, 'src', 'components', file)),
      `${file} must stay deleted (unreachable duplicate/legacy module)`,
    );
  }
  // The public DB inspector removed in audit F01 must never be re-imported.
  const appSrc = fs.readFileSync(path.join(REPO_ROOT, 'src', 'App.tsx'), 'utf8');
  assert.ok(!appSrc.includes('DatabaseStatusModal'), 'DatabaseStatusModal must not return to App');
});

// ---------------------------------------------------------------------------
// B) Behavioural flows over the local relational store
// ---------------------------------------------------------------------------

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

function buildOrderForAddressTest() {
  const rfq = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: 'supp-aura-labs',
    product_id: null,
    requirement_title: 'Address Edit Test RFQ',
    category: 'Skincare & Serums',
    quantity_required: 500,
    quantity_unit: 'Units',
    delivery_location: 'Mumbai, MH',
    details: 'Automated address edit test.',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: false,
  });
  const quote = db.createQuote({
    rfq_id: rfq.id,
    supplier_id: 'supp-aura-labs',
    unit_price: 150,
    total_price: 150 * 500,
    moq_offered: 500,
    lead_time: '10 business days',
    validity_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    terms_and_conditions: 'Standard terms.',
    status: 'submitted',
    sample_available: false,
  });
  db.updateQuoteStatus(quote.id, 'accepted');
  const order = db.createOrderFromQuote(quote.id);
  assert.ok(order, 'order creation failed');
  return order!;
}

test('order shipping address edit persists and populates on the order record', () => {
  const order = buildOrderForAddressTest();
  const newAddress = 'Warehouse 4, MIDC Industrial Area, Andheri East, Mumbai 400093';
  const updated = db.updateOrderShippingAddress(order.id, newAddress);
  assert.ok(updated);
  assert.equal(updated!.shipping_address, newAddress);
  // Read-back through the populated repository view (what the invoice renders).
  const reread = db.getOrderById(order.id);
  assert.equal(reread?.shipping_address, newAddress);
  // Empty input is a no-op, not a wipe.
  const noop = db.updateOrderShippingAddress(order.id, '   ');
  assert.equal(noop?.shipping_address, newAddress);
});

test('sample requisition persists as a direct enquiry routed to the resolved supplier', () => {
  // Mirror the exact supplier-resolution logic used in App.tsx onSubmit.
  const supplierNameLc = 'aura beauty labs'; // display name from the product page
  const supplier = db.getSupplierProfiles().find((s) => {
    const cn = s.company_name.toLowerCase();
    const base = cn.split('&')[0].trim();
    return cn === supplierNameLc || cn.includes(supplierNameLc) || base === supplierNameLc;
  });
  assert.ok(supplier, 'tolerant supplier resolution must match the registered company name');

  const enquiry = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: supplier!.id,
    product_id: null,
    requirement_title: 'Sample Request: Vitamin C Brightening Serum',
    category: 'Skincare & Serums',
    quantity_required: 1,
    quantity_unit: 'Sample Set',
    delivery_location: 'Mumbai, MH',
    details: 'Sample set: 1x 50ml — ₹1,250 · Evaluation purpose: Stability Testing',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: false,
  });

  // It appears in the buyer's enquiry listing (what the Enquiry Log merges).
  const directEnquiries = db.getRFQsAndEnquiries({ type: 'direct_enquiry' });
  assert.ok(directEnquiries.some((r) => r.id === enquiry.id), 'sample request missing from buyer enquiry listing');

  // The supplier side receives a follow-up task for the routed sample request.
  const followUps = db.getFollowUps(supplier!.id);
  assert.ok(followUps.some((f) => f.rfq_id === enquiry.id), 'supplier follow-up was not created for the sample request');

  // It also appears in the supplier-scoped lead feed the portal reads.
  const supplierLeads = db.getRFQsAndEnquiries({ supplier_id: supplier!.id });
  assert.ok(supplierLeads.some((r) => r.id === enquiry.id), 'supplier lead feed missing the sample request');
});

test('unresolvable sample supplier falls back to matching (never routes to a wrong business)', () => {
  const supplierNameLc = 'pureformulations pvt'; // has no registered db supplier
  const supplier = db.getSupplierProfiles().find((s) => {
    const cn = s.company_name.toLowerCase();
    const base = cn.split('&')[0].trim();
    return cn === supplierNameLc || cn.includes(supplierNameLc) || base === supplierNameLc;
  });
  assert.equal(supplier, undefined, 'unknown supplier must resolve to no direct target');

  const enquiry = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: supplier?.id || null,
    product_id: null,
    requirement_title: 'Sample Request: Niacinamide 10% Serum',
    category: 'Skincare & Serums',
    quantity_required: 1,
    quantity_unit: 'Sample Set',
    delivery_location: 'Pune, MH',
    details: 'Automated fallback routing test.',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: !supplier,
  });
  assert.equal(enquiry.supplier_id, null);
  assert.ok(
    (enquiry.matched_supplier_ids || []).length > 0,
    'fallback must distribute to matching verified suppliers instead of a random one',
  );
});

test('counter offers persist price and notes on the quote record', () => {
  const rfq = db.createRFQEnquiry({
    buyer_id: 'buyer-prof-priya',
    supplier_id: 'supp-dermaglow',
    product_id: null,
    requirement_title: 'Counter Offer Persistence Test RFQ',
    category: 'Skincare & Serums',
    quantity_required: 1000,
    quantity_unit: 'Units',
    delivery_location: 'Delhi, DL',
    details: 'Automated counter offer test.',
    attachments: [],
    status: 'new',
    type: 'direct_enquiry',
    send_to_similar_suppliers: false,
  });
  const quote = db.createQuote({
    rfq_id: rfq.id,
    supplier_id: 'supp-dermaglow',
    unit_price: 200,
    total_price: 200 * 1000,
    moq_offered: 1000,
    lead_time: '12 business days',
    validity_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    terms_and_conditions: 'Standard terms.',
    status: 'submitted',
    sample_available: true,
  });

  db.updateQuoteStatus(quote.id, 'negotiating', {
    counter_offer_price: 178,
    counter_offer_notes: 'Accept 178/unit with 50% advance for a 3-month contract',
  });

  const stored = db.getQuoteById(quote.id);
  assert.equal(stored?.status, 'negotiating');
  assert.equal(stored?.counter_offer_price, 178);
  assert.equal(stored?.counter_offer_notes, 'Accept 178/unit with 50% advance for a 3-month contract');
});
