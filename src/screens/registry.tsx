import { lazy, type ComponentType } from 'react';

import { PublicExploreScreen } from './public/PublicExploreScreen';
import type {
  OwnerScreenId,
  PublicScreenId,
  ScreenId,
  ScreenMetadata,
} from './types';

/**
 * CODE-SPLITTING REGISTRY
 *
 * The application is a single-page workspace: only one screen is mounted at a
 * time, so every non-initial screen is loaded through `React.lazy`. That keeps
 * the entry chunk down to the shell (header/footer/landing) and moves the heavy
 * owner workspace (BuyerDashboard, SupplierAdminPortal, PostRequirementScreen…)
 * into on-demand chunks.
 */

/** Dynamic import loaders, keyed by screen id (used for prefetching). */
const SCREEN_LOADERS = new Map<ScreenId, () => Promise<unknown>>();

/**
 * Typed `React.lazy` wrapper: keeps the source component's prop signature and
 * registers the loader so a chunk can be warmed before navigation.
 */
/**
 * The concrete component type lives behind the dynamic import, so the registry
 * exposes the lazy component with `any` props; each screen's own props are
 * still enforced at its definition site.
 */
function lazyScreen(
  id: ScreenId,
  factory: () => Promise<Record<string, unknown>>,
  exportName: string,
): ComponentType<any> {
  const load = () =>
    factory().then((mod) => {
      const component = mod[exportName];
      if (typeof component !== 'function' && typeof component !== 'object') {
        throw new Error(
          `[screens] "${exportName}" is not exported by the chunk for "${id}".`,
        );
      }
      return { default: component as ComponentType<any> };
    });

  SCREEN_LOADERS.set(id, load);
  // Cast to `ComponentType` so JSX accepts the screen's own props: React 19's
  // `LazyExoticComponent<any>` resolves its props to `{}`, which would reject
  // every prop at the router call sites.
  return lazy(load) as unknown as ComponentType<any>;
}

// ---------------------------------------------------------------------------
// Owner-side application views (spec screens 18-25)
// ---------------------------------------------------------------------------
const BuyerDashboardScreen = lazyScreen(
  'buyer-dashboard',
  () => import('./owner/BuyerDashboard'),
  'BuyerDashboard',
);

export const OWNER_SCREENS: Record<OwnerScreenId, ComponentType<any>> = {
  // 18 — Supplier onboarding / business listing
  onboarding: lazyScreen(
    'onboarding',
    () => import('./owner/SupplierOnboardingScreen'),
    'SupplierOnboardingScreen',
  ),
  // 19 — Supplier admin portal (pulls in ad manager + analytics dashboards)
  'supplier-portal': lazyScreen(
    'supplier-portal',
    () => import('./owner/SupplierAdminPortal'),
    'SupplierAdminPortal',
  ),
  // 20 — Supplier verification centre
  'supplier-verification': lazyScreen(
    'supplier-verification',
    () => import('./owner/SupplierVerificationScreen'),
    'SupplierVerificationScreen',
  ),
  // 21 — Buyer onboarding
  'buyer-onboarding': lazyScreen(
    'buyer-onboarding',
    () => import('./owner/BuyerOnboardingScreen'),
    'BuyerOnboardingScreen',
  ),
  // 22 — Buyer workspace (dashboard + public profile route)
  'buyer-dashboard': BuyerDashboardScreen,
  'buyer-profile': BuyerDashboardScreen,
  // 23 — RFQ tracking & quote comparison
  'rfq-tracking': lazyScreen(
    'rfq-tracking',
    () => import('./owner/BuyerRFQTrackingScreen'),
    'BuyerRFQTrackingScreen',
  ),
  // 24 — Buyer enquiry log
  'buyer-enquiry-log': lazyScreen(
    'buyer-enquiry-log',
    () => import('./owner/BuyerEnquiryLogScreen'),
    'BuyerEnquiryLogScreen',
  ),
  // 25 — Requirement capture (public RFQ form) + sample request
  'post-rfq': lazyScreen(
    'post-rfq',
    () => import('./owner/PostRequirementScreen'),
    'PostRequirementScreen',
  ),
  'sample-request': lazyScreen(
    'sample-request',
    () => import('./owner/SampleRequestScreen'),
    'SampleRequestScreen',
  ),
};

// ---------------------------------------------------------------------------
// Public website views
// ---------------------------------------------------------------------------
export const PUBLIC_SCREENS: Record<
  Exclude<PublicScreenId, 'explore'>,
  ComponentType<any>
