import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { Breadcrumbs } from './components/Breadcrumbs';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SiteFooter } from './components/shell/SiteFooter';
import { SiteHeader } from './components/shell/SiteHeader';
import { ToastBanner } from './components/shell/ToastBanner';
import { DatabaseInspectorFab } from './components/shell/DatabaseInspectorFab';
import { FullPageLoader } from './components/shell/LoadingStates';
import { ScreenRouter } from './screens/ScreenRouter';
import { SCREEN_METADATA } from './screens/registry';
import type {
  BuyerDashboardTab,
  ChatProductTarget,
  ChatSupplierTarget,
  ScreenContextValue,
  ScreenId,
  SearchParamsState,
} from './screens/types';
import type { BuyerProfileData } from './components/EditProfileModal';
import { getBuyerProfile } from './data/buyerProfilesData';
import {
  SupabaseProvider,
  useSupabase,
  AUTH_LOGIN_PATH,
  AUTH_CALLBACK_PATH,
  AUTH_CALLBACK_PREFIX,
  getAuthCallbackCode,
  hasAuthCallbackParams,
  isAuthPath,
  redirectToLogin,
  stripAuthCallbackParams,
} from './lib/supabase';
import { TRENDING_PRODUCTS, VERIFIED_SUPPLIERS } from './data/mockData';

// ---------------------------------------------------------------------------
// Overlays are code-split too: they are only mounted once a user interacts, so
// shipping them in the entry chunk is pure dead weight on first load.
// ---------------------------------------------------------------------------
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal })),
);
const EnquiryModal = lazy(() =>
  import('./components/EnquiryModal').then((m) => ({ default: m.EnquiryModal })),
);
const EditProfileModal = lazy(() =>
  import('./components/EditProfileModal').then((m) => ({ default: m.EditProfileModal })),
);
const ChatModalDrawer = lazy(() =>
  import('./components/ChatModalDrawer').then((m) => ({ default: m.ChatModalDrawer })),
);
const DatabaseStatusModal = lazy(() =>
  import('./components/DatabaseStatusModal').then((m) => ({
    default: m.DatabaseStatusModal,
  })),
);

const DEFAULT_BUYER_PROFILE_ID = 'buyer_priya_001';

/**
 * Seed fixture used only if the buyer directory has no entry for the default
 * profile. It predates the narrowed `BuyerProfileData` unions (e.g. it carries
 * a numeric `followersCount`), so it is adapted at the single boundary below
 * instead of weakening the shared type.
 */
const SEED_BUYER_PROFILE = {
  id: DEFAULT_BUYER_PROFILE_ID,
  fullName: 'Priya Sharma',
  businessName: 'Radiant Beauty Solutions',
  businessType: 'Salon / Spa Chain',
  designation: 'Head of Procurement',
  email: 'priya.procurement@radiantbeauty.in',
  phone: '+91 98201 54321',
  alternatePhone: '+91 22 2650 4321',
  avatarUrl:
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  coverPhotoUrl:
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
  gstin: '27AAACR1234F1Z5',
  pancard: 'AAACR1234F',
  address: 'Plot No. 42, Bandra-Kurla Complex',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400051',
  annualProcurementBudget: '₹25 Lakhs - ₹1 Crore',
  primaryCategories: ['Skincare & Serums', 'Haircare & Treatments'],
  preferredDeliveryTimeline: '3 - 7 Days',
  whatsappAlerts: true,
  emailAlerts: true,
  isGstVerified: true,
  isBusinessVerified: true,
  followersCount: 1481,
  partnerCardNumber: 'NXP 807A 45DF 9875',
  partnerTier: 'Gold',
  sourcingDistrict: 'Mumbai Metro Region, MH',
  responseSla: '99.8% SLA',
  joinedDate: 'January 2024',
} as const;

function createInitialBuyerProfile(): BuyerProfileData {
  const priyaDefault: BuyerProfileData =
    getBuyerProfile(DEFAULT_BUYER_PROFILE_ID) ||
    (SEED_BUYER_PROFILE as unknown as BuyerProfileData);

  const stored = localStorage.getItem('nexora_buyer_profile');
  if (stored) {
    try {
      return { ...priyaDefault, ...(JSON.parse(stored) as BuyerProfileData) };
    } catch (e) {
      // Corrupted payload — fall back to the seeded profile.
    }
  }
  return priyaDefault;
}

