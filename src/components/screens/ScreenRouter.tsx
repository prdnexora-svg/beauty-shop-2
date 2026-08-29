// ============================================================================
// NEXORA LUXE — SCREEN ROUTER
//
// Single place that decides which screen tree renders, and the single place
// that owns the Suspense boundaries for the lazily-loaded screens.
//
// Two boundaries on purpose:
//   • the public marketplace and the owner workspace are separate chunks, so a
//     slow owner-side download must never blank the public site;
//   • each gets its own fallback, so a visitor browsing the marketplace is
//     unaffected by the authenticated workspace loading behind the guard.
// ============================================================================

import React, { Suspense } from 'react';
import { PublicScreens } from './PublicScreens';
import { OwnerScreens } from './OwnerScreens';
import { ScreenLoader } from './ScreenLoader';
import type { AppScreenContext, ScreenId } from './types';

export const PUBLIC_SCREENS: readonly ScreenId[] = [
  'plp',
  'search-results',
  'product-detail',
  'directory',
  'supplier-directory',
  'supplier-profile',
  'brands',
  'oem-hub',
];

export const OWNER_SCREENS: readonly ScreenId[] = [
  'buyer-onboarding',
  'onboarding',
  'supplier-portal',
  'supplier-verification',
  'buyer-dashboard',
  'buyer-profile',
  'rfq-tracking',
  'sample-request',
  'post-rfq',
  'buyer-enquiry-log',
];

export interface ScreenRouterProps {
  ctx: AppScreenContext;
}

/**
 * Renders the screen tree for the active route. `PublicLanding` is intentionally
 * not handled here — it is eagerly imported by App so the homepage paints
 * immediately without waiting on a chunk.
 */
export const ScreenRouter: React.FC<ScreenRouterProps> = ({ ctx }) => {
  const showPublic = PUBLIC_SCREENS.includes(ctx.currentScreen);
  const showOwner = OWNER_SCREENS.includes(ctx.currentScreen);

  return (
    <>
      {showPublic && (
        <Suspense fallback={<ScreenLoader />}>
          <PublicScreens {...ctx} />
        </Suspense>
      )}
      {showOwner && (
        <Suspense fallback={<ScreenLoader />}>
          <OwnerScreens {...ctx} />
        </Suspense>
      )}
    </>
  );
};

export default ScreenRouter;
