import React, { useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { HeroSection } from './components/HeroSection';
import { TrustStrip } from './components/TrustStrip';
import { LiveSourcingRequests } from './components/LiveSourcingRequests';
import { CategoryGrid } from './components/CategoryGrid';
import { FeaturedDeals } from './components/FeaturedDeals';
import { TrendingProducts } from './components/TrendingProducts';
import { VerifiedSuppliersSection } from './components/VerifiedSuppliersSection';
import { Footer } from './components/Footer';
import { RFQModal } from './components/RFQModal';
import { EnquiryModal } from './components/EnquiryModal';
import { QuoteModal } from './components/QuoteModal';
import { AuthModal } from './components/AuthModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { SearchFilterScreen } from './components/SearchFilterScreen';
import { ProductListingScreen } from './components/ProductListingScreen';
import { SupplierDirectoryScreen } from './components/SupplierDirectoryScreen';
import { SupplierProfileScreen } from './components/SupplierProfileScreen';
import { BrandDirectoryDetailScreen } from './components/BrandDirectoryDetailScreen';
import { SourcingTrendsDashboard } from './components/SourcingTrendsDashboard';
import { SavedSuppliersSection } from './components/SavedSuppliersSection';
import { SupplierComparisonModal } from './components/SupplierComparisonModal';
import { ProductCompareModal } from './components/ProductCompareModal';
import { SupplierMapModal } from './components/SupplierMapModal';
import { VirtualFacilityTourModal } from './components/VirtualFacilityTourModal';
import { useSavedSuppliers } from './hooks/useSavedSuppliers';

import {
  CATEGORIES,
  LIVE_RFQS,
  FEATURED_DEALS,
  TRENDING_PRODUCTS,
  VERIFIED_SUPPLIERS,
  SEARCH_PRODUCTS
} from './data/mockData';
import { RFQItem, DealProduct, TrendingProduct, VerifiedSupplier, SearchProduct } from './types';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'explore' | 'search' | 'plp' | 'suppliers' | 'supplier-profile' | 'brands'>('explore');
  const [selectedLocation, setSelectedLocation] = useState('All');
  
  // Search parameters for Screen 02
  const [searchParams, setSearchParams] = useState({
    query: 'Professional Hair Serum',
    category: 'Haircare',
    location: 'Mumbai, Maharashtra (+50 km)',
    tab: 'products' as 'products' | 'suppliers' | 'oem'
  });
  
  // Modals state
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [targetEnquiryItem, setTargetEnquiryItem] = useState<any | null>(null);
  
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [targetQuoteRFQ, setTargetQuoteRFQ] = useState<RFQItem | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Interactive Logistics Map Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [targetMapSupplier, setTargetMapSupplier] = useState<any | null>(null);

  // Virtual Facility Tour Video Modal State
  const [isFacilityTourModalOpen, setIsFacilityTourModalOpen] = useState(false);
  const [targetFacilitySupplier, setTargetFacilitySupplier] = useState<VerifiedSupplier | null>(null);

  const handleOpenFacilityTour = (supplier?: VerifiedSupplier) => {
    setTargetFacilitySupplier(supplier || VERIFIED_SUPPLIERS[0]);
    setIsFacilityTourModalOpen(true);
  };

  // Product Spec Comparison Modal State
  const [isProductCompareModalOpen, setIsProductCompareModalOpen] = useState(false);
  const [comparedProductsList, setComparedProductsList] = useState<SearchProduct[]>([
    SEARCH_PRODUCTS[0],
    SEARCH_PRODUCTS[1]
  ]);

  // Interactive Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavedPulsing, setIsSavedPulsing] = useState(false);

  // Local Storage Saved Suppliers Hook
  const {
    savedSuppliersList,
    savedCount,
    toggleSaveSupplier,
    isSupplierSaved,
    clearAllSavedSuppliers
  } = useSavedSuppliers();

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleSaveSupplier = (supplierId: string, supplierName?: string) => {
    const isNowSaved = toggleSaveSupplier(supplierId, supplierName);
    if (isNowSaved) {
      triggerToast(`Saved ${supplierName || 'supplier'} to My Saved list`);
      setIsSavedPulsing(true);
      setTimeout(() => {
        setIsSavedPulsing(false);
      }, 1400);
    } else {
      triggerToast(`Removed ${supplierName || 'supplier'} from My Saved list`);
    }
  };

  const handleScrollToSaved = () => {
    if (currentScreen !== 'explore') {
      setCurrentScreen('explore');
    }
    setTimeout(() => {
      const el = document.getElementById('my-saved-suppliers');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Side-by-Side Supplier Comparison state (Max 3)
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>(['sup-1', 'sup-2']);

  const handleToggleComparison = (supplier: VerifiedSupplier) => {
    if (selectedComparisonIds.includes(supplier.id)) {
      setSelectedComparisonIds((prev) => prev.filter((id) => id !== supplier.id));
      triggerToast(`Removed ${supplier.name} from comparison`);
    } else {
      if (selectedComparisonIds.length >= 3) {
        triggerToast('You can compare up to 3 suppliers at a time. Remove one to add another.');
        return;
      }
      setSelectedComparisonIds((prev) => [...prev, supplier.id]);
      triggerToast(`Added ${supplier.name} to comparison (${selectedComparisonIds.length + 1}/3)`);
    }
  };

  const handleAddComparisonSupplier = (supplier: VerifiedSupplier) => {
    if (selectedComparisonIds.includes(supplier.id)) return;
    if (selectedComparisonIds.length >= 3) {
      triggerToast('Maximum 3 suppliers can be compared simultaneously.');
      return;
    }
    setSelectedComparisonIds((prev) => [...prev, supplier.id]);
  };

  const handleRemoveComparisonSupplier = (supplierId: string) => {
    setSelectedComparisonIds((prev) => prev.filter((id) => id !== supplierId));
  };

  const handleClearComparison = () => {
    setSelectedComparisonIds([]);
    triggerToast('Cleared comparison list');
  };

  const handleOpenComparisonModal = () => {
    if (selectedComparisonIds.length === 0 && VERIFIED_SUPPLIERS.length >= 2) {
      // Auto pre-select top 2 suppliers if none selected yet for immediate utility
      setSelectedComparisonIds([VERIFIED_SUPPLIERS[0].id, VERIFIED_SUPPLIERS[1].id]);
    }
    setIsComparisonModalOpen(true);
  };

  const comparedSuppliersList = VERIFIED_SUPPLIERS.filter((s) =>
    selectedComparisonIds.includes(s.id)
  );

  // Handlers
  const handleNavigate = (screen: 'explore' | 'search' | 'plp' | 'suppliers' | 'supplier-profile' | 'brands', params?: any) => {
    setCurrentScreen(screen);
    if (params) {
      setSearchParams((prev) => ({
        ...prev,
        ...params
      }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRFQModal = () => {
    setIsRFQModalOpen(true);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenEnquiry = (item: any) => {
    setTargetEnquiryItem(item);
    setIsEnquiryModalOpen(true);
  };

  const handleSubmitQuote = (rfq: RFQItem) => {
    setTargetQuoteRFQ(rfq);
    setIsQuoteModalOpen(true);
  };

  const handleCallSupplier = (supplierName: string) => {
    triggerToast(`Connecting call to verified supplier: ${supplierName}`);
  };

  const handleWhatsAppSupplier = (supplierName: string) => {
    triggerToast(`Initiating direct B2B WhatsApp channel with: ${supplierName}`);
  };

  const handleSearchSubmit = (params: any) => {
    setSearchParams({
      query: params.query || '',
      category: params.category !== 'All Categories' ? params.category : 'All',
      location: params.location !== 'Any Location' ? params.location : 'All India',
      tab: params.scope || 'products'
    });
    setCurrentScreen('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryName: string) => {
    if (categoryName.toLowerCase().includes('hair')) {
      setCurrentScreen('plp');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSearchParams({
      query: '',
      category: categoryName,
      location: 'All India',
      tab: categoryName.includes('OEM') ? 'oem' : 'products'
    });
    setCurrentScreen('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    if (tag.toLowerCase().includes('hair') || tag.toLowerCase().includes('serum')) {
      setCurrentScreen('plp');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSearchParams((prev) => ({
      ...prev,
      query: tag,
      tab: 'products'
    }));
    setCurrentScreen('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProductComparison = (products: SearchProduct[]) => {
    setComparedProductsList(products);
    setIsProductCompareModalOpen(true);
  };

  const handleRemoveProductFromComparison = (productId: string) => {
    setComparedProductsList((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] flex flex-col font-sans selection:bg-[#fde7f3] selection:text-[#b90064]">
      
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
        onOpenRFQModal={handleOpenRFQModal}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        onOpenAuthModal={handleOpenAuthModal}
        savedSuppliersCount={savedCount}
        isSavedPulsing={isSavedPulsing}
        onScrollToSaved={handleScrollToSaved}
      />

      {/* Screen 01: Homepage / Explore Hub */}
      {currentScreen === 'explore' && (
        <main className="flex-1">
          {/* Hero Section with Search and Advanced Filters */}
          <HeroSection
            onOpenRFQModal={handleOpenRFQModal}
            onSearchSubmit={handleSearchSubmit}
            onTagClick={handleTagClick}
          />

          {/* 4 Pillars Trust Strip */}
          <TrustStrip />

          {/* Dedicated 'My Saved' Suppliers Section */}
          <SavedSuppliersSection
            savedSuppliers={savedSuppliersList}
            onToggleSave={handleToggleSaveSupplier}
            onClearAll={() => {
              clearAllSavedSuppliers();
              triggerToast('Cleared all saved suppliers');
            }}
            onOpenEnquiry={handleOpenEnquiry}
            onOpenMapModal={(supplier) => {
              setTargetMapSupplier(supplier);
              setIsMapModalOpen(true);
            }}
            onCallSupplier={handleCallSupplier}
            onWhatsAppSupplier={handleWhatsAppSupplier}
            onExploreMore={() => {
              const el = document.getElementById('suppliers');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Live Sourcing Requests (RFQ Ticker) */}
          <LiveSourcingRequests
            rfqs={LIVE_RFQS}
            onSubmitQuote={handleSubmitQuote}
            onOpenRFQModal={handleOpenRFQModal}
          />

          {/* 12-Segment Category Grid */}
          <CategoryGrid
            categories={CATEGORIES}
            onSelectCategory={handleCategorySelect}
          />

          {/* 6-Month Sourcing Trends & Category Demand Dashboard */}
          <SourcingTrendsDashboard
            onOpenRFQModal={handleOpenRFQModal}
            onNavigateToCategory={handleCategorySelect}
          />

          {/* Featured B2B Deals */}
          <FeaturedDeals
            deals={FEATURED_DEALS}
            onOpenEnquiry={handleOpenEnquiry}
            onCallSupplier={handleCallSupplier}
            onWhatsAppSupplier={handleWhatsAppSupplier}
          />

          {/* Trending B2B Products */}
          <TrendingProducts
            products={TRENDING_PRODUCTS}
            onOpenEnquiry={handleOpenEnquiry}
            onCallSupplier={handleCallSupplier}
            onWhatsAppSupplier={handleWhatsAppSupplier}
            onNavigateToPLP={() => handleNavigate('plp')}
          />

          {/* Verified Manufacturing Partners */}
          <VerifiedSuppliersSection
            suppliers={VERIFIED_SUPPLIERS}
            isSaved={isSupplierSaved}
            onToggleSave={handleToggleSaveSupplier}
            selectedComparisonIds={selectedComparisonIds}
            onToggleComparison={handleToggleComparison}
            onOpenComparisonModal={handleOpenComparisonModal}
            onClearComparison={handleClearComparison}
            onOpenEnquiry={handleOpenEnquiry}
            onOpenMapModal={(supplier) => {
              setTargetMapSupplier(supplier);
              setIsMapModalOpen(true);
            }}
            onOpenFacilityTour={handleOpenFacilityTour}
            onCallSupplier={handleCallSupplier}
            onWhatsAppSupplier={handleWhatsAppSupplier}
          />
        </main>
      )}

      {/* Screen 02: Global Search & Filter Results */}
      {currentScreen === 'search' && (
        <main className="flex-1">
          <SearchFilterScreen
            initialQuery={searchParams.query}
            initialCategory={searchParams.category}
            initialLocation={searchParams.location}
            isSupplierSaved={isSupplierSaved}
            onToggleSaveSupplier={handleToggleSaveSupplier}
            onOpenEnquiryModal={handleOpenEnquiry}
            onOpenQuoteModal={handleSubmitQuote}
            onOpenRFQModal={handleOpenRFQModal}
            onOpenMapModal={(supplier) => {
              setTargetMapSupplier(supplier);
              setIsMapModalOpen(true);
            }}
            onNavigateToExplore={() => handleNavigate('explore')}
          />
        </main>
      )}

      {/* Screen 03: Product Listing Page (PLP) */}
      {currentScreen === 'plp' && (
        <main className="flex-1">
          <ProductListingScreen
            onOpenEnquiryModal={handleOpenEnquiry}
            onOpenQuoteModal={handleSubmitQuote}
            onOpenRFQModal={handleOpenRFQModal}
            onNavigateToExplore={() => handleNavigate('explore')}
            onNavigateToSearch={handleNavigate}
            onOpenProductComparison={handleOpenProductComparison}
          />
        </main>
      )}

      {/* Screen 06: Supplier Directory */}
      {currentScreen === 'suppliers' && (
        <main className="flex-1">
          <SupplierDirectoryScreen
            isSupplierSaved={isSupplierSaved}
            onToggleSaveSupplier={handleToggleSaveSupplier}
            onOpenEnquiryModal={handleOpenEnquiry}
            onOpenQuoteModal={handleSubmitQuote}
            onOpenRFQModal={handleOpenRFQModal}
            onOpenMapModal={(supplier) => {
              setTargetMapSupplier(supplier);
              setIsMapModalOpen(true);
            }}
            onOpenFacilityTour={handleOpenFacilityTour}
            onNavigateToExplore={() => handleNavigate('explore')}
            onOpenComparisonModal={handleOpenComparisonModal}
          />
        </main>
      )}

      {/* Screen 07: Supplier Profile Page */}
      {currentScreen === 'supplier-profile' && (
        <main className="flex-1">
          <SupplierProfileScreen
            onOpenEnquiryModal={handleOpenEnquiry}
            onOpenQuoteModal={handleSubmitQuote}
            onOpenRFQModal={handleOpenRFQModal}
            onOpenFacilityTour={handleOpenFacilityTour}
            onNavigateToDirectory={() => handleNavigate('suppliers')}
          />
        </main>
      )}

      {/* Screen 08: Brand Directory & Brand Detail */}
      {currentScreen === 'brands' && (
        <main className="flex-1">
          <BrandDirectoryDetailScreen
            onOpenEnquiryModal={handleOpenEnquiry}
            onOpenRFQModal={handleOpenRFQModal}
            onOpenFacilityTour={handleOpenFacilityTour}
            onNavigateToSuppliers={() => handleNavigate('suppliers')}
          />
        </main>
      )}

      {/* Shared Footer */}
      <Footer
        onOpenRFQModal={handleOpenRFQModal}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Screen 01 & Screen 03 Interactive Modals */}
      <RFQModal
        isOpen={isRFQModalOpen}
        onClose={() => setIsRFQModalOpen(false)}
      />

      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => {
          setIsEnquiryModalOpen(false);
          setTargetEnquiryItem(null);
        }}
        targetItem={targetEnquiryItem}
        onCallSupplier={handleCallSupplier}
        onWhatsAppSupplier={handleWhatsAppSupplier}
        onNavigateToDashboard={() => {
          setIsEnquiryModalOpen(false);
          setCurrentScreen('search');
          triggerToast('Navigated to Workspace & Enquiry Tracking');
        }}
      />

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setTargetQuoteRFQ(null);
        }}
        rfq={targetQuoteRFQ}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Side-by-Side Supplier Comparison Modal */}
      <SupplierComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        selectedSuppliers={comparedSuppliersList}
        allSuppliers={VERIFIED_SUPPLIERS}
        onAddSupplier={handleAddComparisonSupplier}
        onRemoveSupplier={handleRemoveComparisonSupplier}
        onClearAll={handleClearComparison}
        onOpenEnquiry={(sup) => {
          setIsComparisonModalOpen(false);
          handleOpenEnquiry(sup);
        }}
        onCallSupplier={handleCallSupplier}
        onWhatsAppSupplier={handleWhatsAppSupplier}
      />

      {/* Side-by-Side Product Spec Comparison Modal */}
      <ProductCompareModal
        isOpen={isProductCompareModalOpen}
        onClose={() => setIsProductCompareModalOpen(false)}
        products={comparedProductsList}
        onRemoveProduct={handleRemoveProductFromComparison}
        onOpenEnquiry={(prod) => {
          setIsProductCompareModalOpen(false);
          handleOpenEnquiry(prod);
        }}
      />

      {/* Interactive Supplier Location & Logistics Proximity Map Modal */}
      <SupplierMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setTargetMapSupplier(null);
        }}
        supplier={targetMapSupplier}
        onOpenEnquiry={(sup) => {
          setIsMapModalOpen(false);
          handleOpenEnquiry(sup);
        }}
      />

      {/* 15-Second Virtual Facility Tour Video Modal */}
      <VirtualFacilityTourModal
        isOpen={isFacilityTourModalOpen}
        onClose={() => {
          setIsFacilityTourModalOpen(false);
          setTargetFacilitySupplier(null);
        }}
        supplier={targetFacilitySupplier}
        onOpenEnquiryModal={handleOpenEnquiry}
      />

      {/* Floating Live Chat & Sourcing AI Assistant */}
      <LiveChatWidget
        onOpenRFQModal={handleOpenRFQModal}
        onOpenEnquiryModal={handleOpenEnquiry}
      />

    </div>
  );
}
export default App;
