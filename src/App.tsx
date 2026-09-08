import React, { useEffect, useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Breadcrumbs } from './components/Breadcrumbs';
import { LuxeHeader } from './components/luxe/LuxeHeader';
import { LuxeHero } from './components/luxe/LuxeHero';
import { BuySmartCard } from './components/luxe/BuySmartCard';
import { CategoryStrip } from './components/luxe/CategoryStrip';
import { VerifiedSuppliers } from './components/luxe/VerifiedSuppliers';
import { TrendingProducts } from './components/luxe/TrendingProducts';
import { OemBanner } from './components/luxe/OemBanner';
import { SupplierCta } from './components/luxe/SupplierCta';
import { SourcingCities } from './components/luxe/SourcingCities';
import { HowItWorks } from './components/luxe/HowItWorks';
import { LuxeFooter } from './components/luxe/LuxeFooter';
import { Reveal } from './components/luxe/Reveal';
import { GoldDivider } from './components/luxe/GoldDivider';
import { DirectoryHubScreen } from './components/DirectoryHubScreen';
import { EnquiryModal } from './components/EnquiryModal';
import { AuthModal } from './components/AuthModal';
import { ProductCompareModal } from './components/ProductCompareModal';
import { QuoteModal } from './components/QuoteModal';
import { ProductListingScreen } from './components/ProductListingScreen';
import { SearchFilterScreen } from './components/SearchFilterScreen';
import { SupplierDirectoryScreen } from './components/SupplierDirectoryScreen';
import { SupplierProfileScreen } from './components/SupplierProfileScreen';
import { SellerProfileScreen } from './components/SellerProfileScreen';
import { SupplierOnboardingScreen } from './components/SupplierOnboardingScreen';
import { SupplierVerificationScreen } from './components/SupplierVerificationScreen';
import { BrandDirectoryDetailScreen } from './components/BrandDirectoryDetailScreen';
import { OemPrivateLabelHubScreen } from './components/OemPrivateLabelHubScreen';
import { SupplierAdminPortal } from './components/SupplierAdminPortal';
import { BuyerDashboard } from './components/BuyerDashboard';
import { BuyerRFQTrackingScreen } from './components/BuyerRFQTrackingScreen';
import { SampleRequestScreen, SampleRequestProduct, SampleRequestFormData } from './components/SampleRequestScreen';
import { PostRequirementScreen } from './components/PostRequirementScreen';
import { BuyerEnquiryLogScreen } from './components/BuyerEnquiryLogScreen';
import { EditProfileModal, BuyerProfileData } from './components/EditProfileModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ChatModalDrawer } from './components/ChatModalDrawer';
import { BuyerOnboardingScreen } from './components/BuyerOnboardingScreen';
import { SELLER_PROFILES_DB } from './data/sellerProfilesData';
import { SPONSORED_PRODUCTS_DB } from './data/sponsoredProductsData';
import { addNotification } from './data/notifications';
import { db } from './db/database';
import { getBuyerProfile } from './data/buyerProfilesData';
import { isSupplierSaved as isSupplierSavedInStore, toggleSavedSupplier } from './data/savedStore';
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
  resolveUserRole,
  isSupabaseConfigured,
  readDemoAuthSession,
  clearDemoAuthSession,
} from './lib/supabase';
import {
  evaluateAccess,
  toViewer,
  canAccess,
  getAccessLevel,
  HOME_SCREEN,
  SCREEN_ACCESS,
  type ScreenId,
} from './lib/roleAccess';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  VERIFIED_SUPPLIERS
} from './data/mockData';
import { RFQItem, SearchProduct } from './types';
import { CheckCircle2 } from 'lucide-react';

