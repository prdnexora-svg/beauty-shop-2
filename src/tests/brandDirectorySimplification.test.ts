/**
 * Brand Directory & Search — simplified main-view regression suite.
 *
 * Guards the five clean-up requirements:
 *   1. Duplicate / similar supplier rows (e.g. two "Aura Beauty Labs …" or
 *      "LuxeForm …" entries) collapse to a single card.
 *   2. Category pills are limited to the 5 essentials and the old scroll
 *      chrome / "+N more" indicator is gone.
 *   3. Sort offers only Relevance and Top Rated.
 *   4. Cards show just name, location, rating and one primary tag — the ISO /
 *      FDA / AYUSH certification chip wall, metrics grid and bookmark control
 *      were removed from the main view.
 *   5. Each card has exactly two actions: Contact Supplier and View Profile.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

// --- Browser shims (the supplier service instantiates the local DB singleton)
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => { storage.set(k, String(v)); },
  removeItem: (k: string) => { storage.delete(k); },
  clear: () => { storage.clear(); },
};
(globalThis as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};
if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string; detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) { this.type = type; this.detail = init?.detail; }
  };
}

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const SCREEN_PATH = path.join(
  REPO_ROOT, 'src', 'components', 'BrandDirectoryDetailScreen.tsx'
);
const screenSource = fs.readFileSync(SCREEN_PATH, 'utf8');

const mkSupplier = (overrides: any = {}) => ({
  id: 's', name: 'X', shortCode: 'X', type: 'Manufacturer', city: '', state: '',
  isVerified: false, status: 'active', onboardingStatus: 'approved',
  isVerifiedSupplier: false, about: '', logoUrl: '', isGstVerified: true,
  isIsoCertified: false, isBusinessVerified: false, isGmpCertified: false,
  isFdaRegistered: false, categories: [] as string[], phone: '', whatsapp: '',
  responseRate: '95%', trustScore: 65, reliabilityRating: 4.5,
  productQualityRating: 4.8, overallRating: 4.5, totalReviewsCount: 0,
  responseScore: 95, responseTimeText: '2 Hours', exportReadiness: 95,
  establishedYear: '2020', employeeCount: '', monthlyCapacity: '',
  facilityArea: '', moq: '', verificationBadge: 'Pending Audit',
  certificationsList: [], locationDetails: {} as any,
  complianceReports: [], portfolioProducts: [], ...overrides
});

// ---------------------------------------------------------------------------
// 1. Duplicate brand removal
// ---------------------------------------------------------------------------

test('same-name and similar-name supplier rows are treated as duplicates', async () => {
  const { isSameSupplierByName } = await import('../services/supplierService');
  assert.equal(isSameSupplierByName('Aura Beauty Labs', 'Aura Beauty Labs'), true);
  assert.equal(
    isSameSupplierByName('Aura Beauty Labs & Formulations', 'Aura Beauty Labs'),
    true
  );
  assert.equal(
    isSameSupplierByName('Aura Beauty Labs Pvt Ltd', 'Aura Beauty Labs'),
    true
  );
  assert.equal(
    isSameSupplierByName('LuxeForm Cosmetics & Packaging', 'LuxeForm Packaging & National Distributors'),
    true
  );
  // Distinct brands stay distinct.
  assert.equal(
    isSameSupplierByName('Aura Beauty Labs', 'Dermaglow India Biocare'),
    false
  );
  assert.equal(isSameSupplierByName('Glow Labs', 'Glowwell Naturals'), false);
});

test('dedupeSuppliers keeps one row per brand and the most trusted version wins', async () => {
  const { dedupeSuppliers } = await import('../services/supplierService');
  const rows = [
    mkSupplier({ id: 'a1', name: 'Aura Beauty Labs', trustScore: 70 }),
    mkSupplier({ id: 'a2', name: 'Aura Beauty Labs & Formulations', isVerified: true, trustScore: 96, about: 'full' }),
    mkSupplier({ id: 'l1', name: 'LuxeForm Cosmetics & Packaging', isVerified: true, trustScore: 89 }),
    mkSupplier({ id: 'l2', name: 'LuxeForm Packaging & Distributors', trustScore: 60 }),
    mkSupplier({ id: 'd1', name: 'Dermaglow India Biocare', isVerified: true, trustScore: 93 })
  ];

  const out = dedupeSuppliers(rows);
  assert.equal(out.length, 3, '5 rows with 2 dupes must collapse to 3 brands');
  assert.equal(out.find((r) => r.name.includes('Aura'))!.id, 'a2', 'verified high-trust Aura row wins');
  assert.equal(out.find((r) => r.name.includes('LuxeForm'))!.id, 'l1', 'verified LuxeForm row wins');
});

test('the live directory fetch never returns two cards for the same company', async () => {
  const { fetchSuppliers } = await import('../services/supplierService');
  const { db } = await import('../db/database');
  db.resetToSeed();
  // Simulate a repeat onboarding submission that created a second Aura row.
  db.upsertSupplierProfile({
    user_id: 'usr-duplicate-aura',
    company_name: 'Aura Beauty Labs',
    business_type: 'Manufacturer',
    city: 'Bengaluru',
    state: 'Karnataka',
    categories: ['Skincare & Serums']
  } as any);

  const res = await fetchSuppliers({ limit: 100 });
  const auraCards = res.data.filter((s) => /aura beauty labs/i.test(s.name));
  assert.equal(auraCards.length, 1, 'duplicate Aura row must be hidden from the directory');
  db.resetToSeed();
});

// ---------------------------------------------------------------------------
// 2. Simplified filter pills
// ---------------------------------------------------------------------------

test('category pills are limited to the 5 essential categories', () => {
  const match = screenSource.match(/const categories = \[([^\]]+)\];/);
  assert.ok(match, 'categories list must be declared');
  const pills = Array.from(match![1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
  assert.deepEqual(pills, ['All', 'Skincare', 'Haircare', 'Cosmetics', 'Packaging']);
});

test('the old scrollable-pill chrome and "+N more" indicator are gone', () => {
  assert.ok(!screenSource.includes('canScrollLeft'));
  assert.ok(!screenSource.includes('canScrollRight'));
  assert.ok(!screenSource.includes('handleScroll'));
  assert.ok(!screenSource.includes('filterScrollRef'));
  assert.ok(!screenSource.includes('more'));
  assert.ok(!screenSource.includes('Professional Derma'));
  assert.ok(!screenSource.includes('Ayurvedic & Herbal'));
});

// ---------------------------------------------------------------------------
// 3. Sort options
// ---------------------------------------------------------------------------

test('sort dropdown offers only Relevance and Top Rated', () => {
  assert.ok(screenSource.includes('<option value="Relevance">Relevance</option>'));
  assert.ok(screenSource.includes('<option value="Top Rated">Top Rated</option>'));
  assert.ok(!screenSource.includes('Year Established (Oldest First)'));
  assert.ok(!screenSource.includes('Employee Count (Largest First)'));
  assert.ok(!screenSource.includes("sortBy === 'Rating'"));
});

// ---------------------------------------------------------------------------
// 4. Minimal cards
// ---------------------------------------------------------------------------

test('cards expose the WHO-GMP primary tag and hide the cert chip wall', () => {
  assert.ok(screenSource.includes("'WHO-GMP Certified'"));
  // The certification chip loop was the source of ISO/FDA/AYUSH clutter.
  assert.ok(
    !screenSource.includes('brand.certifications.map'),
    'main-view cards must not enumerate every certification'
  );
  // Metric-grid clutter removed from the card body.
  assert.ok(!screenSource.includes('Capacity:'));
  assert.ok(!screenSource.includes('Response: {brand.responseRate}'));
  // Bookmark / save control removed.
  assert.ok(!screenSource.includes('toggleSaveBrand'));
  assert.ok(!screenSource.includes('savedBrandIds'));
  assert.ok(!/Bookmark(Check)?/.test(screenSource.replace(/import[^\n]*\n/g, '')));
});

// ---------------------------------------------------------------------------
// 5. Direct action buttons
// ---------------------------------------------------------------------------

test('each card has exactly two actions: Contact Supplier and View Profile', () => {
  assert.ok(screenSource.includes('<span>Contact Supplier</span>'));
  assert.ok(screenSource.includes('<span>View Profile</span>'));
  assert.ok(!screenSource.includes('<span>Direct Message</span>'));
  assert.ok(!screenSource.includes('<span>Request Quote</span>'));
  assert.ok(!screenSource.includes('View Formulations'));
});
