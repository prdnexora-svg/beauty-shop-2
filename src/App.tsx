import React, { useEffect, useState } from 'react';
import { PublicLanding } from './components/screens/PublicLanding';
import { ScreenLoader } from './components/screens/ScreenLoader';
import { ScreenRouter } from './components/screens/ScreenRouter';
import { PROTECTED_SCREENS } from './components/screens/types';
import type { AppScreenContext } from './components/screens/types';

// Diagnostics panel: 1,328 lines behind a floating button, so it stays
// out of the entry chunk.
const DatabaseStatusModal = lazy(
  () => import('./components/DatabaseStatusModal').then((m) => ({ default: m.DatabaseStatusModal })),
);
import { lazy, Suspense } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { LuxeFooter } from './components/luxe/LuxeFooter';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Breadcrumbs } from './components/Breadcrumbs';
import { LuxeHeader } from './components/luxe/LuxeHeader';
import { LiveChatWidget } from './components/LiveChatWidget';
import { EnquiryModal } from './components/EnquiryModal';
import { AuthModal } from './components/AuthModal';
import { ProductCompareModal } from './components/ProductCompareModal';
import { QuoteModal } from './components/QuoteModal';
import { SupplierProfileScreen } from './components/SupplierProfileScreen';
import { EditProfileModal, BuyerProfileData } from './components/EditProfileModal';
import { ChatModalDrawer } from './components/ChatModalDrawer';
import { getBuyerProfile, BUYER_PROFILES_DB } from './data/buyerProfilesData';
import {
  clearDemoOwner,
  ensureDemoOwner,
} from './hooks/useMediaOwner';
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
import {
  CATEGORIES,
  TRENDING_PRODUCTS,
  VERIFIED_SUPPLIERS
} from './data/mockData';
import { RFQItem, DealProduct, TrendingProduct, VerifiedSupplier, SearchProduct } from './types';
import { CheckCircle2, Database } from 'lucide-react';

