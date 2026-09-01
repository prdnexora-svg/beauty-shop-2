// ============================================================================
// NEXORA LUXE — SAVED PRODUCTS & SUPPLIERS PERSISTENT STORE
// Lightweight localStorage-backed store shared by search results, product
// cards and the buyer dashboard. Broadcasts a window event so every mounted
// component stays in sync without prop drilling.
// ============================================================================

const SAVED_SUPPLIERS_KEY = 'nexora_saved_suppliers_v1';
const SAVED_PRODUCTS_KEY = 'nexora_saved_products_v1';
export const SAVED_STORE_EVENT = 'nexora_saved_store_updated';

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode etc.) — fail silently, UI still works in-memory.
  }
  window.dispatchEvent(new CustomEvent(SAVED_STORE_EVENT, { detail: { key } }));
}

// ----------------------------------------------------------------------------
// Suppliers
// ----------------------------------------------------------------------------

export function getSavedSupplierIds(): string[] {
  return readIds(SAVED_SUPPLIERS_KEY);
}

export function isSupplierSaved(id: string): boolean {
  return getSavedSupplierIds().includes(id);
}

/** Returns the new saved state (true = now saved). */
export function toggleSavedSupplier(id: string): boolean {
  const ids = getSavedSupplierIds();
  const exists = ids.includes(id);
  const next = exists ? ids.filter((v) => v !== id) : [id, ...ids];
  writeIds(SAVED_SUPPLIERS_KEY, next);
  return !exists;
}

// ----------------------------------------------------------------------------
// Products
// ----------------------------------------------------------------------------

export function getSavedProductIds(): string[] {
  return readIds(SAVED_PRODUCTS_KEY);
}

export function isProductSaved(id: string): boolean {
  return getSavedProductIds().includes(id);
}

/** Returns the new saved state (true = now saved). */
export function toggleSavedProduct(id: string): boolean {
  const ids = getSavedProductIds();
  const exists = ids.includes(id);
  const next = exists ? ids.filter((v) => v !== id) : [id, ...ids];
  writeIds(SAVED_PRODUCTS_KEY, next);
  return !exists;
}

/** Subscribe to any saved-store change. Returns an unsubscribe function. */
export function subscribeSavedStore(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(SAVED_STORE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SAVED_STORE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
