/**
 * QA tests: "Product Name / Specific Requirement" searchable combobox.
 *
 * Covers:
 *   - catalog integrity (all 7 categories, taxonomy-valid subcategories)
 *   - search-as-you-type filtering + ranking + keyword matching
 *   - match highlighting ranges
 *   - keyboard navigation reducer (↑ ↓ Home End, wrap-around)
 *   - template selection auto-populating category + subcategories
 *   - component render smoke tests (ARIA combobox, listbox, clear button)
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PRODUCT_TEMPLATES,
  searchProductTemplates,
  getMatchRanges,
  nextActiveIndex,
  type ProductTemplate
} from '../data/productTemplates';
import { SearchableProductCombobox } from '../components/SearchableProductCombobox';
import { CATEGORY_TAXONOMY, getAllCategoryKeys } from '../data/categoryTaxonomy';
import { createInitialTaxonomyState, hasStraySubcategories } from '../components/taxonomyFormHandler';
import { BENEFIT_OPTIONS } from '../components/formulationPreferences';

const byId = (id: string): ProductTemplate => {
  const found = PRODUCT_TEMPLATES.find((t) => t.id === id);
  assert.ok(found, `template ${id} missing`);
  return found!;
};

/* ------------------------------------------------------------------ */
/* 1. Catalog integrity                                                */
/* ------------------------------------------------------------------ */

test('catalog includes the 4 headline product examples', () => {
  const names = PRODUCT_TEMPLATES.map((t) => t.name);
  for (const required of [
    'Vitamin C Brightening Serum',
    'Hydrating Face Wash',
    'Matte Lipstick',
    'Argan Hair Oil'
  ]) {
    assert.ok(names.includes(required), `missing ${required}`);
  }
});

test('catalog covers all 7 primary categories', () => {
  const covered = new Set(PRODUCT_TEMPLATES.map((t) => t.category));
  for (const category of getAllCategoryKeys()) {
    assert.ok(covered.has(category), `no template for ${category}`);
  }
});

test('every template maps to taxonomy-valid subcategories (no strays)', () => {
  for (const template of PRODUCT_TEMPLATES) {
    const allowed = CATEGORY_TAXONOMY[template.category];
    assert.ok(allowed, `${template.id}: unknown category ${template.category}`);
    assert.ok(template.subcategories.length > 0, `${template.id}: no subcategories`);
    for (const sub of template.subcategories) {
      assert.ok(
        allowed.includes(sub),
        `${template.id}: "${sub}" is not a subcategory of ${template.category}`
      );
    }
    // the same guarantee via the form-handler guard
    const state = createInitialTaxonomyState(template.category, template.subcategories);
    assert.equal(hasStraySubcategories(state), false, `${template.id} produces strays`);
  }
});

test('template ids and names are unique', () => {
  const ids = PRODUCT_TEMPLATES.map((t) => t.id);
  const names = PRODUCT_TEMPLATES.map((t) => t.name);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(names).size, names.length);
});

test('optional benefit ids reference real builder benefit cards', () => {
  const validIds = BENEFIT_OPTIONS.map((b) => b.id);
  for (const template of PRODUCT_TEMPLATES) {
    for (const id of template.benefits ?? []) {
      assert.ok(validIds.includes(id), `${template.id}: unknown benefit ${id}`);
    }
  }
});

/* ------------------------------------------------------------------ */
/* 2. Search-as-you-type                                               */
/* ------------------------------------------------------------------ */

test('typing “serum” surfaces serums, Vitamin C first (catalog-rank tiebreak)', () => {
  const results = searchProductTemplates('serum');
  assert.ok(results.length >= 3);
  assert.equal(results[0].id, 'vitamin-c-brightening-serum');
  assert.ok(results.some((t) => t.id === 'hyaluronic-hydrating-serum'));
  assert.ok(results.some((t) => t.id === 'anti-dandruff-scalp-serum'));
});

test('“matte” finds Matte Lipstick as the top hit', () => {
  const results = searchProductTemplates('matte');
  assert.equal(results[0].id, 'matte-lipstick');
});

