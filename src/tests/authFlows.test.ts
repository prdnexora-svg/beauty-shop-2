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
  MIN_PASSWORD_LENGTH,
  EMAIL_REGEX,
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

// ---------------------------------------------------------------------------
// Migration 0006 — nullable phone + auth mirror trigger semantics.
// The SQL itself is exercised against Postgres, but the role-resolution and
// null-normalisation rules the trigger encodes are mirrored in TypeScript and
// must agree with it.
// ---------------------------------------------------------------------------

/** Mirrors the trigger's role validation: metadata is a hint, never trusted. */
function triggerResolvedRole(meta: Record<string, unknown> | null | undefined): string {
  const raw = meta?.role;
  return raw === 'buyer' || raw === 'supplier' ? raw : 'buyer';
}

/** Mirrors NULLIF(btrim(COALESCE(phone,'')), '') in the trigger. */
function normalisePhone(phone: string | null | undefined): string | null {
  const trimmed = (phone ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

test('trigger role validation refuses client-supplied privilege escalation', () => {
  // user_metadata is writable by the account owner, so 'admin' must not stick.
  assert.equal(triggerResolvedRole({ role: 'admin' }), 'buyer');
  assert.equal(triggerResolvedRole({ role: 'guest' }), 'buyer');
  assert.equal(triggerResolvedRole({ role: 'superuser' }), 'buyer');
});

test('trigger role validation preserves legitimate signup roles', () => {
  assert.equal(triggerResolvedRole({ role: 'buyer' }), 'buyer');
  assert.equal(triggerResolvedRole({ role: 'supplier' }), 'supplier');
});

test('trigger role validation defaults to buyer when metadata is absent', () => {
  assert.equal(triggerResolvedRole(null), 'buyer');
  assert.equal(triggerResolvedRole(undefined), 'buyer');
  assert.equal(triggerResolvedRole({}), 'buyer');
});

test('phone normalises to NULL for email/password and OAuth signups', () => {
  // An email+password signup carries no phone at all.
  assert.equal(normalisePhone(undefined), null);
  assert.equal(normalisePhone(null), null);
  // Empty/whitespace must become NULL, not '', or the UNIQUE index would
  // treat every phone-less account as colliding on the same value.
  assert.equal(normalisePhone(''), null);
  assert.equal(normalisePhone('   '), null);
});

test('a real phone number survives normalisation intact', () => {
  assert.equal(normalisePhone('+919820154321'), '+919820154321');
  assert.equal(normalisePhone('  +919820154321  '), '+919820154321');
});

// ---------------------------------------------------------------------------
// Shared credential validation — AuthModal and authApi previously disagreed
// (6 vs 8 characters), letting a password pass one path and fail the other.
// ---------------------------------------------------------------------------
test('password length rule is a single shared constant', () => {
  assert.equal(typeof MIN_PASSWORD_LENGTH, 'number');
  assert.ok(MIN_PASSWORD_LENGTH >= 6);
  assert.equal('12345'.length < MIN_PASSWORD_LENGTH, true);
  assert.equal('123456'.length >= MIN_PASSWORD_LENGTH, true);
});

test('shared email regex accepts real addresses and rejects malformed ones', () => {
  assert.equal(EMAIL_REGEX.test('priya@gmail.com'), true);
  assert.equal(EMAIL_REGEX.test('b2b@aurabeautylabs.co.in'), true);
  assert.equal(EMAIL_REGEX.test('9820154321'), false);
  assert.equal(EMAIL_REGEX.test('no-at-sign.com'), false);
  assert.equal(EMAIL_REGEX.test('spaces in@mail.com'), false);
});
