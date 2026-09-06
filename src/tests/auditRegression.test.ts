import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}});
Object.defineProperty(globalThis, 'window', { configurable: true, value: {
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
}});
const { SearchFilterScreen } = await import('../components/SearchFilterScreen');
const { LUXE_TRENDING } = await import('../components/luxe/TrendingProducts');
const { LUXE_SUPPLIERS } = await import('../components/luxe/VerifiedSuppliers');
const { SPONSORED_PRODUCTS_DB } = await import('../data/sponsoredProductsData');
const { SELLER_PROFILES_DB } = await import('../data/sellerProfilesData');
const { PostRequirementScreen } = await import('../components/PostRequirementScreen');
const noop = () => {};
const searchProps = { onOpenEnquiryModal: noop, onOpenQuoteModal: noop, onOpenRFQModal: noop,
  onNavigateToExplore: noop, onCallSupplier: noop, onWhatsAppSupplier: noop, onNavigate: noop };

test('Vitamin C search returns skincare results without an implicit Haircare filter', () => {
  const html = renderToStaticMarkup(React.createElement(SearchFilterScreen, { ...searchProps, initialQuery: 'Vitamin C Serum' }));
  assert.ok(!html.includes('Category: Haircare'));
  assert.ok(!html.includes('No matching formulations or products'));
  assert.ok(!html.includes('Compare (2)'));
});
test('an unmatched search has an explicit empty state', () => {
  const html = renderToStaticMarkup(React.createElement(SearchFilterScreen, { ...searchProps, initialQuery: 'nonexistent-audit-product-839' }));
  assert.ok(html.includes('No matching formulations or products'));
});
test('city search starts in the supplier scope', () => {
  const html = renderToStaticMarkup(React.createElement(SearchFilterScreen, { ...searchProps, initialTab: 'suppliers', initialLocation: 'Mumbai' }));
  assert.ok(!html.includes('No matching formulations or products'));
  assert.ok(html.includes('Mumbai'));
});
test('featured product cards agree with their detail records', () => {
  for (const card of LUXE_TRENDING) {
    const detail = SPONSORED_PRODUCTS_DB[card.id];
    assert.ok(detail);
    assert.equal(card.title, detail.title);
    assert.equal(card.supplier, detail.supplierName);
    assert.equal(card.supplierId, detail.seller_id);
    assert.equal(card.price, detail.priceRange);
    assert.equal(card.moq, `MOQ ${detail.moq}`);
  }
});
test('featured supplier buttons identify the business shown on the card', () => {
  for (const card of LUXE_SUPPLIERS) {
    const profile = SELLER_PROFILES_DB[card.id];
    assert.ok(profile);
    assert.equal(card.name, profile.name);
    assert.equal(card.rating, profile.overallRating);
  }
});
test('quick requirement draft is passed into the detailed RFQ form', () => {
  const html = renderToStaticMarkup(React.createElement(PostRequirementScreen, {
    onNavigateToExplore: noop, initialDraft: { requirement: 'Audit salon shampoo', quantity: '750', city: 'Pune' },
  }));
  assert.ok(html.includes('Audit salon shampoo'));
  assert.ok(html.includes('value="750"'));
  assert.ok(!html.includes('brand_formulation_brief.pdf'));
  assert.ok(!html.includes('reference_bottle_packaging.jpg'));
});
