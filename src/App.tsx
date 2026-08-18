import React, { useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { HeroSection } from './components/HeroSection';
import { CategoryGrid } from './components/CategoryGrid';
import { TrendingCategories } from './components/TrendingCategories';
import { QuickRFQSection } from './components/QuickRFQSection';
import { MarketplaceColumns } from './components/MarketplaceColumns';
import { SponsoredImageAds } from './components/SponsoredImageAds';
import { SponsoredReelsSection } from './components/SponsoredReelsSection';
import { SponsoredFullVideoSection } from './components/SponsoredFullVideoSection';
import { OEMSpotlight } from './components/OEMSpotlight';
import { SellerGrowthSection } from './components/SellerGrowthSection';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DirectoryHubScreen } from './components/DirectoryHubScreen';
import { EnquiryModal } from './components/EnquiryModal';
import { AuthModal } from './components/AuthModal';
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
import { SampleRequestScreen } from './components/SampleRequestScreen';
import { PostRequirementScreen } from './components/PostRequirementScreen';
import { BuyerEnquiryLogScreen } from './components/BuyerEnquiryLogScreen';
import { EditProfileModal, BuyerProfileData } from './components/EditProfileModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ChatModalDrawer } from './components/ChatModalDrawer';
import { BuyerOnboardingScreen } from './components/BuyerOnboardingScreen';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import {
  CATEGORIES,
  TRENDING_PRODUCTS,
  VERIFIED_SUPPLIERS
} from './data/mockData';
import { RFQItem, DealProduct, TrendingProduct, VerifiedSupplier, SearchProduct } from './types';
import { CheckCircle2, Database } from 'lucide-react';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'explore' | 'directory' | 'supplier-directory' | 'plp' | 'product-detail' | 'search-results' | 'brands' | 'oem-hub' | 'supplier-profile' | 'onboarding' | 'buyer-onboarding' | 'supplier-portal' | 'supplier-verification' | 'buyer-dashboard' | 'buyer-profile' | 'rfq-tracking' | 'sample-request' | 'post-rfq' | 'buyer-enquiry-log'>('explore');
  const [selectedProductId, setSelectedProductId] = useState<string>('product_vitc_101');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('seller_aura_001');
  const [selectedLocation, setSelectedLocation] = useState('All');
  
  // Persistent Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const stored = localStorage.getItem('nexora_is_logged_in');
    return stored === null ? true : stored === 'true'; // Default to logged in as per prompt
  });

  const [userRole, setUserRole] = useState<'buyer' | 'supplier' | null>(() => {
    const stored = localStorage.getItem('nexora_user_role');
    return (stored as 'buyer' | 'supplier') || 'buyer';
  });

  // Persistent Buyer Profile State
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileData>(() => {
    const stored = localStorage.getItem('nexora_buyer_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return {
      fullName: 'Priya Sharma',
      businessName: 'Radiant Beauty Solutions',
      businessType: 'Salon / Spa Chain',
      designation: 'Head of Procurement',
      email: 'priya.procurement@radiantbeauty.in',
      phone: '+91 98201 54321',
      alternatePhone: '+91 22 2650 4321',
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
      isBusinessVerified: true
    };
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

  // Phase 4 Database Inspector Modal State
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  const handleOpenChat = (supplier?: { id: string; name: string; location: string; isVerified: boolean }, product?: { title: string; image: string; price?: string; moq?: string }) => {
    setChatInitialSupplier(supplier);
    setChatInitialProduct(product);
    setChatModalOpen(true);
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.setItem('nexora_is_logged_in', 'false');
    localStorage.removeItem('nexora_user_role');
    triggerToast('You have signed out successfully.');
  };

  const handleLoginSuccess = (role: 'buyer' | 'supplier', isNewUser?: boolean) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem('nexora_is_logged_in', 'true');
    localStorage.setItem('nexora_user_role', role);
    setIsAuthModalOpen(false);
    
    if (isNewUser) {
      if (role === 'buyer') {
        handleNavigate('buyer-onboarding');
      } else {
        handleNavigate('onboarding');
      }
      triggerToast(`Welcome to Nexora Luxe! Let's set up your ${role} profile.`);
    } else {
      triggerToast(`Welcome back! Logged in as ${role === 'buyer' ? 'Buyer' : 'Supplier'}.`);
      if (role === 'buyer') {
        handleNavigate('buyer-dashboard');
      } else {
        handleNavigate('supplier-portal');
      }
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
      const protectedScreens = [...supplierScreens, ...buyerScreens];
      if (protectedScreens.includes(screen)) {
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

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] flex flex-col font-sans selection:bg-[#fde7f3] selection:text-[#b90064] pb-16 md:pb-0">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Shared Top Navigation Bar */}
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
        {/* Screen 01: Homepage / Explore Hub */}
        {currentScreen === 'explore' && (
          <main className="flex-1">
            <HeroSection
              onSearch={(q, cat) => {
                handleSearchSubmit({ query: q, location: cat !== 'All Categories' ? cat : 'All' });
              }}
              onTabChange={(tab) => {
                if (tab === 'Suppliers') {
                  handleNavigate('supplier-directory');
                } else if (tab === 'Brands') {
                  handleNavigate('brands');
                } else if (tab === 'OEM') {
                  handleSearchSubmit({ query: 'OEM', location: 'All India' });
                } else {
                  handleNavigate('plp');
                }
              }}
            />
            
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col gap-6">
              {/* Trending Categories Section */}
              <TrendingCategories
                onCategoryClick={(catName) => {
                  if (catName === 'OEM / Private Label' || catName === 'Private Label' || catName === 'OEM') {
                    handleSearchSubmit({ query: 'OEM', location: 'All India' });
                  } else {
                    handleSearchSubmit({ query: catName, location: 'All India' });
                  }
                }}
                onViewAll={() => handleNavigate('plp')}
              />

              {/* Marketplace Discovery Blocks (Featured Suppliers & Trending Sourcing) */}
              <MarketplaceColumns
                onSupplierClick={(id) => handleNavigate('supplier-profile', { supplierId: id })}
                onProductClick={(id) => handleNavigate('product-detail', { productId: id })}
                onEnquiryClick={(data) => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: data.title,
                    supplierName: data.supplier,
                    type: data.type === 'supplier' ? 'supplier' : 'product',
                  });
                }}
                onViewAllSuppliers={() => handleNavigate('supplier-directory')}
                onViewAllProducts={() => handleNavigate('plp')}
              />

              {/* Sponsored Beauty Showcase (10 Sponsored Image Ads Marquee) */}
              <SponsoredImageAds
                onProductClick={(ad) => {
                  handleNavigate('product-detail', { productId: ad.product_id, supplierId: ad.seller_id });
                }}
                onSupplierClick={(supplierId) => {
                  handleNavigate('supplier-profile', { supplierId });
                }}
                onOpenAdManager={() => handleNavigate('supplier-portal')}
                onOpenChat={handleOpenChat}
              />

              {/* Reels & Shorts (5 Sponsored 9:16 Video Ads) */}
              <SponsoredReelsSection
                onOpenAdManager={() => handleNavigate('supplier-portal')}
                onViewProduct={(productId, sellerId) => {
                  handleNavigate('product-detail', { productId, supplierId: sellerId });
                }}
                onViewSupplier={(sellerId) => {
                  handleNavigate('supplier-profile', { supplierId: sellerId });
                }}
                onEnquire={(productId, sellerId, supplierName) => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: 'Enquiry for ' + supplierName,
                    supplierName,
                    type: productId ? 'product' : 'supplier',
                  });
                }}
              />

              {/* Full Video Ads (5 Sponsored 16:9 Video Ads) */}
              <SponsoredFullVideoSection
                onOpenAdManager={() => handleNavigate('supplier-portal')}
                onViewProduct={(productId, sellerId) => {
                  handleNavigate('product-detail', { productId, supplierId: sellerId });
                }}
                onViewSupplier={(sellerId) => {
                  handleNavigate('supplier-profile', { supplierId: sellerId });
                }}
                onEnquire={(productId, sellerId, supplierName) => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: 'Enquiry for ' + supplierName,
                    supplierName,
                    type: productId ? 'product' : 'supplier',
                  });
                }}
              />

              {/* OEM / Private Label Spotlight */}
              <OEMSpotlight
                onExploreSolutions={() => handleNavigate('plp')}
                onPostRequirement={() => handleNavigate('post-rfq')}
              />

              {/* Seller / Supplier Growth Block */}
              <SellerGrowthSection
                onJoinSupplier={() => handleNavigate('onboarding')}
                onSupplierLogin={() => handleOpenAuthModal('login')}
              />
            </div>
          </main>
        )}

        {/* Screen 03: Product Listing Page (PLP) */}
        {currentScreen === 'plp' && (
          <main className="flex-1">
            <ProductListingScreen
              isLoggedIn={isLoggedIn}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={() => {}}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSearch={handleNavigate}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenProductComparison={() => {}}
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
              initialQuery={searchParams.query}
              initialCategory={searchParams.category}
              initialLocation={searchParams.location}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={() => {}}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onNavigate={handleNavigate}
            />
          </main>
        )}

        {/* Screen 04: Product Detail Page */}
        {currentScreen === 'product-detail' && (
          <main className="flex-1">
            <ProductDetailPage
              productId={selectedProductId}
              onBack={() => handleNavigate('explore')}
              onOpenEnquiryModal={(item) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title: item.name,
                  supplierName: item.supplierName,
                  type: 'product'
                });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToSampleRequest={() => handleNavigate('sample-request')}
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
              onOpenQuoteModal={() => {}}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
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
              onOpenFacilityTour={() => {}}
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
              onOpenFacilityTour={() => {}}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}

        {/* Phase A: Buyer Onboarding Flow */}
        {currentScreen === 'buyer-onboarding' && (
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
        )}

        {/* Phase B: Supplier Onboarding Flow */}
        {currentScreen === 'onboarding' && (
          <main className="flex-1">
            <SupplierOnboardingScreen
              onComplete={() => {
                triggerToast('Business listing created! Redirecting to Portal...');
                handleNavigate('supplier-portal');
              }}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}

        {/* Phase B: Supplier Admin Portal */}
        {currentScreen === 'supplier-portal' && (
          <main className="flex-1">
            <SupplierAdminPortal 
              onNavigateToProduct={(productId) => {
                setSelectedProductId(productId);
                handleNavigate('product-detail', { productId });
              }}
            />
          </main>
        )}

        {/* Screen 24: Supplier Verification Center */}
        {currentScreen === 'supplier-verification' && (
          <main className="flex-1">
            <SupplierVerificationScreen 
              onBack={() => handleNavigate('supplier-portal')}
            />
          </main>
        )}

        {/* Screen 12: Buyer Dashboard */}
        {currentScreen === 'buyer-dashboard' && (
          <main className="flex-1">
            <BuyerDashboard 
              isLoggedIn={isLoggedIn}
              onNavigate={handleNavigate}
              onPostRFQ={() => handleNavigate('post-rfq')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
              buyerProfile={buyerProfile}
              onSaveProfile={handleSaveProfile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              initialTab={buyerDashboardTab}
              isProfileRoute={false}
              currentScreen={currentScreen}
            />
          </main>
        )}

        {/* Specific /buyer/profile Route View */}
        {currentScreen === 'buyer-profile' && (
          <main className="flex-1">
            <BuyerDashboard 
              isLoggedIn={isLoggedIn}
              onNavigate={handleNavigate}
              onPostRFQ={() => handleNavigate('post-rfq')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
              buyerProfile={buyerProfile}
              onSaveProfile={handleSaveProfile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              initialTab="activity"
              isProfileRoute={true}
              currentScreen={currentScreen}
            />
          </main>
        )}

        {/* Screen 13: Buyer RFQ Tracking & Quote Comparison */}
        {currentScreen === 'rfq-tracking' && (
          <main className="flex-1">
            <BuyerRFQTrackingScreen
              onBack={() => handleNavigate('buyer-dashboard')}
              onNavigateToChat={(supplierIdOrName) => {
                const supp = VERIFIED_SUPPLIERS.find(s => 
                  s.name.toLowerCase().includes(supplierIdOrName.toLowerCase()) || 
                  s.id === supplierIdOrName
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
        )}

        {/* Sample Request Screen */}
        {currentScreen === 'sample-request' && (
          <main className="flex-1">
            <SampleRequestScreen 
              onBack={() => handleNavigate('search-results')}
              onSubmit={(data) => {
                console.log('Sample Request Submitted:', data);
                handleNavigate('buyer-dashboard');
              }}
            />
          </main>
        )}

        {/* Screen 10: Post Requirement / Public RFQ Form */}
        {currentScreen === 'post-rfq' && (
          <main className="flex-1">
            <PostRequirementScreen
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToRFQs={() => handleNavigate('rfq-tracking')}
            />
          </main>
        )}

        {/* Screen 14: Buyer Enquiry Log */}
        {currentScreen === 'buyer-enquiry-log' && (
          <main className="flex-1">
            <BuyerEnquiryLogScreen
              onBack={() => handleNavigate('buyer-dashboard')}
              onNavigateToChat={(supplierName) => handleOpenChat({ id: 'supp_custom', name: supplierName, location: 'All India', isVerified: true })}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
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

      <DatabaseStatusModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onNavigateToScreen={(screen) => handleNavigate(screen)}
      />

      {/* Shared Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenRFQModal={() => handleNavigate('post-rfq')}
      />

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
        title="Phase 4 Relational Database Inspector (8 Entities & Live Event Engine)"
        onClick={() => setIsDatabaseModalOpen(prev => !prev)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-[#1C1B1B] hover:bg-[#B90064] text-white py-2.5 px-3.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer border border-white/20 group"
      >
        <div className="relative">
          <Database className="w-4 h-4 text-[#FDE7F3] group-hover:text-white" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="hidden sm:inline">DB Inspector</span>
        <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">8 Tables</span>
      </button>

    </div>
  );
}
export default App;