/** Screens that may only be opened by a signed-in supplier account. */
const SUPPLIER_ONLY_SCREENS: ScreenId[] = [
  'supplier-portal',
  'supplier-verification',
  'onboarding',
];

/** Screens that may only be opened by a signed-in buyer account. */
const BUYER_ONLY_SCREENS: ScreenId[] = [
  'buyer-dashboard',
  'buyer-profile',
  'rfq-tracking',
  'buyer-enquiry-log',
  'post-rfq',
  'sample-request',
  'buyer-onboarding',
];

export interface NexoraShopAppProps {
  /** Starting screen — defaults to the public landing page. */
  initialScreen?: ScreenId;
}

function NexoraShopApp({ initialScreen = 'explore' }: NexoraShopAppProps) {
  const {
    isConfigured,
    authReady,
    session,
    user,
    locationSyncStatus,
    signOut,
  } = useSupabase();

  const [currentScreen, setCurrentScreen] = useState<ScreenId>(initialScreen);
  const [selectedProductId, setSelectedProductId] = useState<string>('product_vitc_101');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('seller_aura_001');

  // Persistent Auth State (synced from the single Supabase auth session when a
  // real Supabase project is configured; local demo storage is only a fallback).
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (isConfigured) return false;
    return localStorage.getItem('nexora_is_logged_in') === 'true';
  });

  const [userRole, setUserRole] = useState<'buyer' | 'supplier' | null>(() => {
    if (isConfigured) return null;
    const stored = localStorage.getItem('nexora_user_role');
    return stored === 'buyer' || stored === 'supplier' ? stored : null;
  });

  // Persistent Buyer Profile State
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileData>(createInitialBuyerProfile);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [buyerDashboardTab, setBuyerDashboardTab] = useState<BuyerDashboardTab>('overview');

  // Search parameters
  const [searchParams, setSearchParams] = useState<SearchParamsState>({
    query: '',
    category: 'All',
    location: 'All India',
    tab: 'products',
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [targetEnquiryItem, setTargetEnquiryItem] = useState<any | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatInitialSupplier, setChatInitialSupplier] = useState<ChatSupplierTarget | undefined>(
    undefined,
  );
  const [chatInitialProduct, setChatInitialProduct] = useState<ChatProductTarget | undefined>(
    undefined,
  );
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Interactive toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const handleOpenChat = (
    supplier?: ChatSupplierTarget,
    product?: ChatProductTarget,
  ) => {
    setChatInitialSupplier(supplier);
    setChatInitialProduct(product);
    setChatModalOpen(true);
  };

  const handleSaveProfile = (updated: BuyerProfileData) => {
    setBuyerProfile(updated);
    localStorage.setItem('nexora_buyer_profile', JSON.stringify(updated));
    triggerToast('Profile & Business Details updated successfully!');
  };

  const handleLogout = async () => {
    localStorage.removeItem('nexora_user_session');
    localStorage.removeItem('nexora_guest_mode');
    localStorage.setItem('nexora_is_logged_in', 'false');
    localStorage.removeItem('nexora_user_role');
    setIsLoggedIn(false);
    setUserRole(null);
    setIsEditProfileOpen(false);
    await signOut({ redirectToLogin: false });
    setCurrentScreen('explore');
    triggerToast('You have signed out successfully.');
  };

  const handleLoginSuccess = (role: 'buyer' | 'supplier', isNewUser?: boolean) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem('nexora_is_logged_in', 'true');
    localStorage.setItem('nexora_user_role', role);
    setIsAuthModalOpen(false);

    if (isNewUser) {
      const target: ScreenId = role === 'buyer' ? 'buyer-onboarding' : 'onboarding';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome to Nexora Luxe! Let's set up your ${role} profile.`);
    } else {
      const target: ScreenId = role === 'buyer' ? 'buyer-dashboard' : 'supplier-portal';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome back! Logged in as ${role === 'buyer' ? 'Buyer' : 'Supplier'}.`);
    }
  };

  // -------------------------------------------------------------------------
  // Routing (with role guards)
  // -------------------------------------------------------------------------
  const handleNavigate = (screen: ScreenId, params?: Record<string, unknown>) => {
    if (isLoggedIn) {
      if (userRole === 'buyer' && SUPPLIER_ONLY_SCREENS.includes(screen)) {
        triggerToast('Access Restricted: Buyer accounts cannot access the Supplier Portal.');
        setCurrentScreen('buyer-dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (userRole === 'supplier' && BUYER_ONLY_SCREENS.includes(screen)) {
        triggerToast('Access Restricted: Supplier accounts cannot access the Buyer Workspace.');
        setCurrentScreen('supplier-portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else if ([...SUPPLIER_ONLY_SCREENS, ...BUYER_ONLY_SCREENS].includes(screen)) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      triggerToast('Please sign in to access dashboard workspace features.');
      return;
    }

    setCurrentScreen(screen);

    if ((screen === 'buyer-dashboard' || screen === 'buyer-profile') && params?.tab) {
      setBuyerDashboardTab(params.tab as BuyerDashboardTab);
    }

    if (params) {
      if (params.productId) {
        setSelectedProductId(params.productId as string);
      }
      if (params.supplierId) {
        setSelectedSupplierId(params.supplierId as string);
      }
      if (params.buyerId || (screen === 'buyer-profile' && (params.memberData || params.buyerId))) {
        const found = getBuyerProfile(
          (params.buyerId ||
            (params.memberData as any)?.profileId ||
            (params.memberData as any)?.id ||
            (params.memberData as any)?.name) as string,
        );
        if (found) {
          setBuyerProfile({ ...found });
        } else if (params.memberData) {
          const m = params.memberData as any;
          const cleanName = m.name.replace(/\s*\(.*?\)\s*/g, '').trim();
          const bizName = m.name.match(/\((.*?)\)/)?.[1] || `${cleanName} Enterprises`;
          setBuyerProfile((prev) => ({
            ...prev,
            fullName: cleanName,
            businessName: bizName,
            businessType: m.businessType || prev.businessType,
            avatarUrl: m.avatar,
            city: m.city || prev.city,
            state: m.state || prev.state,
            isGstVerified: m.isGstVerified,
            followersCount: m.followersCount || prev.followersCount,
          }));
        }
      }
      setSearchParams((prev) => ({ ...prev, ...params }));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenEnquiry = (item: any) => {
    setTargetEnquiryItem(item);
    setIsEnquiryModalOpen(true);
  };

  const handleCallSupplier = (supplierName: string) => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      triggerToast('Please login to view verified business contact details.');
      return;
    }

    const supplier = VERIFIED_SUPPLIERS.find((s) => s.name === supplierName);
    const phone = supplier?.phone || '+919820155443';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    window.location.href = `tel:${cleanPhone}`;
    triggerToast(`Opening native dialer to contact ${supplierName}`);
  };

  const handleWhatsAppSupplier = (supplierName: string) => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      triggerToast('Please login to contact suppliers via WhatsApp.');
      return;
    }

    const supplier = VERIFIED_SUPPLIERS.find((s) => s.name === supplierName);
    const whatsapp = supplier?.whatsapp || '919820155443';
    const nameToUse = supplierName || supplier?.name || 'Supplier';
    const message = encodeURIComponent(
      `Hello ${nameToUse}, I found your business on Nexora Luxe and I am interested in your products. Can we discuss a potential enquiry?`,
    );

    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
    triggerToast(`Opening direct WhatsApp channel with ${nameToUse}`);
  };

  const handleSearchSubmit = (params: {
    query?: string;
    category?: string;
    location?: string;
    scope?: SearchParamsState['tab'];
  }) => {
    // Keep the original sentinel handling: only the explicit "any" placeholders
    // collapse to defaults, everything else is passed through untouched.
    setSearchParams({
      query: params.query || '',
      category: params.category !== 'All Categories' ? params.category : 'All',
      location: params.location !== 'Any Location' ? params.location : 'All India',
      tab: params.scope || 'products',
    });
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------------------
  // Supabase session sync (production mode only)
  // -------------------------------------------------------------------------
  const supabaseRole = (user?.user_metadata?.role as 'buyer' | 'supplier') || null;
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAuthLoginPath = currentPathname === AUTH_LOGIN_PATH;
  // `/auth/*` covers the PKCE callback, but the explicit `/auth/login` route is
  // a terminal page, not a callback: treating it as one made the callback guard
  // below swallow the login screen (and left `redirectToLogin()` — which
  // self-guards on this path — with nothing to do), so an anonymous visitor saw
  // a permanent "Redirecting to secure sign-in…" spinner instead of the form.
  const isAuthCallbackPath =
    currentPathname === AUTH_CALLBACK_PATH ||
    (currentPathname.startsWith(AUTH_CALLBACK_PREFIX) && currentPathname !== AUTH_LOGIN_PATH);
  const isAuthRoute = isAuthPath(currentPathname);
  const authCallbackPresent = hasAuthCallbackParams();
  const authCallbackCode = getAuthCallbackCode();

  // Strip transient authorization parameters once the PKCE exchange resolves.
  useEffect(() => {
    if (authCallbackCode && session?.user) {
      stripAuthCallbackParams();
    }
  }, [authCallbackCode, session?.user]);

  // Keep the in-memory login flags in sync with the Supabase auth listener.
  useEffect(() => {
    if (!isConfigured) return;
    if (!authReady) return;
    if (session?.user) {
      const role = supabaseRole || 'buyer';
      setIsLoggedIn(true);
      setUserRole(role);
      localStorage.setItem('nexora_is_logged_in', 'true');
      if (role) localStorage.setItem('nexora_user_role', role);
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      localStorage.setItem('nexora_is_logged_in', 'false');
      localStorage.removeItem('nexora_user_role');
    }
  }, [isConfigured, authReady, session?.user?.id, supabaseRole]);

  // Demo / local mode fallback keeps the offline preview working.
  useEffect(() => {
    if (isConfigured) return;
    const stored = localStorage.getItem('nexora_is_logged_in');
    const storedRole = localStorage.getItem('nexora_user_role');
    setIsLoggedIn(stored === 'true');
    setUserRole(storedRole === 'buyer' || storedRole === 'supplier' ? storedRole : null);
  }, [isConfigured]);

  // Normalize /auth/* URLs back to the app root once a session exists.
  useEffect(() => {
    if (!session?.user || !isAuthRoute) return;
    window.history.replaceState({}, '', '/');
    setCurrentScreen('explore');
    stripAuthCallbackParams();
  }, [session?.user?.id, isAuthRoute]);

  const isProtectedScreen = SCREEN_METADATA[currentScreen]?.group === 'owner';

  // A missing session on an owner screen always enters the explicit login route.
  useEffect(() => {
    if (!isConfigured || !authReady || session?.user || !isProtectedScreen) return;
    redirectToLogin();
  }, [isConfigured, authReady, session?.user?.id, isProtectedScreen]);

  // An owner callback route without a session means an expired/invalid code.
  useEffect(() => {
    if (!isConfigured || !authReady || session?.user || !isAuthCallbackPath) return;
    stripAuthCallbackParams();
    redirectToLogin();
  }, [isConfigured, authReady, session?.user?.id, isAuthCallbackPath]);

  const screenContext: ScreenContextValue = useMemo(
    () => ({
      screen: currentScreen,
      isLoggedIn,
      userRole,
      buyerProfile,
      searchParams,
      selectedProductId,
      selectedSupplierId,
      buyerDashboardTab,
      navigate: handleNavigate,
      navigateToExplore: () => handleNavigate('explore'),
      onSearch: handleSearchSubmit,
      openAuth: handleOpenAuthModal,
      openEnquiry: handleOpenEnquiry,
      openChat: handleOpenChat,
      openEditProfile: () => setIsEditProfileOpen(true),
      openQuickQuote: () => {
        handleNavigate('post-rfq');
        triggerToast('Requirement captured — complete the form to receive supplier quotes.');
      },
      callSupplier: handleCallSupplier,
      whatsappSupplier: handleWhatsAppSupplier,
      saveProfile: handleSaveProfile,
      completeBuyerOnboarding: (data: Record<string, unknown>) => {
        handleSaveProfile({
          ...buyerProfile,
          businessName: data.businessName,
          businessType: data.buyerCategory,
          designation: data.designation,
          gstin: data.gstNumber,
          annualProcurementBudget: data.annualBudget,
          primaryCategories: data.primaryCategories,
          city: String(data.location || '').split(',')[0] || '',
          state: String(data.location || '').split(',')[1]?.trim() || '',
        } as BuyerProfileData);
        handleNavigate('buyer-dashboard');
      },
      completeSupplierOnboarding: () => {
        triggerToast('Business listing created! Redirecting to Portal...');
        handleNavigate('supplier-portal');
      },
      submitSampleRequest: (data: Record<string, unknown>) => {
        // eslint-disable-next-line no-console
        console.log('Sample Request Submitted:', data);
        handleNavigate('buyer-dashboard');
      },
      notify: triggerToast,
    }),
    // The context intentionally closes over the latest render's state; the
    // screen router re-renders with the shell on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentScreen,
      isLoggedIn,
      userRole,
      buyerProfile,
      searchParams,
      selectedProductId,
      selectedSupplierId,
      buyerDashboardTab,
    ],
  );

  if (isConfigured && !authReady) {
    return <FullPageLoader message="Securing your Nexora session…" />;
  }

  // Callback/owner routes stay covered while the redirect effect completes.
  if (
    isConfigured &&
    !session?.user &&
    (isAuthCallbackPath || (authReady && isProtectedScreen))
  ) {
    return (
      <FullPageLoader
        message={
          authCallbackPresent && !authReady
            ? 'Completing secure sign-in…'
            : 'Redirecting to secure sign-in…'
        }
      />
    );
  }

  // Explicit /auth/login route — also the redirect target for expired sessions.
  if (isConfigured && isAuthLoginPath) {
    if (!authReady || session?.user) {
      return <FullPageLoader message="Redirecting to Nexora…" />;
    }
    return (
      <Suspense fallback={<FullPageLoader />}>
        <AuthModal
          isOpen
          isFullPage
          initialMode="login"
          onClose={() => {
            window.history.replaceState({}, '', '/');
          }}
          onSuccess={(role: 'buyer' | 'supplier', isNewUser?: boolean) => {
            handleLoginSuccess(role, isNewUser);
            window.history.replaceState({}, '', '/');
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2A0E3F] flex flex-col font-sans selection:bg-[#E8D5F2] selection:text-[#3D1E4E] pb-16 md:pb-0">
      {toastMessage ? <ToastBanner message={toastMessage} /> : null}

      <SiteHeader
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenRFQ={() => handleNavigate('post-rfq')}
        onOpenAuthModal={handleOpenAuthModal}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        userProfile={buyerProfile}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onLogout={handleLogout}
        onOpenChat={() => handleOpenChat()}
      />

      {/* Main Content Area with Top Spacing to Clear the Fixed Header */}
      <div className="flex-1 flex flex-col pt-20">
        <Breadcrumbs
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          params={{
            productName:
              currentScreen === 'product-detail'
                ? TRENDING_PRODUCTS.find((p) => p.id === selectedProductId)?.title
                : undefined,
            supplierName:
              currentScreen === 'supplier-profile'
                ? VERIFIED_SUPPLIERS.find(
                    (s) => s.id === (selectedSupplierId || searchParams.supplierId),
                  )?.name
                : undefined,
          }}
        />

        <ScreenRouter ctx={screenContext} />
      </div>

      {/* Overlays — each lazily loaded behind its own Suspense boundary. */}
      <Suspense fallback={null}>
        <EnquiryModal
          isOpen={isEnquiryModalOpen}
          onClose={() => {
            setIsEnquiryModalOpen(false);
            setTargetEnquiryItem(null);
          }}
          targetItem={targetEnquiryItem}
          buyerProfile={buyerProfile}
          onCallSupplier={handleCallSupplier}
          onWhatsAppSupplier={handleWhatsAppSupplier}
          onNavigateToDashboard={() => {
            setIsEnquiryModalOpen(false);
            handleNavigate('buyer-enquiry-log');
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleLoginSuccess}
          initialMode={authMode}
        />
      </Suspense>

      <Suspense fallback={null}>
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          initialData={buyerProfile}
          onSave={handleSaveProfile}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ChatModalDrawer
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          initialSupplier={chatInitialSupplier}
          initialProduct={chatInitialProduct}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DatabaseStatusModal
          isOpen={isDatabaseModalOpen}
          onClose={() => setIsDatabaseModalOpen(false)}
          onNavigateToScreen={(screen: ScreenId) => handleNavigate(screen)}
        />
      </Suspense>

      <SiteFooter
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenRFQ={() => handleNavigate('post-rfq')}
        onOpenAuthModal={() => handleOpenAuthModal('login')}
      />

      <MobileBottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onOpenAuth={() => handleOpenAuthModal('login')}
      />

      <DatabaseInspectorFab
        isSynced={isLoggedIn && locationSyncStatus === 'synced'}
        onToggle={() => setIsDatabaseModalOpen((prev) => !prev)}
      />
    </div>
  );
}

export function App({ initialScreen }: NexoraShopAppProps = {}) {
  return (
    <SupabaseProvider>
      <NexoraShopApp initialScreen={initialScreen} />
    </SupabaseProvider>
  );
}

export default App;