test('“argan” finds both argan products, hair oil ranked first', () => {
  const results = searchProductTemplates('argan');
  assert.equal(results[0].id, 'argan-hair-oil');
  assert.ok(results.some((t) => t.id === 'cold-pressed-argan-carrier-oil'));
});

test('full phrase “hydrating face wash” hits the exact product first', () => {
  const results = searchProductTemplates('hydrating face wash');
  assert.equal(results[0].id, 'hydrating-face-wash');
});

test('keyword matching works (spf → sunscreen)', () => {
  const results = searchProductTemplates('spf');
  assert.ok(results.some((t) => t.id === 'spf-50-sunscreen'));
});

test('search is case-insensitive and trims whitespace', () => {
  assert.equal(searchProductTemplates('  vItAmIn C  ')[0].id, 'vitamin-c-brightening-serum');
});

test('name prefix outranks keyword-only matches', () => {
  // 'argan' is the name prefix of Argan Hair Oil (score 4) and only a
  // keyword of Cold-Pressed Argan Carrier Oil (score 3)
  const results = searchProductTemplates('argan');
  assert.ok(results.indexOf(PRODUCT_TEMPLATES.find((t) => t.id === 'argan-hair-oil')!) <
            results.indexOf(PRODUCT_TEMPLATES.find((t) => t.id === 'cold-pressed-argan-carrier-oil')!));
});

test('empty query returns the curated popular list, limit respected', () => {
  const popular = searchProductTemplates('');
  assert.equal(popular.length, 8);
  assert.equal(popular[0].id, 'vitamin-c-brightening-serum');
  const limited = searchProductTemplates('', 3);
  assert.equal(limited.length, 3);
});

test('gibberish query returns no suggestions', () => {
  assert.deepEqual(searchProductTemplates('zzzzqqq'), []);
});

/* ------------------------------------------------------------------ */
/* 3. Match highlighting                                               */
/* ------------------------------------------------------------------ */

test('highlight range covers the query occurrence', () => {
  const name = 'Vitamin C Brightening Serum';
  const q = 'bright';
  const ranges = getMatchRanges(name, q);
  assert.equal(ranges.length, 1);
  const [start, end] = ranges[0];
  assert.equal(name.slice(start, end).toLowerCase(), q);
});

test('highlight finds every occurrence', () => {
  const ranges = getMatchRanges('Shea Butter Body Butter', 'butter');
  assert.equal(ranges.length, 2);
  for (const [start, end] of ranges) {
    assert.equal('Shea Butter Body Butter'.slice(start, end).toLowerCase(), 'butter');
  }
});

test('empty or whitespace query produces no highlight ranges', () => {
  assert.deepEqual(getMatchRanges('Matte Lipstick', ''), []);
  assert.deepEqual(getMatchRanges('Matte Lipstick', '   '), []);
});

/* ------------------------------------------------------------------ */
/* 4. Keyboard navigation (pure reducer)                               */
/* ------------------------------------------------------------------ */

test('ArrowDown moves down and wraps around', () => {
  assert.equal(nextActiveIndex('ArrowDown', 0, 5), 1);
  assert.equal(nextActiveIndex('ArrowDown', 4, 5), 0, 'must wrap to first');
});

test('ArrowUp moves up and wraps around', () => {
  assert.equal(nextActiveIndex('ArrowUp', 2, 5), 1);
  assert.equal(nextActiveIndex('ArrowUp', 0, 5), 4, 'must wrap to last');
});

test('Home/End jump to first/last option', () => {
  assert.equal(nextActiveIndex('Home', 3, 5), 0);
  assert.equal(nextActiveIndex('End', 0, 5), 4);
});

test('other keys and empty lists are safe no-ops', () => {
  assert.equal(nextActiveIndex('a', 2, 5), 2);
  assert.equal(nextActiveIndex('Enter', 2, 5), 2);
  assert.equal(nextActiveIndex('ArrowDown', 0, 0), -1);
});

/* ------------------------------------------------------------------ */
/* 5. Selection auto-populates the taxonomy                            */
/* ------------------------------------------------------------------ */

