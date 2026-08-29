import type { BuyerProfileData } from '../components/EditProfileModal';

/**
 * Every workspace surface reachable from the application shell.
 *
 * The union is intentionally exhaustive: `ScreenRouter` is compiled with an
 * exhaustive switch so adding a screen here forces a render branch.
 */
export type ScreenId =
  // Public website screens (01-17)
  | 'explore'
  | 'search-results'
  | 'plp'
  | 'product-detail'
  | 'directory'
  | 'supplier-directory'
  | 'supplier-profile'
  | 'brands'
  | 'oem-hub'
  // Owner-side application screens (18-25)
  | 'onboarding'
  | 'supplier-portal'
  | 'supplier-verification'
  | 'buyer-onboarding'
  | 'buyer-dashboard'
  | 'buyer-profile'
  | 'rfq-tracking'
  | 'buyer-enquiry-log'
  | 'sample-request'
  | 'post-rfq';

/** Public marketing + discovery surfaces. */
export type PublicScreenId = Extract<
  ScreenId,
  | 'explore'
  | 'search-results'
  | 'plp'
  | 'product-detail'
  | 'directory'
  | 'supplier-directory'
  | 'supplier-profile'
  | 'brands'
  | 'oem-hub'
>;

/** Authenticated owner/buyer workspace surfaces (screens 18-25 of the spec). */
export type OwnerScreenId = Extract<
  ScreenId,
  | 'onboarding'
  | 'supplier-portal'
  | 'supplier-verification'
  | 'buyer-onboarding'
  | 'buyer-dashboard'
  | 'buyer-profile'
  | 'rfq-tracking'
  | 'buyer-enquiry-log'
  | 'sample-request'
  | 'post-rfq'
>;

export type ScreenGroup = 'public' | 'owner';

export type BuyerDashboardTab =
  | 'overview'
  | 'about'
  | 'rfqs'
  | 'saved'
  | 'social'
  | 'activity'
  | 'notifications';

export interface SearchParamsState {
  query: string;
  category: string;
  location: string;
  tab: 'products' | 'suppliers' | 'oem';
  supplierId?: string;
  supplierName?: string;
  productId?: string;
  [key: string]: unknown;
}

export interface ChatSupplierTarget {
  id: string;
  name: string;
  location: string;
  isVerified: boolean;
}

export interface ChatProductTarget {
  title: string;
  image: string;
  price?: string;
  moq?: string;
}

/**
 * The single contract the application shell (`App.tsx`) hands to whichever
 * screen is mounted. Keeping it in one object keeps `App.tsx` focused on state
 * (auth, routing guards, persistence) while `ScreenRouter` owns presentation
 * plumbing.
 */
export interface ScreenContextValue {
  screen: ScreenId;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  buyerProfile: BuyerProfileData;
  searchParams: SearchParamsState;
  selectedProductId: string;
  selectedSupplierId: string;
  buyerDashboardTab: BuyerDashboardTab;

  // Navigation
  navigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
  navigateToExplore: () => void;
  /** Run a global search and jump to the results screen. */
  onSearch: (params: { query: string; location: string }) => void;

  // Overlays
  openAuth: (mode: 'login' | 'register') => void;
  openEnquiry: (item: Record<string, unknown>) => void;
  openChat: (supplier?: ChatSupplierTarget, product?: ChatProductTarget) => void;
  openEditProfile: () => void;
  /** Landing-page "Get Quotes" shortcut: opens the RFQ form with a toast. */
  openQuickQuote: () => void;

  // Supplier contact actions
  callSupplier: (name: string) => void;
  whatsappSupplier: (name: string) => void;

  // Profile
  saveProfile: (profile: BuyerProfileData) => void;

  // Owner flow completion
  completeBuyerOnboarding: (data: Record<string, unknown>) => void;
  completeSupplierOnboarding: () => void;
  submitSampleRequest: (data: Record<string, unknown>) => void;

  // Feedback
  notify: (message: string) => void;
}

export interface ScreenMetadata {
  id: ScreenId;
  group: ScreenGroup;
  /** Product-spec screen number, e.g. `18` for the supplier onboarding flow. */
  spec: string;
  label: string;
  /**
   * Owner screens and secondary public screens are code-split behind
   * `React.lazy`. The landing page stays eager so first paint is never blocked
   * by a network round-trip.
   */
  lazy: boolean;
}
