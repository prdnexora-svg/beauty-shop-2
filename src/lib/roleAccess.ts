// ============================================================================
// NEXORA LUXE — ROLE-BASED ACCESS CONTROL POLICY
// ----------------------------------------------------------------------------
// Single source of truth for "who may see which screen". Every guard in the
// app (navigation interception, render-time gating, nav-bar filtering) reads
// from this table, so access rules can never drift between the click path and
// the render path.
//
// This module is intentionally pure — no React, no Supabase, no DOM — so the
// entire policy is unit-testable in isolation.
// ============================================================================

export type AppRole = 'buyer' | 'supplier';

/** Viewer identity as far as access control is concerned. */
export type Viewer = AppRole | 'guest';

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

export type AccessLevel =
  /** Anyone, signed in or not. */
  | 'public'
  /** Signed-in buyers only. */
  | 'buyer'
  /** Signed-in suppliers only. */
  | 'supplier';

/**
 * The authoritative screen -> access level map.
 *
 * NOTE ON STRICTNESS: suppliers are confined to their portal and do NOT get
 * the public marketplace screens. That is a deliberate product decision
 * ("Suppliers can ONLY access the SupplierAdminPortal"). If suppliers should
 * later be able to browse the catalogue for competitive research, flip the
 * relevant rows here to 'public' — nothing else in the app needs to change.
 */
export const SCREEN_ACCESS: Record<ScreenId, AccessLevel> = {
  // --- Public marketplace (buyers + guests) ---------------------------------
  explore: 'public',
  directory: 'public',
  'supplier-directory': 'public',
  plp: 'public',
  'product-detail': 'public',
  'search-results': 'public',
  brands: 'public',
  'oem-hub': 'public',
  'supplier-profile': 'public',

  // --- Buyer workspace ------------------------------------------------------
  'buyer-dashboard': 'buyer',
  'buyer-profile': 'buyer',
  'rfq-tracking': 'buyer',
  'sample-request': 'buyer',
  'post-rfq': 'buyer',
  'buyer-enquiry-log': 'buyer',
  'buyer-onboarding': 'buyer',

  // --- Supplier workspace ---------------------------------------------------
  'supplier-portal': 'supplier',
  'supplier-verification': 'supplier',
  onboarding: 'supplier',
};

/** Where each role lands when it is bounced off a forbidden screen. */
export const HOME_SCREEN: Record<Viewer, ScreenId> = {
  buyer: 'buyer-dashboard',
  supplier: 'supplier-portal',
  guest: 'explore',
};

export function getAccessLevel(screen: string): AccessLevel {
  // Unknown screens are treated as public: an unrecognised id is a routing
  // bug, not a security boundary, and must not hard-lock the user out.
  return SCREEN_ACCESS[screen as ScreenId] ?? 'public';
}

/** Resolve the effective viewer from auth state. */
export function toViewer(isLoggedIn: boolean, role: AppRole | null | undefined): Viewer {
  if (!isLoggedIn || !role) return 'guest';
  return role;
}

export type DenialReason = 'unauthenticated' | 'wrong-role';

export interface AccessDecision {
  allowed: boolean;
  /** Only set when `allowed` is false. */
  reason?: DenialReason;
  /** Screen to send the viewer to when denied. */
  redirectTo?: ScreenId;
  /** Human-readable explanation, safe to surface in a toast or fallback UI. */
  message?: string;
}

const ALLOWED: AccessDecision = { allowed: true };

/**
 * The core decision function. Everything else is a thin wrapper.
 *
 * Suppliers hitting a buyer screen (and vice versa) are redirected to their
 * own workspace rather than to a dead end; guests hitting anything protected
 * are sent to sign in.
 */
