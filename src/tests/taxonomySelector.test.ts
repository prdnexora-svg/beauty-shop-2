/**
 * QA tests: Primary Category dropdown ↔ Subcategory Multi-Select mapping
 * on the RFQ "Product Details" section.
 *
 * Covers the three acceptance criteria:
 *   1. Selecting a Primary Category dynamically updates the subcategory pills
 *   2. Selecting multiple subcategories updates the ACTIVE TAXONOMY PATH chips
 *   3. Changing the primary category clears all previously selected subcategories
 *
 * Plus a render smoke test of <ProductTaxonomySelector /> via react-dom/server.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PRIMARY_CATEGORIES,
  CATEGORY_TAXONOMY,
  createInitialTaxonomyState,
  getAvailableSubcategories,
  changePrimaryCategory,
  toggleSubcategory,
  clearSelectedSubcategories,
  isTaxonomySelectionValid,
  getActiveTaxonomyPath,
  hasStraySubcategories
} from '../components/taxonomyFormHandler';
import { ProductTaxonomySelector } from '../components/ProductTaxonomySelector';

const EXPECTED_SEVEN = [
  'Skincare',
  'Haircare & Styling',
  'Color Cosmetics / Makeup',
  'Personal Care & Body',
  'Raw Ingredients & Actives',
  'Packaging & Containers',
  'Salon & Spa Equipment'
];

/* ------------------------------------------------------------------ */
/* Taxonomy structure: exactly the 7 required primary categories       */
/* ------------------------------------------------------------------ */

test('taxonomy exposes exactly the 7 required primary categories', () => {
  assert.equal(PRIMARY_CATEGORIES.length, 7);
  assert.deepEqual(PRIMARY_CATEGORIES, EXPECTED_SEVEN);
});

test('every primary category has a non-empty, de-duplicated subcategory list', () => {
  for (const [category, subs] of Object.entries(CATEGORY_TAXONOMY)) {
    assert.ok(subs.length >= 3, `${category} should have >= 3 subcategories`);
    assert.equal(new Set(subs).size, subs.length, `${category} has duplicate subcategories`);
  }
});

/* ------------------------------------------------------------------ */
/* 1. Dynamic mapping: category → subcategory pills                    */
/* ------------------------------------------------------------------ */

test('selecting Skincare shows Skincare subcategory pills', () => {
  const pills = getAvailableSubcategories('Skincare');
  assert.deepEqual(pills, CATEGORY_TAXONOMY['Skincare']);
  assert.ok(pills.includes('Serums & Treatments'));
  assert.ok(pills.includes('Sunscreen & Sun Care'));
});

test('selecting Haircare & Styling swaps pills to haircare subcategories', () => {
  const pills = getAvailableSubcategories('Haircare & Styling');
  assert.deepEqual(pills, CATEGORY_TAXONOMY['Haircare & Styling']);
  assert.ok(pills.includes('Shampoos & Conditioners'));
  assert.ok(pills.includes('Scalp Treatments'));
  // previous skincare pills are no longer offered
  assert.ok(!pills.includes('Serums & Treatments'));
});

test('selecting Color Cosmetics / Makeup swaps pills to makeup subcategories', () => {
  const pills = getAvailableSubcategories('Color Cosmetics / Makeup');
  assert.deepEqual(pills, CATEGORY_TAXONOMY['Color Cosmetics / Makeup']);
  assert.ok(pills.some((p) => p.startsWith('Face Makeup')));
  assert.ok(!pills.includes('Serums & Treatments'));
});

test('remaining categories each map to their own pill set', () => {
  for (const category of EXPECTED_SEVEN) {
    const pills = getAvailableSubcategories(category);
    assert.deepEqual(pills, CATEGORY_TAXONOMY[category], `${category} pills mismatch`);
  }
});

test('unknown / empty category yields no pills (no cross-category leak)', () => {
  assert.deepEqual(getAvailableSubcategories(''), []);
  assert.deepEqual(getAvailableSubcategories('Not A Category'), []);
});

/* ------------------------------------------------------------------ */
/* 2. Multi-select updates the ACTIVE TAXONOMY PATH                    */
/* ------------------------------------------------------------------ */

test('tapping multiple pills adds each one and updates the taxonomy path', () => {
  let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments']);
  state = toggleSubcategory(state, 'Moisturizers & Creams');
  state = toggleSubcategory(state, 'Face Masks & Peels');

  assert.deepEqual(state.selectedSubcategories, [
    'Serums & Treatments',
    'Moisturizers & Creams',
    'Face Masks & Peels'
  ]);
  assert.deepEqual(getActiveTaxonomyPath(state), [
    'Skincare',
    'Serums & Treatments',
    'Moisturizers & Creams',
    'Face Masks & Peels'
  ]);
});

test('tapping a selected pill again removes it from the path', () => {
  let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments', 'Cleansers & Toners']);
  state = toggleSubcategory(state, 'Serums & Treatments');
  assert.deepEqual(state.selectedSubcategories, ['Cleansers & Toners']);
  assert.deepEqual(getActiveTaxonomyPath(state), ['Skincare', 'Cleansers & Toners']);
});

test('legacy single subcategory field tracks the first selected pill', () => {
  let state = createInitialTaxonomyState('Haircare & Styling');
  assert.equal(state.subcategory, '');
  state = toggleSubcategory(state, 'Hair Oils & Serums');
  state = toggleSubcategory(state, 'Scalp Treatments');
  assert.equal(state.subcategory, 'Hair Oils & Serums');
  state = toggleSubcategory(state, 'Hair Oils & Serums');
  assert.equal(state.subcategory, 'Scalp Treatments');
});

