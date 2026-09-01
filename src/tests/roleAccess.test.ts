/**
 * Role-based access control policy tests.
 * Run with: npm test
 *
 * These lock down the security boundary between buyers and suppliers. Every
 * guard in the app (click interception, render gating, nav filtering) reads
 * from this one policy, so these assertions cover all three layers.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SCREEN_ACCESS,
  evaluateAccess,
  canAccess,
  toViewer,
  navItemsFor,
  workspaceNavFor,
  canPostRequirement,
  accountScreenFor,
  getAccessLevel,
  HOME_SCREEN,
  type ScreenId,
  type Viewer,
} from '../lib/roleAccess';

const BUYER_SCREENS: ScreenId[] = [
  'buyer-dashboard', 'buyer-profile', 'rfq-tracking',
  'sample-request', 'post-rfq', 'buyer-enquiry-log', 'buyer-onboarding',
];
const SUPPLIER_SCREENS: ScreenId[] = ['supplier-portal', 'supplier-verification', 'onboarding'];
const PUBLIC_SCREENS: ScreenId[] = [
  'explore', 'directory', 'supplier-directory', 'plp',
  'product-detail', 'search-results', 'brands', 'oem-hub', 'supplier-profile',
];

// ---------------------------------------------------------------------------
// Viewer derivation
// ---------------------------------------------------------------------------
test('toViewer maps auth state onto an access identity', () => {
  assert.equal(toViewer(true, 'buyer'), 'buyer');
  assert.equal(toViewer(true, 'supplier'), 'supplier');
  assert.equal(toViewer(false, 'buyer'), 'guest', 'a role without a session is still a guest');
  assert.equal(toViewer(true, null), 'guest', 'a session without a role is not privileged');
  assert.equal(toViewer(false, null), 'guest');
});

// ---------------------------------------------------------------------------
// The core boundary: buyers out of supplier screens, suppliers out of buyer ones
// ---------------------------------------------------------------------------
test('buyers are denied every supplier screen and sent to their dashboard', () => {
  for (const screen of SUPPLIER_SCREENS) {
    const d = evaluateAccess(screen, 'buyer');
    assert.equal(d.allowed, false, `${screen} must be closed to buyers`);
    assert.equal(d.reason, 'wrong-role');
    assert.equal(d.redirectTo, 'buyer-dashboard');
  }
});

test('suppliers are denied every buyer screen and sent to their portal', () => {
  for (const screen of BUYER_SCREENS) {
    const d = evaluateAccess(screen, 'supplier');
    assert.equal(d.allowed, false, `${screen} must be closed to suppliers`);
    assert.equal(d.reason, 'wrong-role');
    assert.equal(d.redirectTo, 'supplier-portal');
  }
});

test('suppliers are confined to their portal and cannot browse the marketplace', () => {
  for (const screen of PUBLIC_SCREENS) {
    const d = evaluateAccess(screen, 'supplier');
    assert.equal(d.allowed, false, `${screen} is a buyer-facing view`);
    assert.equal(d.redirectTo, 'supplier-portal');
  }
});

test('buyers keep full access to their own workspace and the marketplace', () => {
  for (const screen of [...BUYER_SCREENS, ...PUBLIC_SCREENS]) {
    assert.equal(canAccess(screen, 'buyer'), true, `${screen} must stay open to buyers`);
  }
});

test('suppliers keep full access to their own workspace', () => {
  for (const screen of SUPPLIER_SCREENS) {
    assert.equal(canAccess(screen, 'supplier'), true, `${screen} must stay open to suppliers`);
  }
});

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------
test('guests browse public screens but are blocked from every protected one', () => {
  for (const screen of PUBLIC_SCREENS) {
    assert.equal(canAccess(screen, 'guest'), true, `${screen} should be public`);
  }
  for (const screen of [...BUYER_SCREENS, ...SUPPLIER_SCREENS]) {
    const d = evaluateAccess(screen, 'guest');
    assert.equal(d.allowed, false, `${screen} must require a session`);
    assert.equal(d.reason, 'unauthenticated', 'guests get a sign-in prompt, not a role error');
  }
});

// ---------------------------------------------------------------------------
// Redirect targets must themselves be reachable, or the guard would loop.
// ---------------------------------------------------------------------------
test('every denial redirects somewhere the viewer can actually go', () => {
  const viewers: Viewer[] = ['buyer', 'supplier', 'guest'];
  const screens = Object.keys(SCREEN_ACCESS) as ScreenId[];
  for (const viewer of viewers) {
    for (const screen of screens) {
      const d = evaluateAccess(screen, viewer);
      if (d.allowed) continue;
      if (d.reason === 'unauthenticated') continue; // resolved by the auth modal
      assert.ok(d.redirectTo, `${viewer} denied ${screen} with no redirect target`);
      assert.equal(
        canAccess(d.redirectTo!, viewer), true,
        `${viewer} would be redirected from ${screen} to unreachable ${d.redirectTo}`,
      );
    }
  }
});

test('each role home screen is reachable by that role', () => {
  assert.equal(canAccess(HOME_SCREEN.buyer, 'buyer'), true);
  assert.equal(canAccess(HOME_SCREEN.supplier, 'supplier'), true);
  assert.equal(canAccess(HOME_SCREEN.guest, 'guest'), true);
});

test('denials always carry a user-facing message', () => {
  const viewers: Viewer[] = ['buyer', 'supplier', 'guest'];
  for (const viewer of viewers) {
    for (const screen of Object.keys(SCREEN_ACCESS) as ScreenId[]) {
      const d = evaluateAccess(screen, viewer);
      if (d.allowed) continue;
      assert.ok(d.message && d.message.length > 10, `${viewer}/${screen} needs an explanation`);
    }
  }
});

// ---------------------------------------------------------------------------
// Navigation filtering must never advertise a blocked destination.
// ---------------------------------------------------------------------------
test('navigation never offers a link the guard would reject', () => {
  const viewers: Viewer[] = ['buyer', 'supplier', 'guest'];
  for (const viewer of viewers) {
    for (const item of [...navItemsFor(viewer), ...workspaceNavFor(viewer)]) {
      assert.equal(
        canAccess(item.screen, viewer), true,
        `${viewer} nav offers "${item.label}" -> ${item.screen}, which is blocked`,
      );
    }
  }
});

test('supplier navigation contains no marketplace entries', () => {
  const labels = navItemsFor('supplier').map((i) => i.label.toLowerCase());
  assert.ok(labels.length > 0, 'suppliers still need admin navigation');
  for (const forbidden of ['explore', 'products', 'brand directory', 'oem / private label']) {
    assert.equal(labels.includes(forbidden), false, `supplier nav must not show "${forbidden}"`);
  }
});

test('buyer navigation contains no supplier admin entries', () => {
  const screens = navItemsFor('buyer').map((i) => i.screen);
  for (const s of SUPPLIER_SCREENS) {
    assert.equal(screens.includes(s), false, `buyer nav must not link to ${s}`);
  }
});

test('guests get no workspace links at all', () => {
  assert.deepEqual(workspaceNavFor('guest'), []);
  assert.deepEqual(workspaceNavFor('supplier'), []);
  assert.ok(workspaceNavFor('buyer').length > 0);
});

test('only non-suppliers see the Post Requirement call to action', () => {
  assert.equal(canPostRequirement('buyer'), true);
  assert.equal(canPostRequirement('guest'), true);
  assert.equal(canPostRequirement('supplier'), false);
});

test('the account button targets each role own workspace', () => {
  assert.equal(accountScreenFor('buyer'), 'buyer-dashboard');
  assert.equal(accountScreenFor('supplier'), 'supplier-portal');
  assert.equal(accountScreenFor('guest'), 'explore');
});

// ---------------------------------------------------------------------------
// Robustness
// ---------------------------------------------------------------------------
test('an unknown screen id is treated as public, not as a lockout', () => {
  // A typo in a screen id is a routing bug; it must not strand the user.
  assert.equal(getAccessLevel('totally-made-up'), 'public');
  assert.equal(canAccess('totally-made-up', 'buyer'), true);
  assert.equal(canAccess('totally-made-up', 'guest'), true);
});

test('every declared screen has an explicit access level', () => {
  for (const [screen, level] of Object.entries(SCREEN_ACCESS)) {
    assert.ok(
      ['public', 'buyer', 'supplier'].includes(level),
      `${screen} has an invalid access level: ${level}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Session persistence across a page refresh.
// The app boots with currentScreen = 'explore' and rehydrates the role from
// localStorage, so the guard must place each role correctly on first paint.
// ---------------------------------------------------------------------------

/** Mirrors App.tsx's localStorage rehydration. */
function restoreViewer(stored: Record<string, string>): Viewer {
  const loggedIn = stored['nexora_is_logged_in'] === 'true';
  const role = stored['nexora_user_role'];
  return toViewer(loggedIn, role === 'buyer' || role === 'supplier' ? role : null);
}