function NexoraShopApp() {
  const {
    isConfigured,
    authReady,
    session,
    user,
    locationSyncStatus,
    signOut,
  } = useSupabase();

  // The demo build (no Supabase project) keeps a clearly namespaced browser
  // local session so an evaluated buyer/supplier portal survives a refresh.
  // A configured production build never restores this demo identity.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (isSupabaseConfigured()) return false;
    return Boolean(readDemoAuthSession());
  });
  const [userRole, setUserRole] = useState<'buyer' | 'supplier' | null>(() => {
    if (isSupabaseConfigured()) return null;
    return readDemoAuthSession()?.role ?? null;
  });

  // Initial screen is restored from the address bar so a refresh or a deep
  // link (e.g. /rfq-tracking) re-opens the same workspace instead of always
  // landing on the homepage. The shared access policy is applied with the
  // freshly restored viewer, so a guest can never land inside a protected
  // screen — they get the homepage plus the sign-in prompt below instead.
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    if (typeof window === 'undefined') return 'explore';
    const path = window.location.pathname;
    if (isSupabaseConfigured() || isAuthPath(path)) return 'explore';
    const id = path.replace(/^\//, '');
    if (!id || !(id in SCREEN_ACCESS)) return 'explore';
    const initialViewer = toViewer(
      Boolean(readDemoAuthSession()),
      readDemoAuthSession()?.role ?? null
    );
    return canAccess(id, initialViewer) ? (id as ScreenId) : 'explore';
  });
  const [selectedProductId, setSelectedProductId] = useState<string>('product_vitc_101');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('seller_aura_001');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // The single identity every access decision is made against.
  const viewer = toViewer(isLoggedIn, userRole);

  // Persistent Buyer Profile State
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileData>(() => {
    const priyaDefault = getBuyerProfile('buyer_priya_001') || {
      id: 'buyer_priya_001',
      fullName: 'Priya Sharma',
      businessName: 'Radiant Beauty Solutions',
      businessType: 'Salon / Spa Chain',
      designation: 'Head of Procurement',
      email: 'priya.procurement@radiantbeauty.in',
      phone: '+91 98201 54321',
      alternatePhone: '+91 22 2650 4321',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
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
      joinedDate: 'January 2024'
    };

    const stored = localStorage.getItem('nexora_buyer_profile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...priyaDefault,
          ...parsed
        };
      } catch (e) {
        // Fallback
      }
    }
    return priyaDefault;
  });

  const [requirementDraft, setRequirementDraft] = useState<{ requirement: string; quantity: string; city: string } | undefined>();
  const [pendingScreen, setPendingScreen] = useState<ScreenId | null>(null);

  // Product context carried into the sample requisition flow.
  const [sampleRequestProduct, setSampleRequestProduct] = useState<SampleRequestProduct | null>(null);

  // One-shot deep-focus for the tracking screen (e.g. dashboard "Compare
  // Quotes" preselects the RFQ, "Edit RFQ" preselects and opens the editor).
  const [rfqTrackingFocus, setRfqTrackingFocus] = useState<{ rfqId: string; openEdit?: boolean } | null>(null);

  // Public buyer profiles VIEWED through the network/member screens must never
  // overwrite the signed-in buyer's own identity used by the nav, dashboards
  // and edit flows. Viewed profiles live in a separate slot.
  const [viewedBuyerProfile, setViewedBuyerProfile] = useState<BuyerProfileData | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [buyerDashboardTab, setBuyerDashboardTab] = useState<'overview' | 'about' | 'rfqs' | 'saved' | 'social' | 'activity' | 'notifications'>('overview');
  
  // Search parameters
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: 'All',
    location: 'All India',
    tab: 'products' as 'products' | 'suppliers' | 'oem'
  });
  
  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'buyer' | 'supplier'>('buyer');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [targetEnquiryItem, setTargetEnquiryItem] = useState<any | null>(null);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [targetSupplierName, setTargetSupplierName] = useState('');

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatInitialSupplier, setChatInitialSupplier] = useState<{ id: string; name: string; location: string; isVerified: boolean } | undefined>(undefined);
  const [chatInitialProduct, setChatInitialProduct] = useState<{ title: string; image: string; price?: string; moq?: string } | undefined>(undefined);

  // Product Comparison Modal State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparedProductsList, setComparedProductsList] = useState<SearchProduct[]>([]);

  // Formal Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [targetQuoteRFQ, setTargetQuoteRFQ] = useState<RFQItem | null>(null);


  const handleOpenProductComparison = (products: SearchProduct[]) => {
    setComparedProductsList(products);
    setIsCompareModalOpen(true);
  };

  const handleRemoveFromComparison = (id: string) => {
    setComparedProductsList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenQuoteModal = (rfq?: RFQItem) => {
    const defaultRfq: RFQItem = rfq || {
      id: 'rfq-gen-' + Date.now(),
      title: 'Bulk Formulation & Custom Packaging Supply',
      buyerLocation: 'Mumbai, Maharashtra',
      category: 'Cosmetics & Skincare',
      quantityRequired: '2,000 Units',
      targetPrice: '₹180 - ₹220 / Unit',
      timeAgo: '2 hours ago',
      isVerifiedBuyer: true,
      description: 'Require high-potency cosmetic formulation with COA certification and customized secondary packaging.'
    };
    setTargetQuoteRFQ(defaultRfq);
    setIsQuoteModalOpen(true);
  };

  const handleFacilityTour = (supplierName?: string) => {
    triggerToast(`Virtual Facility Tour requested for ${supplierName || 'verified manufacturing unit'}. Support desk will send access credentials.`);
  };

  const handleOpenChat = (supplier?: { id: string; name: string; location: string; isVerified: boolean }, product?: { title: string; image: string; price?: string; moq?: string }) => {
    if (!isLoggedIn) { handleOpenAuthModal('login'); return; }
    setChatInitialSupplier(supplier);
    setChatInitialProduct(product);
    setChatModalOpen(true);
  };

  // Interactive Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (msg: string) => {
    // Clear any previous auto-hide timer so a stale timer can never clear a
    // newer message early (and back-to-back toasts queue cleanly).
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
    clearDemoAuthSession();
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
      const target = role === 'buyer' ? 'buyer-onboarding' : 'onboarding';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome to Nexora Luxe! Let's set up your ${role} profile.`);
    } else {
      const target = pendingScreen && canAccess(pendingScreen, role) ? pendingScreen : role === 'buyer' ? 'buyer-dashboard' : 'supplier-portal';
      setPendingScreen(null);
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome back! Logged in as ${role === 'buyer' ? 'Buyer' : 'Supplier'}.`);
    }
  };

  // Handlers
  const handleNavigate = (screen: any, params?: any) => {
    // Layer 1 of the guard: intercept the click path. Every rule comes from
    // the shared policy in lib/roleAccess so this can never disagree with the
    // render-time ProtectedRoute check or with the nav-bar filtering.
    const decision = evaluateAccess(screen, viewer);

    if (!decision.allowed) {
      if (decision.reason === 'unauthenticated') {
        // Guests get the sign-in modal rather than a dead end.
        setPendingScreen(screen);
        setAuthMode('login');
        setIsAuthModalOpen(true);
        triggerToast(decision.message || 'Please sign in to continue.');
        return;
      }

      triggerToast(decision.message || 'Access restricted.');
      if (decision.redirectTo && decision.redirectTo !== currentScreen) {
        setCurrentScreen(decision.redirectTo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setCurrentScreen(screen);
    if ((screen === 'buyer-dashboard' || screen === 'buyer-profile') && params?.tab) {
      setBuyerDashboardTab(params.tab);
    }
    if (screen === 'rfq-tracking') {
      setRfqTrackingFocus(params?.rfqId ? { rfqId: params.rfqId, openEdit: Boolean(params.openEdit) } : null);
    }
    if (screen === 'buyer-profile' && !params?.memberData && !params?.buyerId) {
      // Navigating to your own profile (nav menu, breadcrumbs) always resets
      // the viewed slot — with and without params.
      setViewedBuyerProfile(null);
    }
    if (params) {
      if (params.productId) {
        setSelectedProductId(params.productId);
      }
      if (params.supplierId) {
        setSelectedSupplierId(params.supplierId);
      }
      if (params.buyerId || (screen === 'buyer-profile' && (params.memberData || params.buyerId))) {
        // Public-profile browsing writes to the VIEWED slot only. The signed-in
        // buyer's own profile (nav, dashboard, edit modal) is never touched, so
        // viewing a member can no longer hijack your identity until reload.
        const found = getBuyerProfile(params.buyerId || params.memberData?.profileId || params.memberData?.id || params.memberData?.name);
        if (found) {
          setViewedBuyerProfile({ ...found });
        } else if (params.memberData) {
          const m = params.memberData;
          const cleanName = m.name.replace(/\s*\(.*?\)\s*/g, '').trim();
          const bizName = m.name.match(/\((.*?)\)/)?.[1] || `${cleanName} Enterprises`;
          setViewedBuyerProfile(prev => ({
            ...(prev ?? buyerProfile),
            fullName: cleanName,
            businessName: bizName,
            businessType: m.businessType || (prev ?? buyerProfile).businessType,
            avatarUrl: m.avatar,
            city: m.city || (prev ?? buyerProfile).city,
            state: m.state || (prev ?? buyerProfile).state,
            isGstVerified: m.isGstVerified,
            followersCount: m.followersCount ?? (prev ?? buyerProfile).followersCount
          }));
        }
      }
      setSearchParams((prev) => ({
        ...prev,
        ...params
      }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuthModal = (mode: 'login' | 'register', role: 'buyer' | 'supplier' = 'buyer') => {
    setAuthRole(role);
    if (mode === 'register') {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenEnquiry = (item: any) => {
    if (!isLoggedIn) { handleOpenAuthModal('login'); return; }
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

    const supplier = VERIFIED_SUPPLIERS.find(s => s.name === supplierName);
    const profile = Object.values(SELLER_PROFILES_DB).find(s => s.name === supplierName);
    const phone = profile?.phone || supplier?.phone;
    if (!phone) { triggerToast('This supplier has not provided a phone number.'); return; }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Direct native dialer trigger
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

    const supplier = VERIFIED_SUPPLIERS.find(s => s.name === supplierName);
    const profile = Object.values(SELLER_PROFILES_DB).find(s => s.name === supplierName);
    const whatsapp = (profile?.whatsapp || supplier?.whatsapp)?.replace(/\D/g, '');
    if (!whatsapp) { triggerToast('This supplier has not provided a WhatsApp number.'); return; }
    const nameToUse = supplierName || supplier?.name || 'Supplier';
    const message = encodeURIComponent(`Hello ${nameToUse}, I found your business on Nexora Luxe and I am interested in your products. Can we discuss a potential enquiry?`);
    
    // Direct WhatsApp redirect
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
    triggerToast(`Opening direct WhatsApp channel with ${nameToUse}`);
  };

  const handleSearchSubmit = (params: any) => {
    setSearchParams({
      query: params.query || '',
      category: params.category && params.category !== 'All Categories' ? params.category : 'All',
      location: params.location && params.location !== 'Any Location' ? params.location : 'All India',
      tab: params.scope || 'products'
    });
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryName: string) => {
    setSearchParams({
      query: '',
      category: categoryName,
      location: 'All India',
      tab: 'products'
    });
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    setSearchParams((prev) => ({
      ...prev,
      query: tag,
      tab: 'products'
    }));
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Saved suppliers — persisted shortlist shared with the buyer dashboard.
  const [savedSuppliersVersion, setSavedSuppliersVersion] = useState(0);
  const handleToggleSaveSupplier = (supplierId: string, supplierName?: string) => {
    const nowSaved = toggleSavedSupplier(supplierId);
    setSavedSuppliersVersion((v) => v + 1);
    triggerToast(nowSaved
      ? `${supplierName || 'Supplier'} added to your Saved Suppliers shortlist.`
      : `${supplierName || 'Supplier'} removed from Saved Suppliers.`);
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isSupplierSavedCheck = (supplierId: string) => {
    void savedSuppliersVersion; // re-evaluate on toggle
    return isSupplierSavedInStore(supplierId);
  };

  // Derive the Supabase user's role (stored in auth metadata at registration).
  const supabaseRole = resolveUserRole(user);

  // Layer 3: state-level eviction. If the viewer is ever sitting on a screen
  // their role may not see — after a refresh restores a screen, after signing
  // out, or after the role resolves from Supabase metadata — move them to
  // their own workspace. handleNavigate covers clicks and ProtectedRoute
  // covers rendering; this covers state changing underneath a static screen.
  useEffect(() => {
    // Wait for auth to settle, or a supplier would be bounced during the
    // frame where their role has not yet resolved.
    if (isConfigured && !authReady) return;
    if (canAccess(currentScreen, viewer)) return;

    const decision = evaluateAccess(currentScreen, viewer);
    const target = decision.redirectTo ?? HOME_SCREEN[viewer];
    if (target !== currentScreen) {
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentScreen, viewer, isConfigured, authReady]);

  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAuthLoginPath = currentPathname === AUTH_LOGIN_PATH;
  const isAuthCallbackPath = currentPathname !== AUTH_LOGIN_PATH
    && (currentPathname === AUTH_CALLBACK_PATH || currentPathname.startsWith(AUTH_CALLBACK_PREFIX));
  const isAuthRoute = isAuthPath(currentPathname);
  const authCallbackPresent = hasAuthCallbackParams();
  const authCallbackCode = getAuthCallbackCode();

  // Always strip transient authorization parameters after the Supabase PKCE
  // exchange has resolved (session present) or when we are already rendering a
  // stable auth page, so `?code=...&state=...` never persists in the address bar.
  useEffect(() => {
    if (authCallbackCode && session?.user) {
      stripAuthCallbackParams();
    }
  }, [authCallbackCode, session?.user?.id]);

  // Keep the in-memory login flags in sync with the single Supabase auth
  // listener whenever a real Supabase project is configured.
  useEffect(() => {
    if (!isConfigured) return;
    if (!authReady) return;
    if (session?.user) {
      // Prefer the server role. If metadata has not resolved yet, fall back to
      // the last known role rather than forcing 'buyer', which would otherwise
      // bounce a supplier out of their portal for a frame after every refresh.
      const stored = localStorage.getItem('nexora_user_role');
      const cached = stored === 'buyer' || stored === 'supplier' ? stored : null;
      const role = supabaseRole || cached || 'buyer';
      setIsLoggedIn(true);
      setUserRole(role);
      localStorage.setItem('nexora_is_logged_in', 'true');
      localStorage.setItem('nexora_user_role', role);
      localStorage.removeItem('nexora_guest_mode');
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      localStorage.setItem('nexora_is_logged_in', 'false');
      localStorage.removeItem('nexora_user_role');
    }
  }, [isConfigured, authReady, session?.user?.id, supabaseRole]);

  // PKCE / OAuth callback handling: once a session exists on any /auth/*
  // path, normalize the URL back to the app root to avoid repeat exchanges.
  // This also covers authenticated users landing on /auth/login, preventing
  // the login view from being re-rendered while already signed in (loop guard).
  useEffect(() => {
    if (!session?.user || !isAuthRoute) return;
    window.history.replaceState({}, '', '/');
    setCurrentScreen('explore');
    stripAuthCallbackParams();
  }, [session?.user?.id, isAuthRoute]);

  // Derived from the shared policy rather than a second hardcoded list, so a
  // new protected screen cannot be added in one place and forgotten here.
  const isProtectedScreen = getAccessLevel(currentScreen) !== 'public';

  // Never silently replace protected content with a public screen. A missing or
  // invalid session on a protected screen always enters the explicit login
  // route; redirectToLogin guards /auth/login and throttles repeated attempts.
  useEffect(() => {
    if (!isConfigured || !authReady || session?.user || !isProtectedScreen) return;
    redirectToLogin();
  }, [isConfigured, authReady, session?.user?.id, isProtectedScreen]);

  // A callback route without a session after auth initialization represents an
  // expired/invalid code (including Supabase ?error= callbacks). Clean the URL
  // and move directly to login instead of leaving an actionable error screen.
  useEffect(() => {
    if (!isConfigured || !authReady || session?.user || !isAuthCallbackPath) return;
    stripAuthCallbackParams();
    redirectToLogin();
  }, [isConfigured, authReady, session?.user?.id, isAuthCallbackPath]);

  // ---------------------------------------------------------------------------
  // Browser URL <-> screen synchronization
  // ---------------------------------------------------------------------------
  // Every screen maps to a canonical path (explore ↔ "/", others ↔ "/<id>").
  // Navigating pushes a history entry, the back/forward buttons restore the
  // screen, and refresh keeps the page (see the lazy currentScreen init above).
  // Auth routes (/auth/*) are owned by the Supabase flow and never touched here.
  const SCREEN_URL_TITLES: Record<string, string> = {
    'explore': 'B2B Beauty Marketplace',
    'directory': 'Directory Hub',
    'supplier-directory': 'Supplier Directory',
    'plp': 'Products',
    'product-detail': 'Product Details',
    'search-results': 'Search Results',
    'brands': 'Brand Directory',
    'oem-hub': 'OEM & Private Label',
    'supplier-profile': 'Supplier Profile',
    'onboarding': 'Supplier Onboarding',
    'buyer-onboarding': 'Buyer Onboarding',
    'supplier-portal': 'Supplier Portal',
    'supplier-verification': 'Supplier Verification',
    'buyer-dashboard': 'Buyer Dashboard',
    'buyer-profile': 'Buyer Profile',
    'rfq-tracking': 'Requirement Tracking',
    'sample-request': 'Sample Request',
    'post-rfq': 'Post Requirement',
    'buyer-enquiry-log': 'Enquiry Log',
  };
  const pathForScreen = (screen: string) => (screen === 'explore' ? '/' : `/${screen}`);
  const screenFromPath = (path: string): ScreenId | null => {
    const id = path.replace(/^\//, '');
    return id && id in SCREEN_ACCESS ? (id as ScreenId) : null;
  };
  const didInitialUrlSync = React.useRef(false);

  // Keep the address bar in sync with the active screen.
  useEffect(() => {
    if (typeof window === 'undefined' || isAuthRoute) return;
    const target = pathForScreen(currentScreen);
    if (window.location.pathname === target) {
      didInitialUrlSync.current = true;
      return;
    }
    // The first sync after a deep-link restore replaces (no junk history);
    // later navigations push so the back button walks the actual journey.
    if (!didInitialUrlSync.current) {
      window.history.replaceState({}, '', target);
      didInitialUrlSync.current = true;
    } else {
      if (isConfigured && !session?.user && isProtectedScreen) return; // login redirect owns the URL
      window.history.pushState({}, '', target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, isAuthRoute]);

  // Back / forward: restore the in-memory screen from the popped path, with
  // the same policy evaluation used everywhere else.
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (isAuthPath(path)) return;
      const target = screenFromPath(path) ?? 'explore';
      const decision = evaluateAccess(target, viewer);
      if (decision.allowed) {
        setCurrentScreen(target);
        window.scrollTo({ top: 0 });
      } else if (decision.reason === 'unauthenticated') {
        setPendingScreen(target);
        setAuthMode('login');
        setIsAuthModalOpen(true);
        window.history.replaceState({}, '', pathForScreen(currentScreen));
      } else if (decision.redirectTo) {
        setCurrentScreen(decision.redirectTo);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, currentScreen]);

  // Route-aware document title.
  useEffect(() => {
    if (typeof document === 'undefined' || isAuthRoute) return;
    const label = SCREEN_URL_TITLES[currentScreen] || 'B2B Beauty Marketplace';
    document.title = currentScreen === 'explore' ? `Nexora Luxe — ${label}` : `${label} | Nexora Luxe`;
  }, [currentScreen, isAuthRoute]);

  // Demo-mode guest opening a deep link to a protected screen sees the sign-in
  // prompt with the original destination preserved (mirrors the click path).
  useEffect(() => {
    if (typeof window === 'undefined' || isSupabaseConfigured()) return;
    const path = window.location.pathname;
    if (isAuthPath(path)) return;
    const target = screenFromPath(path);
    if (!target) return;
    const decision = evaluateAccess(target, viewer);
    if (!decision.allowed && decision.reason === 'unauthenticated') {
      setPendingScreen(target);
      setAuthMode('login');
      setIsAuthModalOpen(true);
      window.history.replaceState({}, '', '/');
    } else if (!decision.allowed && decision.redirectTo) {
      window.history.replaceState({}, '', pathForScreen(decision.redirectTo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isConfigured && !authReady) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#5B4A6E]">Securing your Nexora session…</p>
        </div>
      </div>
    );
  }

  // Keep callback and protected content covered while the corresponding effect
  // completes its automatic redirect. This prevents an invalid callback error
  // page or protected application content from flashing on screen.
  if (
    isConfigured
    && !session?.user
    && (isAuthCallbackPath || (authReady && isProtectedScreen))
  ) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#5B4A6E]">
            {authCallbackPresent && !authReady ? 'Completing secure sign-in…' : 'Redirecting to secure sign-in…'}
          </p>
        </div>
      </div>
    );
  }

  // Explicit /auth/login route. This is also the redirect target for invalid or
  // expired sessions. It renders in-page and normalizes to "/" on success.
  if (isConfigured && isAuthLoginPath) {
    if (!authReady) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 text-center">
          <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      );
    }
    if (session?.user) {
      // Already authenticated: the effect below normalizes the URL back to "/".
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 text-center">
          <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#5B4A6E] mt-3">Redirecting to Nexora…</p>
        </div>
      );
    }
    return (
      <AuthModal
        isOpen
        isFullPage
        initialMode="login"
        onClose={() => {
          window.location.assign('/');
        }}
        onSuccess={(role, isNewUser) => {
          handleLoginSuccess(role, isNewUser);
          window.history.replaceState({}, '', '/');
        }}
      />
    );
  }

  return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#2A0E3F] flex flex-col font-sans selection:bg-[#E8D5F2] selection:text-[#3D1E4E] pb-16 md:pb-0">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#2A0E3F] text-white px-4 py-3 rounded-xl shadow-xl border border-[#352B44] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#8236A0]" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Shared Top Navigation Bar — Luxe header on the homepage */}
      {currentScreen === 'explore' ? (
        <LuxeHeader
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onOpenAuthModal={handleOpenAuthModal}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          userProfile={buyerProfile}
          onOpenChat={() => handleOpenChat()}
        />
      ) : (
        <TopNavBar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onOpenRFQModal={() => handleNavigate('post-rfq')}
          onOpenAuthModal={handleOpenAuthModal}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          userProfile={buyerProfile}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area with Top Spacing to Clear the Fixed Header */}
      <div className="flex-1 flex flex-col pt-20">
        <Breadcrumbs
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          params={{
            productName: currentScreen === 'product-detail' ? SPONSORED_PRODUCTS_DB[selectedProductId]?.title : undefined,
            supplierName: currentScreen === 'supplier-profile' ? (SELLER_PROFILES_DB[selectedSupplierId]?.name || VERIFIED_SUPPLIERS.find(s => s.id === (selectedSupplierId || searchParams.supplierId))?.name) : undefined
          }}
        />
        {/* Screen 01: Homepage / Explore Hub — NEXORA LUXE purple-gold edition */}
        {currentScreen === 'explore' && (
          <main className="flex-1 -mt-20 bg-[linear-gradient(180deg,#FDFBF7_0%,#FAF6EF_45%,#F5EEF8_100%)]">
            <LuxeHero
              onSearch={(q, loc) => handleSearchSubmit({ query: q, location: loc })}
              onTabChange={(scope) => {
                if (scope === 'suppliers') {
                  handleNavigate('supplier-directory');
                } else if (scope === 'brands') {
                  handleNavigate('brands');
                } else if (scope === 'oem') {
                  handleNavigate('oem-hub');
                } else {
                  handleNavigate('plp');
                }
              }}
            />

            <Reveal>
            <BuySmartCard
              onGetQuotes={(requirement, quantity, city) => {
                setRequirementDraft({ requirement, quantity, city });
                handleNavigate('post-rfq');
              }}
              onPostDetailed={() => handleNavigate('post-rfq')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <CategoryStrip
              onCategoryClick={(label) => {
                if (label === 'OEM/Private Label') {
                  handleNavigate('oem-hub');
                } else {
                  handleCategorySelect(label);
                }
              }}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <VerifiedSuppliers
              onViewProfile={(id) => handleNavigate('supplier-profile', { supplierId: id })}
              onSendEnquiry={(name) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title: 'Enquiry for ' + name,
                  supplierName: name,
                  type: 'supplier',
                });
              }}
              onViewAll={() => handleNavigate('supplier-directory')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <TrendingProducts
              onViewDetails={(id) => handleNavigate('product-detail', { productId: id })}
              onSendEnquiry={(title, supplier) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title,
                  supplierName: supplier,
                  type: 'product',
                });
              }}
              onViewAll={() => handleNavigate('plp')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal direction="none">
            <OemBanner
              onExplore={() => handleNavigate('oem-hub')}
              onPostRequirement={() => handleNavigate('post-rfq')}
            />

            </Reveal>

            <Reveal>
            <SupplierCta
              onJoin={() => isLoggedIn ? handleNavigate('onboarding') : handleOpenAuthModal('register', 'supplier')}
              onLogin={() => handleOpenAuthModal('login')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <SourcingCities
              onCityClick={(city) => handleSearchSubmit({ query: '', location: city, scope: 'suppliers' })}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <HowItWorks onPost={() => handleNavigate('post-rfq')} />
            </Reveal>
          </main>
        )}

        {/* Screen 03: Product Listing Page (PLP) */}
        {currentScreen === 'plp' && (
          <main className="flex-1">
            <ProductListingScreen
              isLoggedIn={isLoggedIn}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={handleOpenQuoteModal}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSearch={handleNavigate}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenProductComparison={handleOpenProductComparison}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
            />
          </main>
        )}

        {/* Screen 02: Global Search & Filter Results (Unified) */}
        {currentScreen === 'search-results' && (
          <main className="flex-1">
            <SearchFilterScreen
              key={JSON.stringify(searchParams)}
              initialTab={searchParams.tab}
              initialQuery={searchParams.query}
              initialCategory={searchParams.category}
              initialLocation={searchParams.location}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={handleOpenQuoteModal}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onNavigate={handleNavigate}
              isSupplierSaved={isSupplierSavedCheck}
              onToggleSaveSupplier={handleToggleSaveSupplier}
            />
          </main>
        )}

        {/* Screen 04: Product Detail Page */}
        {currentScreen === 'product-detail' && (
          <main className="flex-1">
            <ProductDetailPage
              key={selectedProductId}
              productId={selectedProductId}
              onBack={() => handleNavigate('explore')}
              onNavigateToProduct={(productId) => handleNavigate('product-detail', { productId })}
              onOpenEnquiryModal={(item) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title: item.name,
                  supplierName: item.supplierName,
                  type: 'product'
                });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToSampleRequest={() => {
                // Carry the exact product/supplier the buyer was viewing into
                // the requisition so no hardcoded product is ever shown.
                const p = SPONSORED_PRODUCTS_DB[selectedProductId];
                setSampleRequestProduct(p ? {
                  id: p.id,
                  title: p.title,
                  supplierName: p.supplierName,
                  supplierId: p.seller_id,
                  image: p.images?.[0],
                  priceRange: p.priceRange,
                  moq: p.moq,
                  location: p.supplierLocation,
                } : null);
                handleNavigate('sample-request');
              }}
              onNavigateToSupplierProfile={(supplierId) => {
                handleNavigate('supplier-profile', { supplierId });
              }}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
              onOpenChat={handleOpenChat}
            />
          </main>
        )}

        {/* Screen 06: Directory Hub */}
        {currentScreen === 'directory' && (
          <main className="flex-1">
            <DirectoryHubScreen
              onNavigate={handleNavigate}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
            />
          </main>
        )}

        {/* Screen 06 List: Supplier Directory */}
        {currentScreen === 'supplier-directory' && (
          <main className="flex-1">
            <SupplierDirectoryScreen
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={handleOpenQuoteModal}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              isSupplierSaved={isSupplierSavedCheck}
              onToggleSaveSupplier={handleToggleSaveSupplier}
            />
          </main>
        )}

        {/* Screen 07: Dedicated Seller Profile / Mini-Website Page */}
        {currentScreen === 'supplier-profile' && (
          <main className="flex-1">
            <SellerProfileScreen
              sellerId={selectedSupplierId || searchParams.supplierId}
              isLoggedIn={isLoggedIn}
              onBack={() => handleNavigate('explore')}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenAuth={() => handleOpenAuthModal('login')}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={(suppName) => handleNavigate('post-rfq', { supplierName: suppName })}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
            />
          </main>
        )}

        {/* Screen 08: Brand Directory */}
        {currentScreen === 'brands' && (
          <main className="flex-1">
            <BrandDirectoryDetailScreen
              onOpenEnquiryModal={(prodName, suppName) => {
                handleOpenEnquiry({ name: prodName, supplierName: suppName });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onOpenFacilityTour={(suppName) => handleFacilityTour(suppName)}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}

        {/* Screen 09: OEM / Private Label Hub */}
        {currentScreen === 'oem-hub' && (
          <main className="flex-1">
            <OemPrivateLabelHubScreen
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onOpenEnquiryModal={(prodName, suppName) => {
                handleOpenEnquiry({ name: prodName, supplierName: suppName });
              }}
              onOpenFacilityTour={(suppName) => handleFacilityTour(suppName)}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}

        {/* Phase A: Buyer Onboarding Flow */}
        {currentScreen === 'buyer-onboarding' && (
          <ProtectedRoute
            screen="buyer-onboarding"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <BuyerOnboardingScreen
                onComplete={(data) => {
                  handleSaveProfile({
                    ...buyerProfile,
                    businessName: data.businessName,
                    businessType: data.buyerCategory,
                    designation: data.designation,
                    gstin: data.gstNumber,
                    annualProcurementBudget: data.annualBudget,
                    primaryCategories: data.primaryCategories,
                    city: data.location.split(',')[0] || '',
                    state: data.location.split(',')[1]?.trim() || '',
                  });
                  handleNavigate('buyer-dashboard');
                }}
                onNavigateToExplore={() => handleNavigate('explore')}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Phase B: Supplier Onboarding Flow */}
        {currentScreen === 'onboarding' && (
          <ProtectedRoute
            screen="onboarding"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <SupplierOnboardingScreen
                authenticated={isLoggedIn && userRole === 'supplier'}
                userId={session?.user?.id || user?.id || null}
                userEmail={session?.user?.email || user?.email || null}
                userRole={userRole}
                onComplete={() => {
                  triggerToast('Business listing created! Redirecting to Portal...');
                  handleNavigate('supplier-portal');
                }}
                onNavigateToExplore={() => handleNavigate('explore')}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Phase B: Supplier Admin Portal */}
        {currentScreen === 'supplier-portal' && (
          <ProtectedRoute
            screen="supplier-portal"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <SupplierAdminPortal 
                onNavigateToProduct={(productId) => {
                  setSelectedProductId(productId);
                  handleNavigate('product-detail', { productId });
                }}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Screen 24: Supplier Verification Center */}
        {currentScreen === 'supplier-verification' && (
          <ProtectedRoute
            screen="supplier-verification"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <SupplierVerificationScreen 
                onBack={() => handleNavigate('supplier-portal')}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Screen 12: Buyer Dashboard */}
        {currentScreen === 'buyer-dashboard' && (
          <ProtectedRoute
            screen="buyer-dashboard"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <BuyerDashboard 
                isLoggedIn={isLoggedIn}
                onNavigate={handleNavigate}
                onPostRFQ={() => handleNavigate('post-rfq')}
                onCallSupplier={handleCallSupplier}
                onWhatsAppSupplier={handleWhatsAppSupplier}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onOpenChat={handleOpenChat}
                buyerProfile={buyerProfile}
                onSaveProfile={handleSaveProfile}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                initialTab={buyerDashboardTab}
                isProfileRoute={false}
                currentScreen={currentScreen}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Specific /buyer/profile Route View */}
        {currentScreen === 'buyer-profile' && (
          <ProtectedRoute
            screen="buyer-profile"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <BuyerDashboard
                isLoggedIn={isLoggedIn}
                onNavigate={handleNavigate}
                onPostRFQ={() => handleNavigate('post-rfq')}
                onCallSupplier={handleCallSupplier}
                onWhatsAppSupplier={handleWhatsAppSupplier}
                onOpenAuth={() => handleOpenAuthModal('login')}
                onOpenChat={handleOpenChat}
                buyerProfile={viewedBuyerProfile ?? buyerProfile}
                onSaveProfile={handleSaveProfile}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                initialTab="activity"
                isProfileRoute={true}
                currentScreen={currentScreen}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Screen 13: Buyer RFQ Tracking & Quote Comparison */}
        {currentScreen === 'rfq-tracking' && (
          <ProtectedRoute
            screen="rfq-tracking"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <BuyerRFQTrackingScreen
                onBack={() => handleNavigate('buyer-dashboard')}
                onPostRFQ={() => handleNavigate('post-rfq')}
                focusRequest={rfqTrackingFocus}
                onFocusHandled={() => setRfqTrackingFocus(null)}
                onNavigateToChat={(supplierIdOrName) => {
                  // Quotes carry the registered company name ("Aura Beauty Labs &
                  // Formulations") while the public directory uses the short brand
                  // name — match in either direction, plus exact id equality.
                  const needle = supplierIdOrName.toLowerCase();
                  const supp = VERIFIED_SUPPLIERS.find(s =>
                    s.id === supplierIdOrName ||
                    s.name.toLowerCase().includes(needle) ||
                    needle.includes(s.name.toLowerCase())
                  );
                  handleOpenChat(
                    {
                      id: supp?.id || 'supp-rfq',
                      name: supp?.name || supplierIdOrName,
                      location: supp ? `${supp.city}${supp.state ? `, ${supp.state}` : ''}` : 'India',
                      isVerified: supp ? supp.isVerified : true
                    },
                    { title: 'Vitamin C Brightening Serum (Bulk)', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', price: '₹195 / unit', moq: '2,000 Units' }
                  );
                }}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Sample Request Screen */}
        {currentScreen === 'sample-request' && (
          <ProtectedRoute
            screen="sample-request"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <SampleRequestScreen
                product={sampleRequestProduct || undefined}
                onBack={() => handleNavigate('product-detail', { productId: sampleRequestProduct?.id || selectedProductId })}
                onAskFormulationLead={sampleRequestProduct ? () => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: `Formulation question: ${sampleRequestProduct.title}`,
                    supplierName: sampleRequestProduct.supplierName,
                    type: 'product'
                  });
                } : undefined}
                onSubmit={(data: SampleRequestFormData) => {
                  // Persist the requisition as a direct enquiry so it surfaces in
                  // the buyer enquiry log (which merges live direct enquiries)
                  // and in the supplier's lead inbox for follow-up.
                  // Supplier display names ("Aura Beauty Labs") are shorter than
                  // registered company names ("Aura Beauty Labs & Formulations"),
                  // so match in either direction instead of strict equality.
                  const supplierNameLc = data.supplierName.toLowerCase();
                  const supplier = db.getSupplierProfiles().find((s) => {
                    const cn = s.company_name.toLowerCase();
                    const base = cn.split('&')[0].trim();
                    return cn === supplierNameLc || cn.includes(supplierNameLc) || base === supplierNameLc;
                  });
                  const detailLines = [
                    `Sample requisition for ${data.productTitle}.`,
                    `Set: ${data.sampleSet} · Variant: ${data.variant} · Shipping: ${data.shippingMethod === 'express' ? 'Express (2-3 days)' : 'Standard (5-7 days)'}`,
                    data.purposes.length ? `Evaluation purpose: ${data.purposes.join(', ')}` : null,
                    `Ship to: ${data.recipientName}${data.companyName ? ` (${data.companyName})` : ''}, ${data.streetAddress}, ${data.city}${data.state ? `, ${data.state}` : ''}`,
                    data.notes ? `Notes: ${data.notes}` : null,
                  ].filter(Boolean).join('\n');
                  const enquiry = db.createRFQEnquiry({
                    buyer_id: 'buyer-prof-priya',
                    supplier_id: supplier?.id || null,
                    product_id: null,
                    requirement_title: `Sample Request: ${data.productTitle}`,
                    category: 'Skincare & Serums',
                    quantity_required: 1,
                    quantity_unit: 'Sample Set',
                    delivery_location: `${data.city}${data.state ? `, ${data.state}` : ''}`,
                    details: detailLines,
                    attachments: [],
                    status: 'new',
                    type: 'direct_enquiry',
                    send_to_similar_suppliers: !supplier,
                  });
                  addNotification({
                    type: 'sample',
                    title: `Sample request logged: ${data.productTitle}`,
                    description: supplier
                      ? `Sent to ${supplier.company_name} as ${enquiry.id}. Saved in your Enquiry Log.`
                      : `Saved as ${enquiry.id} and shared with matching verified suppliers.`,
                    priority: 'medium',
                    targetScreen: 'buyer-enquiry-log',
                    sender: { name: 'Sample Desk', isVerified: true },
                    metadata: { rfqId: enquiry.id, productName: data.productTitle, supplierName: supplier?.company_name }
                  });
                  triggerToast(`Sample request ${enquiry.id} saved${supplier ? ` and routed to ${supplier.company_name}` : ''}. Track it in your Enquiry Log.`);
                  handleNavigate('buyer-enquiry-log');
                }}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Screen 10: Post Requirement / Public RFQ Form */}
        {currentScreen === 'post-rfq' && (
          <ProtectedRoute
            screen="post-rfq"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <PostRequirementScreen
                initialDraft={requirementDraft}
                onNavigateToExplore={() => handleNavigate('explore')}
                onNavigateToRFQs={() => handleNavigate('rfq-tracking')}
              />
            </main>
          </ProtectedRoute>
        )}

        {/* Screen 14: Buyer Enquiry Log */}
        {currentScreen === 'buyer-enquiry-log' && (
          <ProtectedRoute
            screen="buyer-enquiry-log"
            viewer={viewer}
            authReady={!isConfigured || authReady}
            onRedirect={(s) => handleNavigate(s)}
            onDenied={triggerToast}
            onSignIn={() => handleOpenAuthModal('login')}
          >
            <main className="flex-1">
              <BuyerEnquiryLogScreen
                onBack={() => handleNavigate('buyer-dashboard')}
                onNavigateToChat={(supplierName) => handleOpenChat({ id: 'supp_custom', name: supplierName, location: 'All India', isVerified: true })}
                onCallSupplier={(name) => handleCallSupplier(name)}
                onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
                onNavigateToExplore={() => handleNavigate('explore')}
              />
            </main>
          </ProtectedRoute>
        )}
      </div>

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

      <AuthModal
        key={`${authMode}-${authRole}-${isAuthModalOpen}`}
        initialRole={authRole}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={buyerProfile}
        onSave={handleSaveProfile}
      />

      <ChatModalDrawer
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        initialSupplier={chatInitialSupplier}
        initialProduct={chatInitialProduct}
      />

      <ProductCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        products={comparedProductsList}
        onRemoveProduct={handleRemoveFromComparison}
        onOpenEnquiry={(product) => {
          handleOpenEnquiry({
            id: 'enq-' + Date.now(),
            title: product.title,
            supplierName: product.supplierName,
            type: 'product'
          });
        }}
      />

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        rfq={targetQuoteRFQ}
      />

      {/* Shared Footer — Luxe edition on the homepage */}
      {currentScreen === 'explore' ? (
        <LuxeFooter
          onNavigate={handleNavigate}
          onOpenRFQModal={() => handleNavigate('post-rfq')}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onOpenAuthModal={handleOpenAuthModal}
        />
      ) : (
        <Footer
          onNavigate={handleNavigate}
          onOpenAuthModal={handleOpenAuthModal}
          onOpenRFQModal={() => handleNavigate('post-rfq')}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onOpenAuth={handleOpenAuthModal}
      />


      </div>
  );
}

export function App() {
  return (
    <SupabaseProvider>
      <NexoraShopApp />
    </SupabaseProvider>
  );
}
export default App;