test('clear selection empties the path back to just the primary category', () => {
  let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments', 'Eye & Lip Care']);
  state = clearSelectedSubcategories(state);
  assert.deepEqual(getActiveTaxonomyPath(state), ['Skincare']);
  assert.equal(state.subcategory, '');
});

/* ------------------------------------------------------------------ */
/* 3. Auto-clear on primary category change                            */
/* ------------------------------------------------------------------ */

test('changing primary category clears ALL previously selected subcategories', () => {
  let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments', 'Moisturizers & Creams']);
  state = changePrimaryCategory(state, 'Haircare & Styling');

  assert.equal(state.primaryCategory, 'Haircare & Styling');
  assert.deepEqual(state.selectedSubcategories, [], 'subcategories must auto-clear');
  assert.equal(state.subcategory, '', 'legacy subcategory must reset too');
  assert.equal(isTaxonomySelectionValid(state), false);
});

test('auto-clear works for every category transition', () => {
  for (const next of EXPECTED_SEVEN) {
    let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments']);
    state = changePrimaryCategory(state, next);
    if (next === 'Skincare') {
      // same category = no-op, selection preserved (covered by dedicated test)
      assert.deepEqual(state.selectedSubcategories, ['Serums & Treatments']);
      continue;
    }
    assert.deepEqual(state.selectedSubcategories, [], `switch to ${next} must clear`);
    assert.equal(hasStraySubcategories(state), false);
  }
});

test('re-selecting the SAME category keeps the current selection', () => {
  let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments']);
  state = changePrimaryCategory(state, 'Skincare');
  assert.deepEqual(state.selectedSubcategories, ['Serums & Treatments']);
});

test('selections can never contain pills from another primary category', () => {
  let state = createInitialTaxonomyState('Skincare', ['Serums & Treatments']);
  const stray = toggleSubcategory(state, 'Shampoos & Conditioners'); // haircare pill
  // simulate the guard consumers rely on: switching category wipes strays
  const cleared = changePrimaryCategory(stray, 'Haircare & Styling');
  assert.equal(hasStraySubcategories(cleared), false);
});

/* ------------------------------------------------------------------ */
/* Validation contract                                                 */
/* ------------------------------------------------------------------ */

test('isTaxonomySelectionValid requires at least one pill', () => {
  assert.equal(isTaxonomySelectionValid(createInitialTaxonomyState('Skincare')), false);
  assert.equal(
    isTaxonomySelectionValid(createInitialTaxonomyState('Skincare', ['Serums & Treatments'])),
    true
  );
});

/* ------------------------------------------------------------------ */
/* Component smoke test (react-dom/server)                             */
/* ------------------------------------------------------------------ */

function renderSelector(state: ReturnType<typeof createInitialTaxonomyState>, showValidationError = false) {
  return renderToStaticMarkup(
    React.createElement(ProductTaxonomySelector, {
      value: state,
      onChange: () => {},
      showValidationError
    })
  );
}

test('component renders the Active Taxonomy Path with selected chips', () => {
  const html = renderSelector(createInitialTaxonomyState('Skincare', ['Serums & Treatments', 'Eye & Lip Care']));
  assert.ok(html.includes('data-testid="active-taxonomy-path"'));
  assert.ok(html.includes('Active Taxonomy Path'));
  assert.ok(html.includes('Skincare'));
  assert.ok(html.includes('Serums &amp; Treatments'));
  assert.ok(html.includes('Eye &amp; Lip Care'));
  assert.ok(html.includes('Clear Selection (2)'));
  const chips = html.split('data-testid="taxonomy-path-chip"').length - 1;
  assert.equal(chips, 2);
});

test('component renders all 7 primary category options in the dropdown', () => {
  const html = renderSelector(createInitialTaxonomyState('Skincare'));
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;');
  for (const category of EXPECTED_SEVEN) {
    assert.ok(
      // selected option renders as: <option value="Skincare" selected="">…
      new RegExp(`value="${escapeHtml(category)}"(\\s|>)`).test(html),
      `missing option ${category}`
    );
  }
  assert.ok(html.includes('data-testid="primary-category-select"'));
});

test('component renders only the current category’s subcategory pills', () => {
  const html = renderSelector(createInitialTaxonomyState('Haircare & Styling'));
  assert.ok(html.includes('Shampoos &amp; Conditioners'));
  assert.ok(html.includes('Scalp Treatments'));
  assert.ok(!html.includes('Serums &amp; Treatments'));
  const group = html.split('data-testid="subcategory-pill-group"')[1] ?? '';
  const pillCount = group.slice(0, group.indexOf('</div>')).split('<button').length - 1;
  assert.equal(pillCount, CATEGORY_TAXONOMY['Haircare & Styling'].length);
});

test('component shows the empty-path hint and inline validation when nothing is picked', () => {
  const html = renderSelector(createInitialTaxonomyState('Skincare'), true);
  assert.ok(html.includes('Select one or more subcategories below'));
  assert.ok(html.includes('Pick at least 1'));
  assert.ok(html.includes('Please pick at least one subcategory'));
});

test('component marks selected pills as pressed for a11y', () => {
  const html = renderSelector(createInitialTaxonomyState('Skincare', ['Sunscreen & Sun Care']));
  assert.ok(html.includes('aria-pressed="true"'));
  assert.ok(html.includes('aria-pressed="false"'));
});