> = {
  'search-results': lazyScreen(
    'search-results',
    () => import('./public/SearchFilterScreen'),
    'SearchFilterScreen',
  ),
  plp: lazyScreen(
    'plp',
    () => import('./public/ProductListingScreen'),
    'ProductListingScreen',
  ),
  'product-detail': lazyScreen(
    'product-detail',
    () => import('./public/ProductDetailPage'),
    'ProductDetailPage',
  ),
  directory: lazyScreen(
    'directory',
    () => import('./public/DirectoryHubScreen'),
    'DirectoryHubScreen',
  ),
  'supplier-directory': lazyScreen(
    'supplier-directory',
    () => import('./public/SupplierDirectoryScreen'),
    'SupplierDirectoryScreen',
  ),
  'supplier-profile': lazyScreen(
    'supplier-profile',
    () => import('./public/SellerProfileScreen'),
    'SellerProfileScreen',
  ),
  brands: lazyScreen(
    'brands',
    () => import('./public/BrandDirectoryDetailScreen'),
    'BrandDirectoryDetailScreen',
  ),
  'oem-hub': lazyScreen(
    'oem-hub',
    () => import('./public/OemPrivateLabelHubScreen'),
    'OemPrivateLabelHubScreen',
  ),
};

/**
 * The landing page is the default route, so it ships with the shell for an
 * instant first paint instead of being fetched on demand.
 */
export const EAGER_SCREENS: Record<'explore', ComponentType<any>> = {
  explore: PublicExploreScreen,
};

export const SCREEN_COMPONENTS: Record<ScreenId, ComponentType<any>> = {
  ...EAGER_SCREENS,
  ...PUBLIC_SCREENS,
  ...OWNER_SCREENS,
} as Record<ScreenId, ComponentType<any>>;

export const SCREEN_METADATA: Record<ScreenId, ScreenMetadata> = {
  explore: { id: 'explore', group: 'public', spec: '01', label: 'Homepage / Explore Hub', lazy: false },
  'search-results': { id: 'search-results', group: 'public', spec: '02', label: 'Global Search & Filter', lazy: true },
  plp: { id: 'plp', group: 'public', spec: '03', label: 'Product Listing Page', lazy: true },
  'product-detail': { id: 'product-detail', group: 'public', spec: '04', label: 'Product Detail Page', lazy: true },
  directory: { id: 'directory', group: 'public', spec: '06', label: 'Directory Hub', lazy: true },
  'supplier-directory': { id: 'supplier-directory', group: 'public', spec: '06b', label: 'Supplier Directory', lazy: true },
  'supplier-profile': { id: 'supplier-profile', group: 'public', spec: '07', label: 'Seller Profile', lazy: true },
  brands: { id: 'brands', group: 'public', spec: '08', label: 'Brand Directory', lazy: true },
  'oem-hub': { id: 'oem-hub', group: 'public', spec: '09', label: 'OEM / Private Label Hub', lazy: true },

  onboarding: { id: 'onboarding', group: 'owner', spec: '18', label: 'Supplier Onboarding', lazy: true },
  'supplier-portal': { id: 'supplier-portal', group: 'owner', spec: '19', label: 'Supplier Admin Portal', lazy: true },
  'supplier-verification': { id: 'supplier-verification', group: 'owner', spec: '20', label: 'Supplier Verification Center', lazy: true },
  'buyer-onboarding': { id: 'buyer-onboarding', group: 'owner', spec: '21', label: 'Buyer Onboarding', lazy: true },
  'buyer-dashboard': { id: 'buyer-dashboard', group: 'owner', spec: '22', label: 'Buyer Dashboard', lazy: true },
  'buyer-profile': { id: 'buyer-profile', group: 'owner', spec: '22b', label: 'Buyer Profile', lazy: true },
  'rfq-tracking': { id: 'rfq-tracking', group: 'owner', spec: '23', label: 'RFQ Tracking', lazy: true },
  'buyer-enquiry-log': { id: 'buyer-enquiry-log', group: 'owner', spec: '24', label: 'Buyer Enquiry Log', lazy: true },
  'post-rfq': { id: 'post-rfq', group: 'owner', spec: '25', label: 'Post Requirement', lazy: true },
  'sample-request': { id: 'sample-request', group: 'owner', spec: '25b', label: 'Sample Request', lazy: true },
};

export const PUBLIC_SCREEN_IDS = (
  Object.keys(SCREEN_METADATA) as ScreenId[]
).filter((id) => SCREEN_METADATA[id].group === 'public');

export const OWNER_SCREEN_IDS = (
  Object.keys(SCREEN_METADATA) as ScreenId[]
).filter((id) => SCREEN_METADATA[id].group === 'owner');

export function isOwnerScreen(screen: ScreenId): screen is OwnerScreenId {
  return SCREEN_METADATA[screen]?.group === 'owner';
}

export function isPublicScreen(screen: ScreenId): screen is PublicScreenId {
  return SCREEN_METADATA[screen]?.group === 'public';
}

/**
 * Warm a lazily-loaded screen's chunk before the user navigates to it (used on
 * hover/focus so route changes feel instant). No-op for eager screens.
 */
export function preloadScreen(screen: ScreenId): Promise<unknown> {
  const loader = SCREEN_LOADERS.get(screen);
  if (!loader) return Promise.resolve(undefined);
  return loader().catch(() => {
    // Prefetch failures are non-fatal: navigation still loads the chunk.
    return undefined;
  });
}
