/**
 * QA tests for the dynamic Supabase taxonomy service.
 *
 * Covers:
 *   - offline/demo fallback catalog (used pre-Supabase and after errors)
 *   - grouping flattened `categories` + `subcategories` rows
 *   - real-time search across BOTH categories and subcategories
 *   - subcategory lookup by selected category name
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createFallbackCatalog,
  buildTaxonomyCatalog,
  filterTaxonomyCatalog,
  findCategoryByName,
  getSubcategoryNamesForCategory,
  slugify,
  type TaxonomyCategoryNode,
  type TaxonomySubcategory
} from '../lib/taxonomyService';

test('slugify produces stable URL-safe slugs', () => {
  assert.equal(slugify('Color Cosmetics / Makeup'), 'color-cosmetics-makeup');
  assert.equal(slugify(' Haircare & Styling '), 'haircare-styling');
});

test('fallback catalog exposes the 7 categories and their subcategories', () => {
  const catalog = createFallbackCatalog();
  assert.equal(catalog.source, 'fallback');
  assert.equal(catalog.loaded, false);
  assert.equal(catalog.categories.length, 7);

  const skincare = findCategoryByName(catalog, 'Skincare');
  assert.ok(skincare);
  assert.ok(skincare!.subcategories.some((sub) => sub.name === 'Serums & Treatments'));
  assert.ok(skincare!.subcategories.some((sub) => sub.name === 'Sunscreen & Sun Care'));
});

test('buildTaxonomyCatalog groups flat rows by category id', () => {
  const categoryRows: TaxonomyCategoryNode[] = [
    {
      id: 'cat-skincare',
      name: 'Skincare',
      slug: 'skincare',
      icon_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
      subcategories: []
    },
    {
      id: 'cat-hair',
      name: 'Haircare & Styling',
      slug: 'haircare-styling',
      icon_url: null,
      created_at: '2026-01-01T00:00:01.000Z',
      subcategories: []
    }
  ];

  const subcategoryRows: TaxonomySubcategory[] = [
    {
      id: 'sub-1',
      category_id: 'cat-skincare',
      name: 'Serums & Treatments',
      slug: 'serums-treatments',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'sub-2',
      category_id: 'cat-hair',
      name: 'Hair Oils & Serums',
      slug: 'hair-oils-serums',
      created_at: '2026-01-01T00:00:01.000Z'
    }
  ];

  const catalog = buildTaxonomyCatalog(categoryRows, subcategoryRows);
  assert.equal(catalog.source, 'supabase');
  assert.equal(catalog.loaded, true);
  assert.deepEqual(
    catalog.categories.map((cat) => cat.subcategories.map((sub) => sub.name)),
    [['Serums & Treatments'], ['Hair Oils & Serums']]
  );
});

test('search filters categories by their name', () => {
  const catalog = createFallbackCatalog();
  const filtered = filterTaxonomyCatalog(catalog, 'Skincare');
  assert.deepEqual(filtered.categories.map((cat) => cat.name), ['Skincare']);
  // A category-name match keeps all of its subcategories visible.
  assert.equal(filtered.categories[0].subcategories.length, catalog.categories[0].subcategories.length);
});

test('search filters subcategories in real time', () => {
  const catalog = createFallbackCatalog();
  const filtered = filterTaxonomyCatalog(catalog, 'Lip');

  assert.ok(filtered.categories.length >= 1);
  const lipCategory = filtered.categories.find((cat) =>
    cat.subcategories.some((sub) => sub.name.toLowerCase().includes('lip'))
  );
  assert.ok(lipCategory, 'search should surface the category containing a lip subcategory');
  assert.ok(
    lipCategory!.subcategories.every((sub) => sub.name.toLowerCase().includes('lip')),
    'subcategory-only matches should only show matching pills'
  );
});

test('getSubcategoryNamesForCategory honors the active search query', () => {
  const catalog = createFallbackCatalog();
  assert.deepEqual(getSubcategoryNamesForCategory(catalog, 'Skincare', 'serum'), ['Serums & Treatments']);
  assert.ok(getSubcategoryNamesForCategory(catalog, 'Skincare').length > 1);
  assert.deepEqual(getSubcategoryNamesForCategory(catalog, 'Unknown', ''), []);
});