test('a refreshed supplier session is restored and lands in the portal', () => {
  const viewer = restoreViewer({ nexora_is_logged_in: 'true', nexora_user_role: 'supplier' });
  assert.equal(viewer, 'supplier');
  // The app always boots on 'explore', which suppliers may not see...
  assert.equal(canAccess('explore', viewer), false);
  // ...so the guard must move them to their own workspace, not sign them out.
  assert.equal(evaluateAccess('explore', viewer).redirectTo, 'supplier-portal');
});

test('a refreshed buyer session is restored and keeps the marketplace', () => {
  const viewer = restoreViewer({ nexora_is_logged_in: 'true', nexora_user_role: 'buyer' });
  assert.equal(viewer, 'buyer');
  assert.equal(canAccess('explore', viewer), true);
  assert.equal(canAccess('buyer-dashboard', viewer), true);
  assert.equal(canAccess('supplier-portal', viewer), false);
});

test('a corrupted or cleared role does not grant privileged access', () => {
  assert.equal(restoreViewer({ nexora_is_logged_in: 'true', nexora_user_role: 'admin' }), 'guest');
  assert.equal(restoreViewer({ nexora_is_logged_in: 'true' }), 'guest');
  assert.equal(restoreViewer({}), 'guest');
  // A stale role left behind after sign-out must not resurrect the session.
  assert.equal(restoreViewer({ nexora_is_logged_in: 'false', nexora_user_role: 'supplier' }), 'guest');
});

test('signing out drops a supplier back to public browsing', () => {
  assert.equal(canAccess('supplier-portal', 'guest'), false);
  assert.equal(canAccess('explore', 'guest'), true);
});