export function evaluateAccess(screen: string, viewer: Viewer): AccessDecision {
  const level = getAccessLevel(screen);

  if (level === 'public') {
    // Suppliers are confined to their workspace: the public marketplace is a
    // buyer-facing surface and counts as a "consumer buyer view".
    if (viewer === 'supplier') {
      return {
        allowed: false,
        reason: 'wrong-role',
        redirectTo: 'supplier-portal',
        message: 'Supplier accounts work from the Supplier Admin Portal. Buyer marketplace browsing is not available on a supplier login.',
      };
    }
    return ALLOWED;
  }

  if (viewer === 'guest') {
    return {
      allowed: false,
      reason: 'unauthenticated',
      redirectTo: 'explore',
      message: 'Please sign in to access this workspace.',
    };
  }

  if (viewer === level) return ALLOWED;

  // Signed in, but with the other role.
  return viewer === 'buyer'
    ? {
        allowed: false,
        reason: 'wrong-role',
        redirectTo: 'buyer-dashboard',
        message: 'Access restricted: buyer accounts cannot open the Supplier Admin Portal.',
      }
    : {
        allowed: false,
        reason: 'wrong-role',
        redirectTo: 'supplier-portal',
        message: 'Access restricted: supplier accounts cannot open the Buyer workspace.',
      };
}

export function canAccess(screen: string, viewer: Viewer): boolean {
  return evaluateAccess(screen, viewer).allowed;
}

// ============================================================================
// NAVIGATION MODEL
// ============================================================================
// Nav items are declared once with the screen they lead to; visibility is
// derived from the same policy above rather than hand-maintained per component.
// A link can therefore never point somewhere the guard would reject.
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  screen: ScreenId;
}

/** Public / buyer marketplace navigation. */
export const BUYER_NAV: NavItem[] = [
  { id: 'explore', label: 'Explore', screen: 'explore' },
  { id: 'plp', label: 'Products', screen: 'plp' },
  { id: 'supplier-directory', label: 'Suppliers Directory', screen: 'supplier-directory' },
  { id: 'brands', label: 'Brand Directory', screen: 'brands' },
  { id: 'oem-hub', label: 'OEM / Private Label', screen: 'oem-hub' },
];

/** Buyer-only workspace links (shown once signed in as a buyer). */
export const BUYER_WORKSPACE_NAV: NavItem[] = [
  { id: 'buyer-dashboard', label: 'My Dashboard', screen: 'buyer-dashboard' },
  { id: 'rfq-tracking', label: 'RFQ Requests', screen: 'rfq-tracking' },
  { id: 'buyer-enquiry-log', label: 'Enquiries', screen: 'buyer-enquiry-log' },
  { id: 'buyer-profile', label: 'Buyer Profile', screen: 'buyer-profile' },
];

/** Supplier admin navigation. Portal tabs are deep links into the portal. */
export const SUPPLIER_NAV: NavItem[] = [
  { id: 'supplier-portal', label: 'Inventory Management', screen: 'supplier-portal' },
  { id: 'orders', label: 'Order Management', screen: 'supplier-portal' },
  { id: 'rfq-responses', label: 'RFQ Responses', screen: 'supplier-portal' },
  { id: 'analytics', label: 'Analytics', screen: 'supplier-portal' },
  { id: 'supplier-verification', label: 'Supplier Settings', screen: 'supplier-verification' },
];

/**
 * Primary navigation for a viewer, already filtered by the access policy.
 * Guests and buyers get the marketplace; suppliers get admin links only.
 */
export function navItemsFor(viewer: Viewer): NavItem[] {
  const base = viewer === 'supplier' ? SUPPLIER_NAV : BUYER_NAV;
  return base.filter((item) => canAccess(item.screen, viewer));
}

/** Workspace links appended for signed-in users. Empty for guests. */
export function workspaceNavFor(viewer: Viewer): NavItem[] {
  if (viewer === 'buyer') return BUYER_WORKSPACE_NAV.filter((i) => canAccess(i.screen, viewer));
  return [];
}

/**
 * Whether the "Post Requirement" / RFQ call-to-action should render.
 * Suppliers answer RFQs, they never raise them.
 */
export function canPostRequirement(viewer: Viewer): boolean {
  return viewer !== 'supplier';
}

/** The account/profile button target for a viewer. */
export function accountScreenFor(viewer: Viewer): ScreenId {
  return HOME_SCREEN[viewer];
}
