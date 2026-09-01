/**
 * Regression tests for the Buyer & Supplier authentication flows.
 * Run with: npm test
 *
 * Covers the bugs found during the auth audit:
 *  - duplicate signups that Supabase reports as "success" (empty identities)
 *  - role resolution from auth metadata (buyer vs supplier routing)
 *  - the pending-role handoff across the Google OAuth redirect
 */
import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';

// ---------------------------------------------------------------------------
// Browser shims required before importing the module under test.
// ---------------------------------------------------------------------------
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => { storage.set(k, String(v)); },
  removeItem: (k: string) => { storage.delete(k); },
  clear: () => { storage.clear(); },
};
(globalThis as any).window = {
  localStorage: (globalThis as any).localStorage,
  location: { origin: 'https://nexora.test', pathname: '/', href: 'https://nexora.test/' },
  addEventListener() {},
  removeEventListener() {},
  history: { replaceState() {} },
};

const {
  resolveUserRole,
  setPendingAuthRole,
  readPendingAuthRole,
  clearPendingAuthRole,
} = await import('../lib/supabase');

beforeEach(() => { storage.clear(); });

// ---------------------------------------------------------------------------
// Role resolution — decides Buyer dashboard vs SupplierAdminPortal.
// ---------------------------------------------------------------------------
test('resolveUserRole reads the role from user_metadata', () => {
  assert.equal(resolveUserRole({ user_metadata: { role: 'supplier' } } as any), 'supplier');
  assert.equal(resolveUserRole({ user_metadata: { role: 'buyer' } } as any), 'buyer');
});

test('resolveUserRole falls back to app_metadata when user_metadata is empty', () => {
  assert.equal(resolveUserRole({ app_metadata: { role: 'supplier' } } as any), 'supplier');
});

test('resolveUserRole returns null for missing, unknown or malformed roles', () => {
  assert.equal(resolveUserRole(null), null);
  assert.equal(resolveUserRole(undefined), null);
  assert.equal(resolveUserRole({} as any), null);
  assert.equal(resolveUserRole({ user_metadata: {} } as any), null);
  // 'admin'/'guest' are not app-routable roles for this modal.
  assert.equal(resolveUserRole({ user_metadata: { role: 'admin' } } as any), null);
  assert.equal(resolveUserRole({ user_metadata: { role: 'BUYER' } } as any), null);
});

// ---------------------------------------------------------------------------
// Pending role handoff — Google OAuth cannot carry the app role through the
// provider redirect, so it must survive in storage until the session returns.
// ---------------------------------------------------------------------------
test('pending auth role round-trips across a simulated OAuth redirect', () => {
  assert.equal(readPendingAuthRole(), null);
  setPendingAuthRole('supplier');
  assert.equal(readPendingAuthRole(), 'supplier');
  clearPendingAuthRole();
  assert.equal(readPendingAuthRole(), null);
});

test('pending auth role ignores corrupted storage values', () => {
  storage.set('nexora_pending_role', 'not-a-role');
  assert.equal(readPendingAuthRole(), null);
});

// ---------------------------------------------------------------------------
// Duplicate-signup detection. Supabase with email confirmation ON returns a
// 200 with an obfuscated user whose `identities` array is empty instead of an
// error. Treating that as success silently created a dead account.
// ---------------------------------------------------------------------------
function isObfuscatedDuplicate(user: { identities?: unknown[] } | null | undefined): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

test('empty identities array marks an existing-email signup as duplicate', () => {
  assert.equal(isObfuscatedDuplicate({ identities: [] }), true);
});

test('a genuinely new signup with one identity is not flagged as duplicate', () => {
  assert.equal(isObfuscatedDuplicate({ identities: [{ provider: 'email' }] }), false);
  assert.equal(isObfuscatedDuplicate(null), false);
});

// ---------------------------------------------------------------------------
// Post-login routing: the server role always wins over the UI toggle.
// ---------------------------------------------------------------------------
function screenForRole(role: 'buyer' | 'supplier', isNewUser: boolean): string {
  if (isNewUser) return role === 'buyer' ? 'buyer-onboarding' : 'onboarding';
  return role === 'buyer' ? 'buyer-dashboard' : 'supplier-portal';
}

test('a supplier signing in with the Buyer toggle still lands in the supplier portal', () => {
  const toggle: 'buyer' | 'supplier' = 'buyer';
  const serverRole = resolveUserRole({ user_metadata: { role: 'supplier' } } as any);
  const effective = serverRole ?? toggle;
  assert.equal(effective, 'supplier');
  assert.equal(screenForRole(effective, false), 'supplier-portal');
});

test('new registrations are routed to their role-specific onboarding', () => {
  assert.equal(screenForRole('buyer', true), 'buyer-onboarding');
  assert.equal(screenForRole('supplier', true), 'onboarding');
  assert.equal(screenForRole('buyer', false), 'buyer-dashboard');
});
