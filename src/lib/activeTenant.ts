/**
 * Multi-tenant session helper for supplier-facing views.
 *
 * In production this is resolved from the authenticated supplier session and
 * RLS would scope every query. In the local/demo build the selected supplier
 * is persisted under a clearly namespaced storage key so switching between
 * demo tenants is explicit and testable.
 */

const ACTIVE_SUPPLIER_KEY = 'nexora_active_supplier_tenant_v1';

export const DEFAULT_SUPPLIER_ID = 'supp-aura-labs';

export function getActiveSupplierId(): string {
  if (typeof window === 'undefined') return DEFAULT_SUPPLIER_ID;
  try {
    const stored = window.localStorage.getItem(ACTIVE_SUPPLIER_KEY);
    return stored || DEFAULT_SUPPLIER_ID;
  } catch {
    return DEFAULT_SUPPLIER_ID;
  }
}

export function setActiveSupplierId(supplierId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_SUPPLIER_KEY, supplierId);
    window.dispatchEvent(new CustomEvent('nexora-active-tenant-change', { detail: { supplierId } }));
  } catch {
    // Storage unavailable — tenant remains in-memory for the session.
  }
}

export function clearActiveSupplierId(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_SUPPLIER_KEY);
  } catch {
    // ignore
  }
}
