// ============================================================================
// NEXORA LUXE — SCREEN CONTRACT
//
// App.tsx used to own the public landing page, all 18 screen branches and every
// piece of state in one 1,250-line component. The screens now live in their own
// modules and receive everything they need through this single context object.
//
// Field names deliberately match the handler names that already existed in
// App.tsx, so the extracted JSX could move across verbatim instead of being
// rewritten — which is what keeps this refactor behaviour-preserving.
// ============================================================================

import type { Dispatch, SetStateAction } from 'react';
import type { BuyerProfileData } from '../EditProfileModal';
import type { RFQItem, SearchProduct } from '../../types';

/** Every route the app can show. */
export type ScreenId =
  | 'explore'
  | 'directory'
  | 'supplier-directory'
  | 'plp'
  | 'product-detail'
  | 'search-results'
  | 'brands'
  | 'oem-hub'
  | 'supplier-profile'
  | 'onboarding'
  | 'buyer-onboarding'
  | 'supplier-portal'
  | 'supplier-verification'
  | 'buyer-dashboard'
  | 'buyer-profile'
  | 'rfq-tracking'
  | 'sample-request'
  | 'post-rfq'
  | 'buyer-enquiry-log';

/**
 * Routes that require an authenticated session. Previously this list was
 * duplicated inline in App.tsx, so adding a route meant remembering to update
 * the guard too. Now the router and the guard read the same array, and a test
 * asserts they stay in sync.
 */
export const PROTECTED_SCREENS: readonly ScreenId[] = [
  'buyer-dashboard',
  'buyer-profile',
  'rfq-tracking',
  'buyer-enquiry-log',
  'post-rfq',
  'sample-request',
  'buyer-onboarding',
  'supplier-portal',
  'supplier-verification',
  'onboarding',
];

export type BuyerDashboardTab =
  | 'overview'
  | 'about'
  | 'rfqs'
  | 'saved'
  | 'social'
  | 'activity'
  | 'notifications';

export interface SearchParams {
  query: string;
  category: string;
  location: string;
  tab: 'products' | 'suppliers' | 'oem';
}

export interface ChatSupplier {
  id: string;
  name: string;
  location: string;
  isVerified: boolean;
}

export interface ChatProduct {
  title: string;
  image: string;
  price?: string;
  moq?: string;
}

/**
 * Everything the extracted screens are allowed to touch.
 * Passing one object keeps the prop lists short and makes it obvious exactly
 * what the public site and the owner workspace depend on.
 */
export interface AppScreenContext {
  // ---- state -------------------------------------------------------------
  currentScreen: ScreenId;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  buyerProfile: BuyerProfileData;
  buyerDashboardTab: BuyerDashboardTab;
  searchParams: SearchParams;
  selectedProductId: string;
  selectedSupplierId: string;

  // ---- navigation & modals ----------------------------------------------
  handleNavigate: (screen: ScreenId | string, params?: any) => void;
  handleOpenAuthModal: (mode: 'login' | 'register') => void;
  handleOpenEnquiry: (item: any) => void;
  handleOpenChat: (supplier?: ChatSupplier, product?: ChatProduct) => void;
  handleOpenQuoteModal: (rfq?: RFQItem) => void;
  handleOpenProductComparison: (products: SearchProduct[]) => void;
  handleRemoveFromComparison: (id: string) => void;
  setIsEditProfileOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedProductId: Dispatch<SetStateAction<string>>;

  // ---- public-marketplace actions ---------------------------------------
  handleSearchSubmit: (params: any) => void;
  handleViewProduct: (productId: string, sellerId?: string) => void;
  handleViewSupplier: (sellerId: string) => void;
  handleSponsoredEnquire: (
    productId: string | undefined,
    sellerId: string,
    supplierName: string,
  ) => void;
  handleOpenAdManager: () => void;

  // ---- supplier contact --------------------------------------------------
  handleCallSupplier: (supplierName: string) => void;
  handleWhatsAppSupplier: (supplierName: string) => void;
  handleFacilityTour: (supplierName?: string) => void;

  // ---- owner workspace ---------------------------------------------------
  handleSaveProfile: (updated: BuyerProfileData) => void;
  triggerToast: (msg: string) => void;
}
