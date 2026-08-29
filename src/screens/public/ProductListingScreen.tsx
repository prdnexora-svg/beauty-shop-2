import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Building2,
  ShieldCheck,
  Send,
  FlaskConical,
  MessageSquare,
  ArrowLeftRight,
  Heart,
  Grid3X3,
  List,
  Check,
  X,
  Radio,
  Clock,
  Sparkles,
  Package,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Share2,
  Phone,
  Star
} from 'lucide-react';
import { SearchProduct, RFQItem } from '../../types';
import { SEARCH_PRODUCTS, LIVE_RFQS } from '../../data/mockData';
import { CATEGORY_TAXONOMY } from '../../data/categories';
import { motion, AnimatePresence } from 'motion/react';

interface ProductListingScreenProps {
  isLoggedIn: boolean;
  onOpenEnquiryModal: (item: any) => void;
  onOpenQuoteModal: (rfq: RFQItem) => void;
  onOpenRFQModal: () => void;
  onNavigateToExplore: () => void;
  onNavigateToSearch: (params?: any) => void;
  onNavigateToProductDetail?: (productId: string) => void;
  onOpenProductComparison?: (products: SearchProduct[]) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
  onOpenAuth: () => void;
}

export const ProductListingScreen: React.FC<ProductListingScreenProps> = ({
  isLoggedIn,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onNavigateToExplore,
  onNavigateToSearch,
  onNavigateToProductDetail,
  onOpenProductComparison,
  onCallSupplier,
  onWhatsAppSupplier,
  onOpenAuth
}) => {
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('Haircare');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(['Hair Serums']);
  const [categoryAccordionOpen, setCategoryAccordionOpen] = useState<boolean>(true);
  
  const [locationCity, setLocationCity] = useState<string>('Mumbai');
  const [selectedRadius, setSelectedRadius] = useState<string>('+50 km');
  const [selectedHub, setSelectedHub] = useState<string>('Mumbai');
  
  const [selectedMoqTier, setSelectedMoqTier] = useState<'all' | '<100' | '100-500' | '500+'>('100-500');
  const [customMinMoq, setCustomMinMoq] = useState<string>('');
  const [customMaxMoq, setCustomMaxMoq] = useState<string>('');
  
  const [maxPrice, setMaxPrice] = useState<number>(1200);
  const [sortOption, setSortOption] = useState<'relevance' | 'moq-asc' | 'price-asc' | 'price-desc' | 'rating'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Capabilities Checkboxes
  const [capabilities, setCapabilities] = useState<{
    verifiedMfg: boolean;
    oemPrivateLabel: boolean;
    isoCertified: boolean;
    gmpCompliant: boolean;
    fdaRegistered: boolean;
    readyStock: boolean;
    fastResponse: boolean;
  }>({
    verifiedMfg: true,
    oemPrivateLabel: false,
    isoCertified: false,
    gmpCompliant: false,
    fdaRegistered: false,
    readyStock: false,
    fastResponse: false
  });

  // Active Interactive States
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [comparedProductIds, setComparedProductIds] = useState<string[]>(['sp-1']);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Toggle capabilities
  const toggleCapability = (key: keyof typeof capabilities) => {
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle Subcategory
  const toggleSubcategory = (subcat: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcat) ? prev.filter((s) => s !== subcat) : [...prev, subcat]
    );
  };

  // Toggle Favorite
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Toggle Compare
  const toggleCompare = (productId: string) => {
    setComparedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, productId];
    });
  };

  // Clear Comparison Dock
  const handleClearComparison = () => {
    setComparedProductIds([]);
  };

  // Reset All Filters
  const handleClearAllFilters = () => {
    setSelectedCategory('Haircare');
    setSelectedSubcategories(['Hair Serums']);
    setLocationCity('All India');
    setSelectedHub('All');
    setSelectedRadius('Anywhere');
    setSelectedMoqTier('all');
    setCustomMinMoq('');
    setCustomMaxMoq('');
    setMaxPrice(2000);
    setCapabilities({
      verifiedMfg: false,
      oemPrivateLabel: false,
      isoCertified: false,
      gmpCompliant: false,
      fdaRegistered: false,
      readyStock: false,
      fastResponse: false
    });
  };

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    let list = [...SEARCH_PRODUCTS];

    // Category Filter
    if (selectedCategory && selectedCategory !== 'All Categories') {
      list = list.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    // Hub / Location
    if (selectedHub && selectedHub !== 'All') {
      list = list.filter((p) =>
        p.supplierLocation.toLowerCase().includes(selectedHub.toLowerCase())
      );
    }

    // Price Filter
    list = list.filter((p) => (p.priceMin || 0) <= maxPrice);

    // MOQ Tier
    if (selectedMoqTier === '<100') {
      list = list.filter((p) => (p.moqNumber || 50) < 100);
    } else if (selectedMoqTier === '100-500') {
      list = list.filter((p) => (p.moqNumber || 100) <= 500);
    } else if (selectedMoqTier === '500+') {
      list = list.filter((p) => (p.moqNumber || 500) >= 500);
    }

    // Custom MOQ
    if (customMinMoq) {
      list = list.filter((p) => (p.moqNumber || 0) >= parseInt(customMinMoq, 10));
    }
    if (customMaxMoq) {
      list = list.filter((p) => (p.moqNumber || 0) <= parseInt(customMaxMoq, 10));
    }

    // Capabilities Checkboxes
    if (capabilities.verifiedMfg) {
      list = list.filter((p) => p.isNexoraVerified);
    }
    if (capabilities.isoCertified) {
      list = list.filter((p) => p.isIsoCertified);
    }
    if (capabilities.gmpCompliant) {
      list = list.filter((p) =>
        p.certifications.some((c) => c.toLowerCase().includes('gmp'))
      );
    }
    if (capabilities.fdaRegistered) {
      list = list.filter((p) =>
        p.certifications.some((c) => c.toLowerCase().includes('fda'))
      );
    }

    // Sorting
    if (sortOption === 'moq-asc') {
      list.sort((a, b) => (a.moqNumber || 0) - (b.moqNumber || 0));
    } else if (sortOption === 'price-asc') {
      list.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => (b.priceMax || 0) - (a.priceMax || 0));
    }

    return list;
  }, [
    selectedCategory,
    selectedHub,
    maxPrice,
    selectedMoqTier,
    customMinMoq,
    customMaxMoq,
    capabilities,
    sortOption
  ]);

  // Selected compared product objects
  const comparedProducts = SEARCH_PRODUCTS.filter((p) =>
    comparedProductIds.includes(p.id)
  );

  return (
    <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans pb-28 selection:bg-[#F5EEF8] selection:text-[#6B2D8C]">
      
      {/* Breadcrumbs Strip */}
      <div className="bg-white border-b border-[#E8DEEF] py-2.5 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#5B4A6E] text-[12px] font-medium flex-wrap">
            <button
              onClick={onNavigateToExplore}
              className="hover:text-[#6B2D8C] transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E6C96]" />
            <button
              onClick={() => onNavigateToSearch({ tab: 'products' })}
              className="hover:text-[#6B2D8C] transition-colors"
            >
              Marketplace
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E6C96]" />
            <button
              onClick={() => setSelectedCategory('Haircare')}
              className="hover:text-[#6B2D8C] transition-colors"
            >
              Haircare
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E6C96]" />
            <span className="text-[#2A0E3F] font-bold">
              Professional Hair Serums
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-[#5B4A6E]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#6B2D8C]" />
              <strong>120+</strong> Audited Laboratories
            </span>
            <span className="text-[#7E6C96]">•</span>
            <span className="text-[#6B2D8C] font-semibold">Zero Commission B2B</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1440px] w-full mx-auto px-5 md:px-10 py-6 flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Filters Toggle Button */}
        <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#E8DEEF] shadow-2xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B2D8C]" />
            <span className="font-bold text-sm text-[#2A0E3F]">Filters &amp; Sourcing Hubs</span>
          </div>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="bg-[#6B2D8C] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {mobileFilterOpen ? 'Hide Filters' : 'Refine Filters'}
          </button>
        </div>

        {/* Enhanced Left Sidebar Filters */}
        <aside
          className={`w-full lg:w-72 shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-3 scrollbar-hide ${
            mobileFilterOpen ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Filter Header */}
          <div className="flex justify-between items-center pb-3 border-b border-[#E8DEEF]">
            <h2 className="text-base font-bold text-[#2A0E3F] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6B2D8C]" />
              Filters
            </h2>
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-semibold text-[#6B2D8C] hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Category Accordion */}
          <div className="space-y-3">
            <button
              onClick={() => setCategoryAccordionOpen(!categoryAccordionOpen)}
              className="w-full flex justify-between items-center text-[12px] font-bold text-[#5B4A6E] uppercase tracking-wider text-left"
            >
              Category
              {categoryAccordionOpen ? (
                <ChevronUp className="w-4 h-4 text-[#7E6C96]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#7E6C96]" />
              )}
            </button>

            {categoryAccordionOpen && (
              <div className="space-y-3 pl-1 max-h-96 overflow-y-auto">
                {Object.entries(CATEGORY_TAXONOMY).map(([catName, subcategories]) => {
                  const isCatSelected = selectedCategory === catName || selectedCategory.includes(catName);
                  return (
                    <div key={catName} className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isCatSelected}
                          onChange={() => {
                            if (isCatSelected) {
                              setSelectedCategory('All Categories');
                              setSelectedSubcategories([]);
                            } else {
                              setSelectedCategory(catName);
                              setSelectedSubcategories([]);
                            }
                          }}
                          className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                        />
                        <span className={`text-[13px] transition-colors ${isCatSelected ? 'font-extrabold text-[#6B2D8C]' : 'font-bold text-[#2A0E3F] group-hover:text-[#6B2D8C]'}`}>
                          {catName}
                        </span>
                      </label>

                      {/* Subcategories */}
                      {isCatSelected && (
                        <div className="pl-5 space-y-1.5 mt-1 border-l-2 border-[#ece7e7]">
                          {subcategories.map((subName) => (
                            <label key={subName} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selectedSubcategories.includes(subName)}
                                onChange={() => toggleSubcategory(subName)}
                                className="w-3.5 h-3.5 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                              />
                              <span className="text-[12px] text-[#5B4A6E] group-hover:text-[#2A0E3F] transition-colors">
                                {subName}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location & Radius Filter */}
          <div className="space-y-3 pt-4 border-t border-[#E8DEEF]">
            <h3 className="text-[12px] font-bold text-[#5B4A6E] uppercase tracking-wider">
              Location &amp; Radius
            </h3>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E6C96]" />
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full pl-9 pr-3 py-2 border border-[#E8DEEF] rounded-lg text-[13px] bg-white focus:border-[#C9A961] focus:ring-1 focus:ring-[#C9A961]/30 outline-none text-[#2A0E3F]"
              />
            </div>
            <select
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(e.target.value)}
              className="w-full border border-[#E8DEEF] rounded-lg px-3 py-2 text-[12.5px] bg-white text-[#2A0E3F] outline-none focus:border-[#C9A961]"
            >
              <option value="+50 km">Radius: +50 km</option>
              <option value="+100 km">Radius: +100 km</option>
              <option value="+200 km">Radius: +200 km</option>
              <option value="Anywhere">All India / Anywhere</option>
            </select>

            {/* Quick Hub Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'All', label: 'All India' },
                { id: 'Mumbai', label: 'Mumbai' },
                { id: 'Delhi', label: 'Delhi NCR' },
                { id: 'Pune', label: 'Pune' },
                { id: 'Ahmedabad', label: 'Ahmedabad' },
                { id: 'Bengaluru', label: 'Bengaluru' }
              ].map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => {
                    setSelectedHub(hub.id);
                    setLocationCity(hub.id === 'All' ? 'All India' : hub.label);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedHub === hub.id
                      ? 'bg-[#F5EEF8] border-[#6B2D8C] text-[#6B2D8C] font-bold'
                      : 'bg-white border-[#E8DEEF] text-[#5B4A6E] hover:border-[#6B2D8C]'
                  }`}
                >
                  {hub.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Order Qty (MOQ) */}
          <div className="space-y-3 pt-4 border-t border-[#E8DEEF]">
            <h3 className="text-[12px] font-bold text-[#5B4A6E] uppercase tracking-wider">
              Min. Order Qty (MOQ)
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMoqTier(selectedMoqTier === '<100' ? 'all' : '<100')}
                className={`px-3 py-1 border rounded-full text-xs transition-all ${
                  selectedMoqTier === '<100'
                    ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#6B2D8C] font-bold'
                    : 'border-[#E8DEEF] bg-white text-[#5B4A6E] hover:border-[#6B2D8C]'
                }`}
              >
                &lt; 100
              </button>
              <button
                onClick={() => setSelectedMoqTier(selectedMoqTier === '100-500' ? 'all' : '100-500')}
                className={`px-3 py-1 border rounded-full text-xs font-medium transition-all ${
                  selectedMoqTier === '100-500'
                    ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#6B2D8C] font-bold'
                    : 'border-[#E8DEEF] bg-white text-[#5B4A6E] hover:border-[#6B2D8C]'
                }`}
              >
                100 - 500
              </button>
              <button
                onClick={() => setSelectedMoqTier(selectedMoqTier === '500+' ? 'all' : '500+')}
                className={`px-3 py-1 border rounded-full text-xs transition-all ${
                  selectedMoqTier === '500+'
                    ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#6B2D8C] font-bold'
                    : 'border-[#E8DEEF] bg-white text-[#5B4A6E] hover:border-[#6B2D8C]'
                }`}
              >
                500+
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={customMinMoq}
                onChange={(e) => setCustomMinMoq(e.target.value)}
                placeholder="Min"
                className="w-full border border-[#E8DEEF] rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#2A0E3F] focus:border-[#C9A961] outline-none"
              />
              <span className="text-[#7E6C96]">-</span>
              <input
                type="number"
                value={customMaxMoq}
                onChange={(e) => setCustomMaxMoq(e.target.value)}
                placeholder="Max"
                className="w-full border border-[#E8DEEF] rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#2A0E3F] focus:border-[#C9A961] outline-none"
              />
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-4 border-t border-[#E8DEEF]">
            <div className="flex justify-between items-center">
              <h3 className="text-[12px] font-bold text-[#5B4A6E] uppercase tracking-wider">
                Price Range (₹)
              </h3>
              <span className="text-xs font-bold text-[#6B2D8C]">Up to ₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              className="w-full accent-[#6B2D8C] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#7E6C96]">
              <span>₹100</span>
              <span>₹1,000</span>
              <span>₹2,000+</span>
            </div>
          </div>

          {/* Supplier Capabilities */}
          <div className="space-y-3 pt-4 border-t border-[#E8DEEF]">
            <h3 className="text-[12px] font-bold text-[#5B4A6E] uppercase tracking-wider">
              Supplier Capabilities
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={capabilities.verifiedMfg}
                  onChange={() => toggleCapability('verifiedMfg')}
                  className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                />
                <span className="text-[13px] text-[#2A0E3F] flex items-center gap-1 group-hover:text-[#6B2D8C] transition-colors">
                  Verified Manufacturer
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6B2D8C]" />
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={capabilities.oemPrivateLabel}
                  onChange={() => toggleCapability('oemPrivateLabel')}
                  className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                />
                <span className="text-[13px] text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors">
                  OEM / Private Label
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={capabilities.isoCertified}
                  onChange={() => toggleCapability('isoCertified')}
                  className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                />
                <span className="text-[13px] text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors">
                  ISO Certified
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={capabilities.gmpCompliant}
                  onChange={() => toggleCapability('gmpCompliant')}
                  className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                />
                <span className="text-[13px] text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors">
                  GMP Compliant
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={capabilities.fdaRegistered}
                  onChange={() => toggleCapability('fdaRegistered')}
                  className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                />
                <span className="text-[13px] text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors">
                  FDA Registered
                </span>
              </label>
            </div>
          </div>

          {/* Supplier Performance */}
          <div className="space-y-3 pt-4 border-t border-[#E8DEEF]">
            <h3 className="text-[12px] font-bold text-[#5B4A6E] uppercase tracking-wider">
              Supplier Performance
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={capabilities.fastResponse}
                  onChange={() => toggleCapability('fastResponse')}
                  className="w-4 h-4 rounded text-[#6B2D8C] focus:ring-[#C9A961]/30 border-[#E8DEEF] accent-[#6B2D8C]"
                />
                <span className="text-[13px] text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors">
                  Response Time &lt; 24h
                </span>
              </label>
            </div>
          </div>

          {/* Real-time RFQs Widget (Sidebar Ticker) */}
          <div className="mt-2 bg-white border border-[#E8DEEF] rounded-xl p-4 shadow-2xs">
            <h4 className="text-[13px] font-bold text-[#6B2D8C] flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 animate-pulse text-[#8236A0]" />
              Live Buyer Requests
            </h4>
            <div className="space-y-3 text-xs">
              <div className="pb-2.5 border-b border-[#E8DEEF]">
                <p className="font-bold text-[#2A0E3F]">Req: Bulk Argan Oil Serum</p>
                <p className="text-[#5B4A6E] mt-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#7E6C96]" />
                  <span>5,000 units</span>
                </p>
                <p className="text-[#7E6C96] mt-0.5 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#6B2D8C]" />
                  <span>Dubai, UAE</span>
                </p>
              </div>

              <div className="pb-2.5 border-b border-[#E8DEEF]">
                <p className="font-bold text-[#2A0E3F]">Req: Private Label Hair Serum</p>
                <p className="text-[#5B4A6E] mt-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#7E6C96]" />
                  <span>1,000 units</span>
                </p>
                <p className="text-[#7E6C96] mt-0.5 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#6B2D8C]" />
                  <span>Mumbai, IND</span>
                </p>
              </div>

              <div>
                <p className="font-bold text-[#2A0E3F]">Req: Keratin Concentrate 500L</p>
                <p className="text-[#5B4A6E] mt-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#7E6C96]" />
                  <span>500 Liters</span>
                </p>
                <p className="text-[#7E6C96] mt-0.5 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#6B2D8C]" />
                  <span>Delhi, IND</span>
                </p>
              </div>
            </div>

            <button
              onClick={onOpenRFQModal}
              className="w-full mt-3 text-xs text-[#6B2D8C] font-bold hover:underline text-center cursor-pointer block pt-1"
            >
              View All Requests &amp; Post RFQ →
            </button>
          </div>
        </aside>

        {/* Main Product Grid & Listing Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header, Quick Chips & Sorting */}
          <div className="flex flex-col gap-4 mb-6 border-b border-[#E8DEEF] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#6B2D8C]"></span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B2D8C]">
                  B2B FORMULATION SOURCING
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2A0E3F] tracking-tight">
                Professional Hair Serum
              </h1>
              <p className="text-[13px] text-[#5B4A6E] mt-1">
                Source professional formulations, salon supplies and verified manufacturing partners.{' '}
                <strong className="text-[#2A0E3F] font-bold">248 products found.</strong>
              </p>
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'All Categories', label: 'All Categories' },
                { id: 'Skincare', label: 'Skincare' },
                { id: 'Haircare', label: 'Haircare' },
                { id: 'Salon Equipment', label: 'Salon Equipment' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === chip.id
                      ? 'bg-[#6B2D8C] text-white shadow-xs'
                      : 'bg-white border border-[#E8DEEF] text-[#5B4A6E] hover:border-[#6B2D8C] hover:text-[#6B2D8C]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Active Filters & Sort Row */}
            <div className="flex flex-wrap justify-between items-center gap-4 mt-2">
              
              {/* Active Filter Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#5B4A6E] font-semibold">Active:</span>
                
                {selectedCategory && (
                  <span className="bg-[#F5EEF8] text-[#6B2D8C] px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-[#D9C3E8]">
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('All Categories')}
                      className="hover:opacity-75 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedMoqTier !== 'all' && (
                  <span className="bg-[#F5EEF8] text-[#6B2D8C] px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-[#D9C3E8]">
                    MOQ {selectedMoqTier === '<100' ? '< 100' : selectedMoqTier === '100-500' ? '< 500' : '500+'}
                    <button
                      onClick={() => setSelectedMoqTier('all')}
                      className="hover:opacity-75 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {capabilities.verifiedMfg && (
                  <span className="bg-[#f0f5ff] text-[#6B2D8C] px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-[#EDE0F5]">
                    Verified Mfg Only
                    <button
                      onClick={() => toggleCapability('verifiedMfg')}
                      className="hover:opacity-75 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {/* Sorting & Layout View Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#5B4A6E] font-medium hidden sm:inline">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-white border border-[#E8DEEF] rounded-lg px-3 py-1.5 text-xs text-[#2A0E3F] focus:border-[#C9A961] focus:ring-1 focus:ring-[#C9A961]/30 outline-none cursor-pointer font-medium"
                >
                  <option value="relevance">Relevance</option>
                  <option value="moq-asc">Lowest MOQ</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>

                <div className="hidden sm:flex border border-[#E8DEEF] rounded-lg overflow-hidden bg-white shadow-2xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-[#F4F0E9] text-[#6B2D8C]'
                        : 'text-[#7E6C96] hover:bg-[#F6F1FA]'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[#F4F0E9] text-[#6B2D8C]'
                        : 'text-[#7E6C96] hover:bg-[#F6F1FA]'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-[#E8DEEF] p-8">
              <FlaskConical className="w-12 h-12 text-[#7E6C96] mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-[#2A0E3F]">No formulation matches your filters</h3>
              <p className="text-[13px] text-[#5B4A6E] max-w-md mx-auto mt-1 mb-4">
                Try expanding your price range or reset your location filters to view all audited laboratories.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="bg-[#6B2D8C] text-white font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-[#4A2560] transition-colors shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((prod) => {
                  const isCompared = comparedProductIds.includes(prod.id);
                  const isFav = !!favorites[prod.id];

                  return (
                    <motion.div
                      key={prod.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="bg-white border border-[#E8DEEF] rounded-xl overflow-hidden flex flex-col group hover:shadow-md hover:border-[#7E6C96] transition-all duration-300 relative shadow-2xs"
                    >
                      {/* Product Image & Badges */}
                      <div className="h-48 w-full relative overflow-hidden bg-[#F6F1FA]">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Top Left Verification Badge */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                          {prod.isNexoraVerified && (
                            <span className="bg-white/95 backdrop-blur-xs text-[#6B2D8C] px-2 py-0.5 rounded text-[10px] font-bold shadow-xs border border-[#E8DEEF] flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 fill-[#6B2D8C] text-white" />
                              Verified Mfg
                            </span>
                          )}
                          {prod.id === 'sp-2' && (
                            <span className="bg-white/95 backdrop-blur-xs text-[#2A0E3F] px-2 py-0.5 rounded text-[10px] font-bold shadow-xs border border-[#E8DEEF] w-fit">
                              OEM Available
                            </span>
                          )}
                          {prod.id === 'sp-3' && (
                            <span className="bg-white/95 backdrop-blur-xs text-[#2A0E3F] px-2 py-0.5 rounded text-[10px] font-bold shadow-xs border border-[#E8DEEF] w-fit">
                              Private Label
                            </span>
                          )}
                        </div>

                        {/* Top Right Ready Stock & Favorite */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                          {prod.id === 'sp-1' && (
                            <span className="bg-emerald-100/95 backdrop-blur-xs text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200 shadow-2xs">
                              Ready Stock
                            </span>
                          )}
                          <button
                            onClick={() => toggleFavorite(prod.id)}
                            className="p-1.5 bg-white/90 rounded-full text-[#5B4A6E] hover:text-[#6B2D8C] transition-colors shadow-2xs"
                            title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#6B2D8C] text-[#6B2D8C]' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex flex-col flex-1">
                        
                        {/* Title & Supplier */}
                        <div className="flex items-center gap-1 mb-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="w-2.5 h-2.5 fill-gold-400 text-gold-400" />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-[#7E6C96]">4.9 (85+)</span>
                        </div>
                        <h3 className="font-bold text-[14px] text-[#2A0E3F] leading-snug mb-1 group-hover:text-[#6B2D8C] transition-colors line-clamp-2">
                          {prod.title}
                        </h3>
                        
                        <div className="flex items-center gap-1 mb-2 text-[12px] text-[#5B4A6E]">
                          <Building2 className="w-3.5 h-3.5 text-[#6B2D8C] shrink-0" />
                          <span className="truncate">{prod.supplierName} • {prod.supplierLocation}</span>
                        </div>

                        {/* Pricing & MOQ Container */}
                        <div className="mt-1 mb-3 bg-[#F6F1FA] p-2.5 rounded-lg border border-[#E8DEEF]/80">
                          
                          {/* Top row: Est Price & MOQ */}
                          <div className="flex justify-between items-end mb-1.5">
                            <div>
                              <p className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Est. Price</p>
                              <p className="font-bold text-sm text-[#2A0E3F]">
                                {prod.priceRange}
                                <span className="text-[10px] font-normal text-[#5B4A6E]"> / unit</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">MOQ</p>
                              <p className="font-bold text-sm text-[#2A0E3F]">{prod.moq}</p>
                            </div>
                          </div>

                          {/* Tiered Minimal or 3-Tier Grid */}
                          {prod.id === 'sp-2' ? (
                            <div className="grid grid-cols-3 gap-1 text-center divide-x divide-[#E8DEEF] pt-1.5 border-t border-[#E8DEEF]/80">
                              <div>
                                <p className="text-[9px] text-[#7E6C96]">10-49 L</p>
                                <p className="font-bold text-[11px] text-[#2A0E3F]">₹1,200</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-[#7E6C96]">50-199 L</p>
                                <p className="font-bold text-[11px] text-[#2A0E3F]">₹1,050</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-[#7E6C96]">≥200 L</p>
                                <p className="font-bold text-[11px] text-[#6B2D8C]">₹980</p>
                              </div>
                            </div>
                          ) : (
                            prod.bulkTierText && (
                              <div className="flex gap-2 text-[10.5px] text-[#5B4A6E] border-t border-[#E8DEEF]/80 pt-1.5 font-medium">
                                <Info className="w-3 h-3 text-[#6B2D8C] shrink-0 mt-0.5" />
                                <span>{prod.bulkTierText}</span>
                              </div>
                            )
                          )}
                        </div>

                        {/* Trust Badges & Response Time SLA */}
                        <div className="flex items-center justify-between mb-4 mt-auto">
                          <div className="flex gap-1.5">
                            {prod.certifications.slice(0, 2).map((cert, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-[#ece7e7] border border-[#E8DEEF] rounded text-[9.5px] text-[#5B4A6E] font-semibold"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                          <span className="flex items-center gap-1 text-[11px] text-[#5B4A6E] font-medium">
                            <Clock className="w-3 h-3 text-[#6B2D8C]" />
                            {prod.responseTime}
                          </span>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => onOpenEnquiryModal(prod)}
                            className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Enquiry
                          </button>

                          <div className="flex gap-2">
                            {/* Call Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCallSupplier(prod.supplierName);
                              }}
                              className="flex-1 py-1.5 border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#F5EEF8] rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1 shadow-2xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {isLoggedIn ? 'Call' : 'View Number'}
                            </button>

                            {/* WhatsApp Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onWhatsAppSupplier(prod.supplierName);
                              }}
                              className="flex-1 py-1.5 border border-[#25D366] text-[#25D366] hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1 shadow-2xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>

                            {/* Add to Compare Checkbox */}
                            <label
                              className={`flex items-center justify-center p-1.5 border rounded-lg cursor-pointer transition-colors shadow-2xs ${
                                isCompared
                                  ? 'bg-[#F5EEF8] border-[#6B2D8C] text-[#6B2D8C]'
                                  : 'border-[#E8DEEF] text-[#5B4A6E] hover:bg-[#F6F1FA]'
                              }`}
                              title={isCompared ? 'Remove from Compare Dock' : 'Add to Compare Dock'}
                            >
                              <input
                                type="checkbox"
                                checked={isCompared}
                                onChange={() => toggleCompare(prod.id)}
                                className="sr-only"
                              />
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </label>
                          </div>

                          {/* Visible Contact Number & Verification Barrier */}
                          <div className="flex items-center justify-between px-1 py-1">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#7E6C96]" />
                              <span className="text-[11px] font-bold text-[#2A0E3F]">
                                {isLoggedIn ? '+91 98201 55443' : '+91 98XXX XXXXX'}
                              </span>
                            </div>
                            {!isLoggedIn && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenAuth();
                                }}
                                className="text-[10px] font-bold text-[#6B2D8C] hover:underline"
                              >
                                Login to reveal
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => onNavigateToProductDetail?.(prod.id)}
                            className="w-full mt-1 border border-[#E8DEEF] text-[#2A0E3F] hover:bg-[#F6F1FA] hover:border-[#6B2D8C] py-2 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                          >
                            <span>View Full Specifications</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="mt-10 flex flex-col sm:flex-row justify-between items-center border-t border-[#E8DEEF] pt-6 gap-4">
            <span className="text-xs text-[#5B4A6E] font-medium">
              Showing 1-{filteredProducts.length} of 248 products
            </span>

            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-[#E8DEEF] rounded-lg text-[#5B4A6E] hover:bg-[#F6F1FA] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentPage === 1
                    ? 'bg-[#6B2D8C] text-white shadow-2xs'
                    : 'border border-[#E8DEEF] text-[#2A0E3F] hover:bg-[#F6F1FA]'
                }`}
              >
                1
              </button>

              <button
                onClick={() => setCurrentPage(2)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentPage === 2
                    ? 'bg-[#6B2D8C] text-white shadow-2xs'
                    : 'border border-[#E8DEEF] text-[#2A0E3F] hover:bg-[#F6F1FA]'
                }`}
              >
                2
              </button>

              <button
                onClick={() => setCurrentPage(3)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentPage === 3
                    ? 'bg-[#6B2D8C] text-white shadow-2xs'
                    : 'border border-[#E8DEEF] text-[#2A0E3F] hover:bg-[#F6F1FA]'
                }`}
              >
                3
              </button>

              <span className="text-xs text-[#7E6C96] px-1">...</span>

              <button
                onClick={() => setCurrentPage(11)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentPage === 11
                    ? 'bg-[#6B2D8C] text-white shadow-2xs'
                    : 'border border-[#E8DEEF] text-[#2A0E3F] hover:bg-[#F6F1FA]'
                }`}
              >
                11
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(11, p + 1))}
                disabled={currentPage === 11}
                className="w-8 h-8 flex items-center justify-center border border-[#E8DEEF] rounded-lg text-[#5B4A6E] hover:bg-[#F6F1FA] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Post Requirement Fallback Banner */}
          <div className="mt-8 bg-gradient-to-r from-[#F5EEF8] via-[#FDFBF7] to-[#F5EEF8] border border-[#D9C3E8] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left shadow-2xs">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#6B2D8C]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B2D8C]">
                  DIRECT SOURCING BROADCAST
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#2A0E3F]">
                Can't find the exact product or formula?
              </h3>
              <p className="text-xs sm:text-sm text-[#5B4A6E] max-w-xl mt-1">
                Post your custom sourcing requirement, and let our verified manufacturing labs and formulation chemists quote you directly with lab dossiers.
              </p>
            </div>
            <button
              onClick={onOpenRFQModal}
              className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-sm hover:shadow-md cursor-pointer shrink-0"
            >
              Post Requirement Free
            </button>
          </div>

        </div>
      </div>

      {/* Sticky Bottom Comparison Tray */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#E8DEEF] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm font-bold text-[#2A0E3F]">
                <strong className="text-[#6B2D8C]">{comparedProducts.length}</strong> Product{comparedProducts.length > 1 ? 's' : ''} Selected
              </span>

              {/* Thumbnails of selected items */}
              <div className="hidden sm:flex items-center gap-2">
                {comparedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="w-10 h-10 border border-[#6B2D8C] rounded-lg overflow-hidden bg-[#F6F1FA] relative group shrink-0"
                  >
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => toggleCompare(prod.id)}
                      className="absolute -top-1 -right-1 bg-[#2A0E3F] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-[#6B2D8C] transition-colors"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Empty Slots */}
                {Array.from({ length: Math.max(0, 4 - comparedProducts.length) }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="w-10 h-10 border border-dashed border-[#E8DEEF] rounded-lg flex items-center justify-center text-[#7E6C96]"
                    title="Empty slot"
                  >
                    <span className="text-xs font-light text-[#7E6C96]">+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tray Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearComparison}
                className="text-xs font-semibold text-[#5B4A6E] hover:text-[#6B2D8C] transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  if (onOpenProductComparison) {
                    onOpenProductComparison(comparedProducts);
                  }
                }}
                className="bg-[#2A0E3F] hover:bg-[#352B44] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Compare Now</span>
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#8236A0]" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
