/**
 * Tests for the persistent saved products & suppliers store.
 * Run with: npm test
 */
import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';

// ---------------------------------------------------------------------------
// Minimal browser environment shims (localStorage + window events) so the
// store module can run under node:test.
// ---------------------------------------------------------------------------
const storage = new Map<string, string>();

(globalThis as any).localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => { storage.set(k, String(v)); },
  removeItem: (k: string) => { storage.delete(k); },
  clear: () => { storage.clear(); },
};

const listeners = new Map<string, Set<(e: unknown) => void>>();
(globalThis as any).window = {
  addEventListener: (type: string, fn: (e: unknown) => void) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(fn);
  },
  removeEventListener: (type: string, fn: (e: unknown) => void) => {
    listeners.get(type)?.delete(fn);
  },
  dispatchEvent: (event: { type: string }) => {
    listeners.get(event.type)?.forEach((fn) => fn(event));
    return true;
  },
};
if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: unknown;
    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

const {
  getSavedProductIds,
  getSavedSupplierIds,
  isProductSaved,
  isSupplierSaved,
  toggleSavedProduct,
  toggleSavedSupplier,
  subscribeSavedStore,
} = await import('../data/savedStore');

beforeEach(() => {
  storage.clear();
});

test('products: toggle saves, second toggle removes', () => {
  assert.equal(isProductSaved('prod-1'), false);
  assert.equal(toggleSavedProduct('prod-1'), true);
  assert.equal(isProductSaved('prod-1'), true);
  assert.deepEqual(getSavedProductIds(), ['prod-1']);
  assert.equal(toggleSavedProduct('prod-1'), false);
  assert.equal(isProductSaved('prod-1'), false);
});

test('suppliers: newest saved supplier appears first', () => {
  toggleSavedSupplier('sup-1');
  toggleSavedSupplier('sup-2');
  assert.deepEqual(getSavedSupplierIds(), ['sup-2', 'sup-1']);
  assert.equal(isSupplierSaved('sup-1'), true);
  assert.equal(isSupplierSaved('sup-3'), false);
});

test('products and suppliers are stored independently', () => {
  toggleSavedProduct('id-shared');
  assert.equal(isProductSaved('id-shared'), true);
  assert.equal(isSupplierSaved('id-shared'), false);
});

test('persists across module reads via localStorage payload', () => {
  toggleSavedSupplier('sup-9');
  const raw = storage.get('nexora_saved_suppliers_v1');
  assert.ok(raw);
  assert.deepEqual(JSON.parse(raw!), ['sup-9']);
});

test('corrupt storage payload degrades to empty list, not a crash', () => {
  storage.set('nexora_saved_products_v1', '{not-json');
  assert.deepEqual(getSavedProductIds(), []);
  storage.set('nexora_saved_products_v1', JSON.stringify({ nope: true }));
  assert.deepEqual(getSavedProductIds(), []);
});

test('subscribers are notified on every toggle and can unsubscribe', () => {
  let calls = 0;
  const unsubscribe = subscribeSavedStore(() => { calls += 1; });
  toggleSavedProduct('p1');
  toggleSavedSupplier('s1');
  assert.equal(calls, 2);
  unsubscribe();
  toggleSavedProduct('p2');
  assert.equal(calls, 2);
});
