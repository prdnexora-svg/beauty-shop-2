// ============================================================================
// NEXORA LUXE — ROUTING, PUBLIC SITE & AUTH-GUARD INTEGRATION TESTS
//
// The app has no router library — navigation is a `currentScreen` union plus a
// set of `currentScreen === 'x' && (...)` branches spread across the screen
// modules. That makes it easy for a route to be added to one place and quietly
// missed in another (no Suspense, no auth guard, no menu entry).
//
// These tests assert the invariants that keep that honest:
//   1. every ScreenId is reachable and handled exactly once
//   2. every lazily-loaded screen sits inside a Suspense boundary
//   3. every owner route is auth-guarded, and no public route is
//   4. the public landing and its sections render without throwing
//
// Run with: npm run test:routing
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { PUBLIC_SCREENS, OWNER_SCREENS } from '../src/components/screens/ScreenRouter';
import { PROTECTED_SCREENS } from '../src/components/screens/types';
import type { ScreenId } from '../src/components/screens/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` \x1b[2m${detail}\x1b[0m` : ''}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` \x1b[2m${detail}\x1b[0m` : ''}`);
  }
}

console.log('\n\x1b[1mRouting, public site & auth-guard integration\x1b[0m');

// ---------------------------------------------------------------------------
// The authoritative list of routes, read straight out of the ScreenId union.
// ---------------------------------------------------------------------------
const typesSrc = readFileSync(join(ROOT, 'src/components/screens/types.ts'), 'utf8');
const unionMatch = /export type ScreenId =([^;]+);/s.exec(typesSrc);
const SCREEN_IDS: ScreenId[] = unionMatch
  ? [...unionMatch[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1] as ScreenId)
  : [];

check('ScreenId union parsed', SCREEN_IDS.length > 0, `${SCREEN_IDS.length} routes`);

// ---------------------------------------------------------------------------
// 1. Every route is reachable, and handled in exactly one place.
// ---------------------------------------------------------------------------
const handled = new Set<ScreenId>(['explore', ...PUBLIC_SCREENS, ...OWNER_SCREENS]);
const unhandled = SCREEN_IDS.filter((id) => !handled.has(id));
check('every ScreenId is routed somewhere', unhandled.length === 0,
  unhandled.length ? `unreachable: ${unhandled.join(', ')}` : `${SCREEN_IDS.length} routes covered`);

const orphans = [...PUBLIC_SCREENS, ...OWNER_SCREENS].filter((id) => !SCREEN_IDS.includes(id));
check('no route list references a non-existent ScreenId', orphans.length === 0,
  orphans.length ? orphans.join(', ') : 'clean');

const overlap = PUBLIC_SCREENS.filter((id) => OWNER_SCREENS.includes(id));
check('public and owner route lists do not overlap', overlap.length === 0,
  overlap.length ? overlap.join(', ') : 'disjoint');

// ---------------------------------------------------------------------------
// 2. Every lazy screen sits behind a Suspense boundary.
// ---------------------------------------------------------------------------
const routerSrc = readFileSync(join(ROOT, 'src/components/screens/ScreenRouter.tsx'), 'utf8');
const suspenseCount = (routerSrc.match(/<Suspense/g) || []).length;
check('ScreenRouter declares a Suspense boundary per tree', suspenseCount >= 2,
  `${suspenseCount} boundaries (public + owner)`);

const publicSrc = readFileSync(join(ROOT, 'src/components/screens/PublicScreens.tsx'), 'utf8');
const ownerSrc = readFileSync(join(ROOT, 'src/components/screens/OwnerScreens.tsx'), 'utf8');

const staticScreenImports = [...publicSrc.matchAll(/^import \{ (\w+) \} from '\.\.\/\1';/gm)]
  .concat([...ownerSrc.matchAll(/^import \{ (\w+) \} from '\.\.\/\1';/gm)]);
check('no screen is statically imported (would defeat code splitting)',
  staticScreenImports.length === 0,
  staticScreenImports.length ? staticScreenImports.map((m) => m[1]).join(', ') : 'all lazy');

// A route may share a component (buyer-profile is a tab of BuyerDashboard), so
// the invariant is: every route has a render branch, and every component used
// by those branches is lazily imported.
for (const [label, ids, src] of [
  ['public', PUBLIC_SCREENS, publicSrc],
  ['owner', OWNER_SCREENS, ownerSrc],
] as const) {
  const missingBranch = ids.filter((id) => !src.includes(`currentScreen === '${id}'`));
  check(`every ${label} route has a render branch`, missingBranch.length === 0,
    missingBranch.length ? `missing: ${missingBranch.join(', ')}` : `${ids.length} routes`);
}