test('selecting Matte Lipstick selects Color Cosmetics + Lip Products', () => {
  const template = byId('matte-lipstick');
  const state = createInitialTaxonomyState(template.category, template.subcategories);
  assert.equal(state.primaryCategory, 'Color Cosmetics / Makeup');
  assert.deepEqual(state.selectedSubcategories, ['Lip Products (Lipsticks, Glosses, Liners)']);
  assert.equal(state.subcategory, 'Lip Products (Lipsticks, Glosses, Liners)');
});

test('selecting Argan Hair Oil selects Haircare & Styling + Hair Oils', () => {
  const template = byId('argan-hair-oil');
  const state = createInitialTaxonomyState(template.category, template.subcategories);
  assert.equal(state.primaryCategory, 'Haircare & Styling');
  assert.deepEqual(state.selectedSubcategories, ['Hair Oils & Serums']);
});

test('selecting Hydrating Face Wash selects Skincare + Cleansers', () => {
  const template = byId('hydrating-face-wash');
  const state = createInitialTaxonomyState(template.category, template.subcategories);
  assert.equal(state.primaryCategory, 'Skincare');
  assert.deepEqual(state.selectedSubcategories, ['Cleansers & Toners']);
});

test('multi-subcategory templates select all their pills', () => {
  const template = byId('airless-pump-bottle');
  const state = createInitialTaxonomyState(template.category, template.subcategories);
  assert.equal(state.primaryCategory, 'Packaging & Containers');
  assert.deepEqual(state.selectedSubcategories, [
    'Bottles (Glass, PET, HDPE)',
    'Pumps, Sprayers & Caps'
  ]);
});

/* ------------------------------------------------------------------ */
/* 6. Component render smoke tests                                     */
/* ------------------------------------------------------------------ */

function renderCombobox(props: Partial<Parameters<typeof SearchableProductCombobox>[0]> = {}) {
  return renderToStaticMarkup(
    React.createElement(SearchableProductCombobox, {
      value: '',
      onChange: () => {},
      onSelectTemplate: () => {},
      ...props
    })
  );
}

test('input renders as an ARIA combobox with a listbox', () => {
  const html = renderCombobox({ initiallyOpen: true, value: 'serum' });
  assert.ok(html.includes('data-testid="product-combobox-input"'));
  assert.ok(html.includes('role="combobox"'));
  assert.ok(html.includes('aria-expanded="true"'));
  assert.ok(html.includes('data-testid="product-combobox-listbox"'));
  assert.ok(html.includes('role="listbox"'));
});

test('dropdown shows filtered suggestions with highlighted matching text', () => {
  const html = renderCombobox({ initiallyOpen: true, value: 'vitamin' });
  assert.ok(html.includes('>Vitamin</mark>'), 'matched text must be wrapped in <mark>');
  // name is split by the <mark> tag: “<mark>Vitamin</mark> C Brightening Serum”
  assert.ok(html.includes('C Brightening Serum'));
  assert.ok(html.includes('data-testid="product-option"'));
  // options expose the category › subcategory caption
  assert.ok(html.includes('Skincare › Serums &amp; Treatments'));
});

test('clear button renders only when text is present', () => {
  const withText = renderCombobox({ value: 'Argan' });
  assert.ok(withText.includes('data-testid="product-combobox-clear"'));
  assert.ok(withText.includes('aria-label="Clear search text"'));
  const empty = renderCombobox({ value: '' });
  assert.ok(!empty.includes('data-testid="product-combobox-clear"'));
});

test('empty query shows the popular products list', () => {
  const html = renderCombobox({ initiallyOpen: true, value: '' });
  assert.ok(html.includes('Popular products'));
  const optionCount = html.split('data-testid="product-option"').length - 1;
  assert.equal(optionCount, 8);
});

test('no-match state keeps free text valid and offers guidance', () => {
  const html = renderCombobox({ initiallyOpen: true, value: 'zzzzq' });
  assert.ok(html.includes('data-testid="product-combobox-no-match"'));
  assert.ok(html.includes('No template match'));
  assert.ok(html.includes('No match for'));
});

test('options carry aria-selected for keyboard-focus tracking', () => {
  const html = renderCombobox({ initiallyOpen: true, value: 'serum' });
  assert.ok(html.includes('aria-selected="true"'));
  assert.ok(html.includes('aria-selected="false"'));
});