function NexoraShopApp() {
  const {
    isConfigured,
    authReady,
    session,
    user,
    locationSyncStatus,
    signOut,
  } = useSupabase();

  const [currentScreen, setCurrentScreen] = useState<'explore' | 'directory' | 'supplier-directory' | 'plp' | 'product-detail' | 'search-results' | 'brands' | 'oem-hub' | 'supplier-profile' | 'onboarding' | 'buyer-onboarding' | 'supplier-portal' | 'supplier-verification' | 'buyer-dashboard' | 'buyer-profile' | 'rfq-tracking' | 'sample-request' | 'post-rfq' | 'buyer-enquiry-log'>('explore');
  const [selectedProductId, setSelectedProductId] = useState<string>('product_vitc_101');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('seller_aura_001');
  const [selectedLocation, setSelectedLocation] = useState('All');
  
  // Persistent Auth State (synced from the single Supabase auth session when a
  // real Supabase project is configured; local demo storage is only a fallback).
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (isConfigured) return false;
    const stored = localStorage.getItem('nexora_is_logged_in');
    return stored === 'true';
  });

  const [userRole, setUserRole] = useState<'buyer' | 'supplier' | null>(() => {
    if (isConfigured) return null;
    const stored = localStorage.getItem('nexora_user_role');
    return (stored === 'buyer' || stored === 'supplier') ? stored : null;
  });

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

  // Phase 4 Database Inspector Modal State
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

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
    setChatInitialSupplier(supplier);
    setChatInitialProduct(product);
    setChatModalOpen(true);
  };

  // ---- Handlers for the sponsored ad surfaces -----------------------------
  // These were built but never mounted, so the props below were dead ends.
  const handleViewProduct = (productId: string, sellerId?: string) => {
    handleNavigate('product-detail', { productId, ...(sellerId ? { supplierId: sellerId } : {}) });
  };

  const handleViewSupplier = (sellerId: string) => {
    handleNavigate('supplier-profile', { supplierId: sellerId });
  };

  const handleSponsoredEnquire = (
    productId: string | undefined,
    sellerId: string,
    supplierName: string,
  ) => {
    handleOpenEnquiry({
      id: 'enq-' + Date.now(),
      title: 'Enquiry for ' + (supplierName || sellerId),
      supplierName: supplierName || sellerId,
      type: 'supplier',
      ...(productId ? { productId } : {}),
      sellerId,
    });
  };

  // Public "advertise here" affordances land in the supplier portal, where
  // SponsoredAdManager already lives. Guests are sent to sign in first.
  const handleOpenAdManager = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      triggerToast('Please sign in to manage sponsored campaigns.');
      return;
    }
    if (userRole === 'buyer') {
      triggerToast('Sponsored campaigns are available to supplier accounts.');
      return;
    }
    handleNavigate('supplier-portal');
  };

  // Interactive Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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
    // Drop the local demo media owner so the next account cannot delete or
    // replace media uploaded by the previous one.
    clearDemoOwner();
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
    // In demo mode (no Supabase project) uploads still need a stable owner id
    // so the storage path convention and delete/replace flows behave like real.
    ensureDemoOwner();
    
    if (isNewUser) {
      const target = role === 'buyer' ? 'buyer-onboarding' : 'onboarding';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome to Nexora Luxe! Let's set up your ${role} profile.`);
    } else {
      const target = role === 'buyer' ? 'buyer-dashboard' : 'supplier-portal';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome back! Logged in as ${role === 'buyer' ? 'Buyer' : 'Supplier'}.`);
    }
  };

  // Handlers
  const handleNavigate = (screen: any, params?: any) => {
    // 1. Define restricted list
    const supplierScreens = ['supplier-portal', 'supplier-verification', 'onboarding'];
    const buyerScreens = ['buyer-dashboard', 'buyer-profile', 'rfq-tracking', 'buyer-enquiry-log', 'post-rfq', 'sample-request', 'buyer-onboarding'];

    // 2. Perform Role Guard check
    if (isLoggedIn) {
      if (userRole === 'buyer' && supplierScreens.includes(screen)) {
        triggerToast('Access Restricted: Buyer accounts cannot access the Supplier Portal.');
        setCurrentScreen('buyer-dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (userRole === 'supplier' && buyerScreens.includes(screen)) {
        triggerToast('Access Restricted: Supplier accounts cannot access the Buyer Workspace.');
        setCurrentScreen('supplier-portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else {
      // If guest tries to access protected dashboard features, open login
      if ([...supplierScreens, ...buyerScreens].includes(screen)) {
        setAuthMode('login');
        setIsAuthModalOpen(true);
        triggerToast('Please sign in to access dashboard workspace features.');
        return;
      }
    }

    setCurrentScreen(screen);
    if ((screen === 'buyer-dashboard' || screen === 'buyer-profile') && params?.tab) {
      setBuyerDashboardTab(params.tab);
    }
    if (params) {
      if (params.productId) {
        setSelectedProductId(params.productId);
      }
      if (params.supplierId) {
        setSelectedSupplierId(params.supplierId);
      }
      if (params.buyerId || (screen === 'buyer-profile' && (params.memberData || params.buyerId))) {
        const found = getBuyerProfile(params.buyerId || params.memberData?.profileId || params.memberData?.id || params.memberData?.name);
        if (found) {
          setBuyerProfile({ ...found });
        } else if (params.memberData) {
          const m = params.memberData;
          const cleanName = m.name.replace(/\s*\(.*?\)\s*/g, '').trim();
          const bizName = m.name.match(/\((.*?)\)/)?.[1] || `${cleanName} Enterprises`;
          setBuyerProfile(prev => ({
            ...prev,
            fullName: cleanName,
            businessName: bizName,
            businessType: m.businessType || prev.businessType,
            avatarUrl: m.avatar,
            city: m.city || prev.city,
            state: m.state || prev.state,
            isGstVerified: m.isGstVerified,
            followersCount: m.followersCount || prev.followersCount
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

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
    }
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

    const supplier = VERIFIED_SUPPLIERS.find(s => s.name === supplierName);
    const phone = supplier?.phone || '+919820155443';
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
    const whatsapp = supplier?.whatsapp || '919820155443'; // Default if not found
    const nameToUse = supplierName || supplier?.name || 'Supplier';
    const message = encodeURIComponent(`Hello ${nameToUse}, I found your business on Nexora Luxe and I am interested in your products. Can we discuss a potential enquiry?`);
    
    // Direct WhatsApp redirect
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
    triggerToast(`Opening direct WhatsApp channel with ${nameToUse}`);
  };

  const handleSearchSubmit = (params: any) => {
    setSearchParams({
      query: params.query || '',
      category: params.category !== 'All Categories' ? params.category : 'All',
      location: params.location !== 'Any Location' ? params.location : 'All India',
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

  // Derive the Supabase user's role (stored in auth metadata at registration).
  const supabaseRole = (user?.user_metadata?.role as 'buyer' | 'supplier') || null;
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

  // Demo / local mode fallback keeps the existing offline preview working.
  useEffect(() => {
    if (isConfigured) return;
    const stored = localStorage.getItem('nexora_is_logged_in');
    const storedRole = localStorage.getItem('nexora_user_role');
    setIsLoggedIn(stored === 'true');
    setUserRole(storedRole === 'buyer' || storedRole === 'supplier' ? storedRole : null);
  }, [isConfigured]);

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

  // Shared with the screen router so a new owner route is guarded automatically.
  const isProtectedScreen = PROTECTED_SCREENS.includes(currentScreen);

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
          window.history.replaceState({}, '', '/');
        }}
        onSuccess={(role, isNewUser) => {
          handleLoginSuccess(role, isNewUser);
          window.history.replaceState({}, '', '/');
        }}
      />
    );
  }

  // Everything the extracted screens need. Grouped into one object so the
  // public landing, the public marketplace and the owner workspace each take a
  // single prop instead of twenty.
  const ctx: AppScreenContext = {
    currentScreen,
    isLoggedIn,
    userRole,
    buyerProfile,
    buyerDashboardTab,
    searchParams,
    selectedProductId,
    selectedSupplierId,
    handleNavigate,
    handleOpenAuthModal,
    handleOpenEnquiry,
    handleOpenChat,
    handleOpenQuoteModal,
    handleOpenProductComparison,
    handleRemoveFromComparison,
    setIsEditProfileOpen,
    setSelectedProductId,
    handleSearchSubmit,
    handleViewProduct,
    handleViewSupplier,
    handleSponsoredEnquire,
    handleOpenAdManager,
    handleCallSupplier,
    handleWhatsAppSupplier,
    handleFacilityTour,
    handleSaveProfile,
    triggerToast,
  };

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
            productName: currentScreen === 'product-detail' ? TRENDING_PRODUCTS.find(p => p.id === selectedProductId)?.title : undefined,
            supplierName: currentScreen === 'supplier-profile' ? VERIFIED_SUPPLIERS.find(s => s.id === (selectedSupplierId || searchParams.supplierId))?.name : undefined
          }}
        />
        <PublicLanding {...ctx} />

        <ScreenRouter ctx={ctx} />
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

      {/* Sourcing assistant launcher — floats above every screen. */}
      <LiveChatWidget
        onOpenRFQModal={() => handleNavigate('post-rfq')}
        onOpenEnquiryModal={handleOpenEnquiry}
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

      <Suspense fallback={null}>
        <DatabaseStatusModal
          isOpen={isDatabaseModalOpen}
          onClose={() => setIsDatabaseModalOpen(false)}
          onNavigateToScreen={(screen) => handleNavigate(screen)}
        />
      </Suspense>

      {/* Shared Footer — Luxe edition on the homepage */}
      {currentScreen === 'explore' ? (
        <LuxeFooter
          onNavigate={handleNavigate}
          onOpenRFQModal={() => handleNavigate('post-rfq')}
        />
      ) : (
        <Footer
          onNavigate={handleNavigate}
          onOpenAuthModal={handleOpenAuthModal}
          onOpenRFQModal={() => handleNavigate('post-rfq')}
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

      {/* Floating Action Button (FAB) for Phase 4 Relational Database Inspector */}
      <button
        id="fab-db-inspector"
        aria-label="Toggle Phase 4 Database Schema & Live Engine Inspector"
        title={isLoggedIn && locationSyncStatus === 'synced'
          ? 'Phase 4 Relational Database Inspector & Live Location Synced'
          : 'Phase 4 Relational Database Inspector (8 Entities & Live Event Engine)'}
        onClick={() => setIsDatabaseModalOpen(prev => !prev)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-[#2A0E3F] hover:bg-[#6B2D8C] text-white py-2.5 px-3.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer border border-white/20 group"
      >
        <div className="relative">
          <Database className="w-4 h-4 text-[#F5EEF8] group-hover:text-white" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="hidden sm:inline">DB Inspector</span>
        <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">8 Tables</span>
      </button>

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