const publicLazy = (publicSrc.match(/lazyNamed\(/g) || []).length;
const ownerLazy = (ownerSrc.match(/lazyNamed\(/g) || []).length;
check('public screens are lazily imported', publicLazy > 0, `${publicLazy} components`);
check('owner screens are lazily imported', ownerLazy > 0, `${ownerLazy} components`);

// ---------------------------------------------------------------------------
// 3. Auth guard matches the owner routes exactly.
// ---------------------------------------------------------------------------
const guardNotCovering = OWNER_SCREENS.filter((id) => !PROTECTED_SCREENS.includes(id));
check('every owner route is auth-guarded', guardNotCovering.length === 0,
  guardNotCovering.length ? `unguarded: ${guardNotCovering.join(', ')}` : `${OWNER_SCREENS.length} guarded`);

const overGuarded = PROTECTED_SCREENS.filter((id) => !OWNER_SCREENS.includes(id));
check('guard does not protect routes the owner tree does not render', overGuarded.length === 0,
  overGuarded.length ? overGuarded.join(', ') : 'aligned');

const publicButGuarded = PUBLIC_SCREENS.filter((id) => PROTECTED_SCREENS.includes(id));
check('no public marketplace route is auth-guarded', publicButGuarded.length === 0,
  publicButGuarded.length ? publicButGuarded.join(', ') : 'public routes stay open');

// App.tsx must consume the shared list rather than a duplicated literal.
const appSrc = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8');
check('App.tsx uses the shared PROTECTED_SCREENS list',
  /PROTECTED_SCREENS\.includes\(currentScreen\)/.test(appSrc)
    && !/const protectedScreens = \[/.test(appSrc),
  'no duplicated guard list');

// ---------------------------------------------------------------------------
// 4. The public landing renders.
// ---------------------------------------------------------------------------
try {
  const { PublicLanding } = await import('../src/components/screens/PublicLanding');
  const ctx: any = {
    currentScreen: 'explore',
    isLoggedIn: false,
    userRole: null,
    buyerProfile: {},
    buyerDashboardTab: 'overview',
    searchParams: { query: '', category: 'All', location: 'All India', tab: 'products' },
    selectedProductId: 'product_vitc_101',
    selectedSupplierId: 'seller_aura_001',
    handleNavigate: () => {},
    handleOpenAuthModal: () => {},
    handleOpenEnquiry: () => {},
    handleOpenChat: () => {},
    handleOpenQuoteModal: () => {},
    handleOpenProductComparison: () => {},
    handleRemoveFromComparison: () => {},
    setIsEditProfileOpen: () => {},
    setSelectedProductId: () => {},
    handleSearchSubmit: () => {},
    handleViewProduct: () => {},
    handleViewSupplier: () => {},
    handleSponsoredEnquire: () => {},
    handleOpenAdManager: () => {},
    handleCallSupplier: () => {},
    handleWhatsAppSupplier: () => {},
    handleFacilityTour: () => {},
    handleSaveProfile: () => {},
    triggerToast: () => {},
  };

  const html = renderToString(React.createElement(PublicLanding, ctx));
  check('PublicLanding renders on the explore route', html.length > 500, `${html.length} bytes`);
  check('landing includes the hero', /hero|search/i.test(html));
  check('landing includes the sponsored surfaces', /sponsored|advertis/i.test(html));

  const offRoute = renderToString(React.createElement(PublicLanding, { ...ctx, currentScreen: 'plp' }));
  check('PublicLanding renders nothing off-route', offRoute.length < 200, `${offRoute.length} bytes`);
} catch (error: any) {
  check('PublicLanding renders on the explore route', false, error?.message);
}

// ---------------------------------------------------------------------------
// 5. ScreenRouter dispatches correctly.
// ---------------------------------------------------------------------------
try {
  const { ScreenRouter } = await import('../src/components/screens/ScreenRouter');
  const base: any = { currentScreen: 'explore' };
  // No lazy chunk should be requested for the explore route (handled by landing).
  const html = renderToString(React.createElement(ScreenRouter, { ctx: { ...base, currentScreen: 'explore' } }));
  check('ScreenRouter renders nothing for the explore route', html.length < 200, `${html.length} bytes`);
} catch (error: any) {
  check('ScreenRouter renders nothing for the explore route', false, error?.message);
}

console.log(`\n  passed: \x1b[32m${passed}\x1b[0m  failed: \x1b[31m${failed}\x1b[0m`);
if (failed > 0) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('\n\x1b[32mRouting & auth-guard integration verified.\x1b[0m');
