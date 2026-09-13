import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATALOG_PRODUCTS } from '../data/catalogProducts';

test('Mumbai Salon Equipment with MOQ 100-500 and price up to 1200 is never empty', () => {
  const matches = CATALOG_PRODUCTS.filter((product) =>
    product.category.toLowerCase().includes('salon equipment') &&
    product.supplierLocation.toLowerCase().includes('mumbai') &&
    product.moqNumber <= 500 &&
    product.priceMin <= 1200
  );

  assert.ok(matches.length >= 3, `expected at least 3 matching mock products, received ${matches.length}`);
  assert.ok(matches.every((product) => product.id.startsWith('product_')));
});
