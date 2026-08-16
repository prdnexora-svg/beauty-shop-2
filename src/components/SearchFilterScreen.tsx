import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  X,
  SlidersHorizontal,
  Grid,
  List,
  ChevronDown,
  Heart,
  Store,
  Info,
  Zap,
  FlaskConical,
  MessageCircle,
  ArrowLeftRight,
  ShieldCheck,
  Building2,
  Phone,
  Send,
  CheckCircle2,
  Award,
  Factory,
  Radio,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { SearchProduct, SearchSupplier, OEMFormulation } from '../types';
import { SEARCH_PRODUCTS, SEARCH_SUPPLIERS, SEARCH_OEM_FORMULATIONS } from '../data/mockData';
import { ProductCompareModal } from './ProductCompareModal';

interface SearchFilterScreenProps {
  initialQuery?: string;
  initialCategory?: string;
  initialLocation?: string;
  isSupplierSaved?: (supplierId: string) => boolean;
  onToggleSaveSupplier?: (supplierId: string, supplierName?: string) => void;
  onOpenEnquiryModal: (item: any) => void;
  onOpenQuoteModal: (rfq: any) => void;
  onOpenRFQModal: () => void;
  onOpenMapModal?: (supplier: any) => void;
  onNavigateToExplore: () => void;
}

export const SearchFilterScreen: React.FC<SearchFilterScreenProps> = ({
  initialQuery = 'Professional Hair Serum',
  initialCategory = 'All',
  initialLocation = 'Mumbai, Maharashtra (+50 km)',
  isSupplierSaved,
  onToggleSaveSupplier,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onOpenMapModal,
  onNavigateToExplore
}) => {
  // Search inputs
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [locationQuery, setLocationQuery] = useState(initialLocation);

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'oem'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'verified' | 'price_asc' | 'price_desc' | 'moq_asc' | 'response'>('verified');

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory !== 'All' ? [initialCategory] : ['Haircare', 'Skincare']
  );
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedMoqTier, setSelectedMoqTier] = useState<'all' | 'lt_100' | '100_500' | 'gt_500'>('100_500');
  const [isGstOnly, setIsGstOnly] = useState(true);
  const [isIsoOnly, setIsIsoOnly] = useState(false);
  const [isNexoraVerifiedOnly, setIsNexoraVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Comparison State
  const [comparedProductIds, setComparedProductIds] = useState<string[]>(['sp-1', 'sp-2']);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Active filter chips list
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    selectedCategories.forEach((cat) => {
      chips.push({
        id: `cat-${cat}`,
        label: cat,
        onRemove: () => setSelectedCategories((prev) => prev.filter((c) => c !== cat))
      });
    });

    if (selectedLocation && selectedLocation !== 'All') {
      chips.push({
        id: 'filter-selected-loc',
        label: `📍 ${selectedLocation}`,
        onRemove: () => {
          setSelectedLocation('All');
          setLocationQuery('All India');
        }
      });
    } else if (locationQuery && locationQuery.trim() && !locationQuery.toLowerCase().includes('all india')) {
      chips.push({
        id: 'filter-loc-query',
        label: `📍 ${locationQuery.split(',')[0]}`,
        onRemove: () => setLocationQuery('All India')
      });
    }

    if (selectedMoqTier === 'lt_100') {
      chips.push({
        id: 'moq-lt100',
        label: 'MOQ < 100',
        onRemove: () => setSelectedMoqTier('all')
      });
    } else if (selectedMoqTier === '100_500') {
      chips.push({
        id: 'moq-100-500',
        label: 'MOQ 100 - 500',
        onRemove: () => setSelectedMoqTier('all')
      });
    } else if (selectedMoqTier === 'gt_500') {
      chips.push({
        id: 'moq-gt500',
        label: 'MOQ > 500',
        onRemove: () => setSelectedMoqTier('all')
      });
    }

    if (isGstOnly) {
      chips.push({
        id: 'filter-gst',
        label: 'GST Verified',
        onRemove: () => setIsGstOnly(false)
      });
    }

    if (isIsoOnly) {
      chips.push({
        id: 'filter-iso',
        label: 'ISO/GMP Certified',
        onRemove: () => setIsIsoOnly(false)
      });
    }

    if (isNexoraVerifiedOnly) {
      chips.push({
        id: 'filter-tier1',
        label: 'Tier-1 Audited',
        onRemove: () => setIsNexoraVerifiedOnly(false)
      });
    }

    return chips;
  }, [selectedCategories, selectedLocation, selectedMoqTier, isGstOnly, isIsoOnly, isNexoraVerifiedOnly, locationQuery]);

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedLocation('All');
    setSelectedMoqTier('all');
    setIsGstOnly(false);
    setIsIsoOnly(false);
    setIsNexoraVerifiedOnly(false);
    setMaxPrice(5000);
    setLocationQuery('All India');
    setSearchQuery('');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompare = (id: string) => {
    setComparedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 products at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedProducts = useMemo(() => {
    return SEARCH_PRODUCTS.filter((p) => comparedProductIds.includes(p.id));
  }, [comparedProductIds]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return SEARCH_PRODUCTS.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          p.title.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      // Location match
      if (selectedLocation && selectedLocation !== 'All') {
        const loc = selectedLocation.toLowerCase();
        if (!p.supplierLocation.toLowerCase().includes(loc)) return false;
      } else if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().split(',')[0].trim();
        if (loc && !['all', 'india', 'all india'].includes(loc)) {
          if (!p.supplierLocation.toLowerCase().includes(loc)) return false;
        }
      }

      // Category match
      if (selectedCategories.length > 0) {
        if (!selectedCategories.some((c) => p.category.toLowerCase().includes(c.toLowerCase()))) {
          return false;
        }
      }

      if (selectedMoqTier === 'lt_100' && p.moqNumber >= 100) return false;
      if (selectedMoqTier === '100_500' && (p.moqNumber < 100 || p.moqNumber > 500)) return false;
      if (selectedMoqTier === 'gt_500' && p.moqNumber <= 500) return false;

      if (isGstOnly && !p.isGstVerified) return false;
      if (isIsoOnly && !p.isIsoCertified) return false;
      if (isNexoraVerifiedOnly && !p.isNexoraVerified) return false;

      if (p.priceMin > maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceMin - b.priceMin;
      if (sortBy === 'price_desc') return b.priceMin - a.priceMin;
      if (sortBy === 'moq_asc') return a.moqNumber - b.moqNumber;
      return 0;
    });
  }, [
    searchQuery,
    selectedLocation,
    locationQuery,
    selectedCategories,
    selectedMoqTier,
    isGstOnly,
    isIsoOnly,
    isNexoraVerifiedOnly,
    maxPrice,
    sortBy
  ]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return SEARCH_SUPPLIERS.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.categories.some((c) => c.toLowerCase().includes(q)) ||
          s.type.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Location match
      if (selectedLocation && selectedLocation !== 'All') {
        const loc = selectedLocation.toLowerCase();
        const supplierLoc = `${s.city} ${s.state}`.toLowerCase();
        if (!supplierLoc.includes(loc)) return false;
      } else if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().split(',')[0].trim();
        if (loc && !['all', 'india', 'all india'].includes(loc)) {
          const supplierLoc = `${s.city} ${s.state}`.toLowerCase();
          if (!supplierLoc.includes(loc)) return false;
        }
      }

      // Category match
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((cat) =>
          s.categories.some((sc) => sc.toLowerCase().includes(cat.toLowerCase()))
        );
        if (!matchesCat) return false;
      }

      if (isGstOnly && !s.isGstVerified) return false;
      if (isIsoOnly && !s.isIsoCertified) return false;
      if (isNexoraVerifiedOnly && !s.isNexoraVerified) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'verified') return (b.trustScore || 0) - (a.trustScore || 0);
      return 0;
    });
  }, [
    searchQuery,
    selectedLocation,
    locationQuery,
    selectedCategories,
    isGstOnly,
    isIsoOnly,
    isNexoraVerifiedOnly,
    sortBy
  ]);

  // Filtered OEM Formulations
  const filteredOem = useMemo(() => {
    return SEARCH_OEM_FORMULATIONS.filter((oem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          oem.title.toLowerCase().includes(q) ||
          oem.developer.toLowerCase().includes(q) ||
          oem.location.toLowerCase().includes(q) ||
          oem.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Location match
      if (selectedLocation && selectedLocation !== 'All') {
        const loc = selectedLocation.toLowerCase();
        if (!oem.location.toLowerCase().includes(loc)) return false;
      } else if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().split(',')[0].trim();
        if (loc && !['all', 'india', 'all india'].includes(loc)) {
          if (!oem.location.toLowerCase().includes(loc)) return false;
        }
      }

      // Category match
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((cat) =>
          oem.title.toLowerCase().includes(cat.toLowerCase()) ||
          oem.tags.some((t) => t.toLowerCase().includes(cat.toLowerCase()))
        );
        if (!matchesCat) return false;
      }

      if (isGstOnly && !oem.isGstVerified) return false;
      if (isIsoOnly && !oem.isIsoCertified) return false;

      return true;
    });
  }, [
    searchQuery,
    selectedLocation,
    locationQuery,
    selectedCategories,
    isGstOnly,
    isIsoOnly
  ]);

  return (
    <div className="bg-[#fdf8f8] min-h-screen text-[#1c1b1b] flex flex-col pb-28">
      
      {/* Sticky Search & Filter Header */}
      <div className="bg-[#fcf9f8]/95 backdrop-blur-sm sticky top-[72px] z-30 border-b border-[#e8e8e8] py-4 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 flex flex-col gap-3">
          
          {/* Search Inputs Row */}
          <div className="flex flex-col md:flex-row gap-3 w-full">
            {/* Query Input */}
            <div className="flex-1 relative flex items-center bg-[#f0edec] rounded-xl border border-transparent focus-within:border-[#b90064] focus-within:bg-white transition-all px-4 py-2.5">
              <Search className="w-4 h-4 text-[#594047] mr-3 shrink-0" />
              <input
                type="text"
                id="search-main-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, suppliers, OEM formulations, machines..."
                className="w-full bg-transparent border-none text-[14px] text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#8c7077] hover:text-[#1c1b1b]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Location Input */}
            <div className="w-full md:w-1/3 relative flex items-center bg-[#f0edec] rounded-xl border border-transparent focus-within:border-[#b90064] focus-within:bg-white transition-all px-4 py-2.5">
              <MapPin className="w-4 h-4 text-[#594047] mr-3 shrink-0" />
              <input
                type="text"
                id="search-location-input"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City, State (or radius)"
                className="w-full bg-transparent border-none text-[14px] text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              id="search-submit-btn"
              className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[14px] px-8 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>

          {/* Active Filter Chips & Clear All */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {activeChips.length === 0 ? (
              <span className="text-[12px] text-[#8c7077] italic">No active filters applied</span>
            ) : (
              activeChips.map((chip) => (
                <div
                  key={chip.id}
                  className="flex items-center bg-[#fde7f3] border border-[#e0bec6] rounded-full px-3 py-0.5 gap-1.5 transition-colors"
                >
                  <span className="text-[12px] font-semibold text-[#b90064]">{chip.label}</span>
                  <button
                    onClick={chip.onRemove}
                    className="text-[#b90064] hover:text-[#8e004b] flex items-center transition-colors"
                    title={`Remove ${chip.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}

            {activeChips.length > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-[12px] font-semibold text-[#594047] underline hover:text-[#b90064] ml-2 transition-colors"
              >
                Clear All
              </button>
            )}

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden ml-auto flex items-center gap-1.5 text-[12px] font-bold bg-white border border-[#e8e8e8] px-3 py-1 rounded-lg text-[#1c1b1b]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#b90064]" />
              <span>Filters</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area: Sidebar + Results */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-5 md:px-10 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-[180px] flex flex-col gap-6 max-h-[calc(100vh-200px)] overflow-y-auto pb-8 pr-2">
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1c1b1b]">Filters</h2>
              <SlidersHorizontal className="w-4 h-4 text-[#594047]" />
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Category</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { name: 'Haircare', count: 120 },
                  { name: 'Skincare', count: 85 },
                  { name: 'Body Care', count: 43 },
                  { name: 'Salon Equipment', count: 28 },
                  { name: 'Packaging', count: 64 },
                  { name: 'Raw Materials', count: 35 }
                ].map((item) => (
                  <label key={item.name} className="flex items-center justify-between cursor-pointer group select-none">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(item.name)}
                        onChange={() => toggleCategory(item.name)}
                        className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                      />
                      <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8c7077]">({item.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Manufacturing Hubs / Location Filter */}
            <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Manufacturing Hub</h3>
                {selectedLocation !== 'All' && (
                  <button
                    onClick={() => {
                      setSelectedLocation('All');
                      setLocationQuery('All India');
                    }}
                    className="text-[11px] text-[#b90064] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'All', label: 'All India Hubs' },
                  { id: 'Mumbai', label: 'Mumbai, Maharashtra' },
                  { id: 'Delhi', label: 'Delhi NCR' },
                  { id: 'Pune', label: 'Pune, Maharashtra' },
                  { id: 'Ahmedabad', label: 'Ahmedabad, Gujarat' },
                  { id: 'Bengaluru', label: 'Bengaluru, Karnataka' }
                ].map((hub) => (
                  <label key={hub.id} className="flex items-center gap-2 cursor-pointer group select-none">
                    <input
                      type="radio"
                      name="hub-location"
                      checked={selectedLocation === hub.id}
                      onChange={() => {
                        setSelectedLocation(hub.id);
                        setLocationQuery(hub.id === 'All' ? 'All India' : hub.label);
                      }}
                      className="border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                    />
                    <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                      {hub.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Price Filter Slider */}
            <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Max Price (₹/unit)</h3>
                <span className="text-[12px] font-bold text-[#b90064]">₹{maxPrice >= 5000 ? '5,000+' : maxPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#b90064] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-medium text-[#8c7077]">
                <span>₹50</span>
                <span>₹2,500</span>
                <span>₹5,000+</span>
              </div>
            </div>

            {/* MOQ Filter Radios */}
            <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Min. Order Quantity (MOQ)</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'all', label: 'All MOQs' },
                  { id: 'lt_100', label: '< 100 units (Sample Ready)' },
                  { id: '100_500', label: '100 - 500 units' },
                  { id: 'gt_500', label: '500+ units (Direct Factory)' }
                ].map((tier) => (
                  <label key={tier.id} className="flex items-center gap-2 cursor-pointer group select-none">
                    <input
                      type="radio"
                      name="moq-filter"
                      checked={selectedMoqTier === tier.id}
                      onChange={() => setSelectedMoqTier(tier.id as any)}
                      className="border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                    />
                    <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                      {tier.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verification & Trust */}
            <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Verification &amp; Trust</h3>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={isGstOnly}
                    onChange={(e) => setIsGstOnly(e.target.checked)}
                    className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                  />
                  <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                    GST Verified Only
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={isIsoOnly}
                    onChange={(e) => setIsIsoOnly(e.target.checked)}
                    className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                  />
                  <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                    ISO 9001 / GMP Certified
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={isNexoraVerifiedOnly}
                    onChange={(e) => setIsNexoraVerifiedOnly(e.target.checked)}
                    className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                  />
                  <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                    Tier-1 Audited Partners
                  </span>
                </label>
              </div>
            </div>

            {/* Live Market Demand Widget */}
            <div className="bg-[#f7f2f2] border border-[#e8e8e8] rounded-xl p-4 relative overflow-hidden group hover:border-[#b90064]/50 transition-colors shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#b90064] animate-pulse"></span>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#b90064]">Live Market Demand</h4>
              </div>
              <p className="text-[13px] text-[#1c1b1b] mb-3 leading-snug">
                Buyer in Delhi requested <strong className="font-bold">500 units</strong> of Argan Oil Serum.
              </p>
              <button
                onClick={() =>
                  onOpenQuoteModal({
                    id: 'rfq-live-dem',
                    buyerLocation: 'Delhi NCR',
                    title: '500 units Argan Oil Anti-Frizz Serum',
                    quantityRequired: '500 Units',
                    targetPrice: '₹350 / Unit'
                  })
                }
                className="w-full text-center py-2 px-4 border border-[#b90064] text-[#b90064] hover:bg-[#b90064] hover:text-white font-bold text-[12px] rounded-lg transition-colors shadow-2xs"
              >
                Submit Quote
              </button>
            </div>

          </div>
        </aside>

        {/* Right Main Results Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Tabs & Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e8e8e8] pb-4 mb-6 gap-4">
            
            {/* Primary Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`text-[15px] font-bold pb-1 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'products'
                    ? 'text-[#b90064] border-[#b90064]'
                    : 'text-[#594047] border-transparent hover:text-[#b90064]'
                }`}
              >
                Products <span className="text-[#8c7077] font-normal text-xs ml-1">({filteredProducts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('suppliers')}
                className={`text-[15px] font-bold pb-1 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'suppliers'
                    ? 'text-[#b90064] border-[#b90064]'
                    : 'text-[#594047] border-transparent hover:text-[#b90064]'
                }`}
              >
                Suppliers <span className="text-[#8c7077] font-normal text-xs ml-1">({filteredSuppliers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('oem')}
                className={`text-[15px] font-bold pb-1 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'oem'
                    ? 'text-[#b90064] border-[#b90064]'
                    : 'text-[#594047] border-transparent hover:text-[#b90064]'
                }`}
              >
                OEM &amp; Private Label <span className="text-[#8c7077] font-normal text-xs ml-1">({filteredOem.length})</span>
              </button>
            </div>

            {/* Sorting & View Mode Switcher */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center border border-[#e8e8e8] rounded-lg bg-white p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-[#f0edec] text-[#1c1b1b]' : 'text-[#594047] hover:text-[#b90064]'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-[#f0edec] text-[#1c1b1b]' : 'text-[#594047] hover:text-[#b90064]'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-[#e8e8e8] hover:border-[#8c7077] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#1c1b1b] focus:outline-none focus:border-[#b90064] cursor-pointer"
                >
                  <option value="verified">Sort: Verified First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="moq_asc">MOQ: Lowest First</option>
                </select>
              </div>
            </div>

          </div>

          {/* TAB 1: Products Grid View */}
          {activeTab === 'products' && (
            <div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8e8] p-8">
                  <FlaskConical className="w-12 h-12 text-[#8c7077] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#1c1b1b]">No matching formulations or products</h3>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-4">
                    Try adjusting your category or location filters, or broadcast your custom requirement directly to 120+ audited factories.
                  </p>
                  <button
                    onClick={onOpenRFQModal}
                    className="bg-[#b90064] text-white font-bold px-6 py-2.5 rounded-lg text-[13px] shadow-sm hover:bg-[#8e004b] transition-colors"
                  >
                    Post Custom Requirement / RFQ
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
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
                          initial={{ opacity: 0, scale: 0.94, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -10 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="bg-white/80 backdrop-blur-xs border border-[#e8e8e8] rounded-xl overflow-hidden flex flex-col hover:scale-[1.02] hover:border-[#b90064] transition-all duration-300 group shadow-2xs"
                        >
                          {/* Image Header */}
                          <div className="relative h-48 bg-[#f0edec] overflow-hidden">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              {prod.isGstVerified && (
                                <span className="bg-[#0150d6] text-white font-bold text-[11px] px-2 py-1 rounded shadow-xs tracking-wide">
                                  GST Verified
                                </span>
                              )}
                              {prod.isNexoraVerified && (
                                <span className="bg-[#b90064] text-white font-bold text-[11px] px-2 py-1 rounded shadow-xs tracking-wide">
                                  Nexora Verified
                                </span>
                              )}
                            </div>

                            <div className="absolute top-3 right-3 flex gap-2">
                              <label className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-md shadow-xs cursor-pointer hover:bg-white transition-colors select-none">
                                <input
                                  type="checkbox"
                                  checked={isCompared}
                                  onChange={() => toggleCompare(prod.id)}
                                  className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                                />
                                <span className="text-[11.5px] font-bold text-[#594047]">Compare</span>
                              </label>
                              <button
                                onClick={() => toggleFavorite(prod.id)}
                                className="p-1.5 bg-white/90 rounded-md text-[#594047] hover:text-[#b90064] transition-colors shadow-xs"
                                title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                              >
                                <Heart className={`w-4 h-4 ${isFav ? 'fill-[#b90064] text-[#b90064]' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-5 flex flex-col flex-1">
                            <div className="mb-2">
                              <h3 className="font-bold text-[15px] text-[#1c1b1b] line-clamp-2 mb-1 group-hover:text-[#b90064] transition-colors leading-snug">
                                {prod.title}
                              </h3>
                              <p className="text-[12.5px] text-[#594047] flex items-center gap-1">
                                <Store className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                                <span className="truncate">{prod.supplierName}</span>
                                <span className="text-[#8c7077] mx-1">•</span>
                                <span>{prod.supplierLocation}</span>
                              </p>
                            </div>

                            {/* Verification Tag Chips */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="bg-[#f0edec] text-[#1c1b1b] font-semibold text-[11.5px] px-2.5 py-1 rounded-md">
                                MOQ: {prod.moq}
                              </span>
                              <span className="bg-[#f0edec] text-[#1c1b1b] font-semibold text-[11.5px] px-2.5 py-1 rounded-md">
                                Ships in 7-10 Days
                              </span>
                            </div>

                            {/* Premium Tiered Pricing Box */}
                            <div className="bg-[#fcf9f8] rounded-xl p-3 mb-4 border border-[#e8e8e8] shadow-2xs">
                              <span className="block text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider mb-2">
                                Tiered Pricing
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between border-r border-[#e8e8e8] pr-2.5">
                                  <span className="text-[12px] font-semibold text-[#594047]">100u:</span>
                                  <span className="text-[13px] font-bold text-[#1c1b1b]">₹{prod.priceMin || 350}</span>
                                </div>
                                <div className="flex justify-between pl-2.5">
                                  <span className="text-[12px] font-semibold text-[#594047]">500u:</span>
                                  <span className="text-[13px] font-bold text-[#b90064]">₹{Math.round((prod.priceMin || 350) * 0.8)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action CTAs */}
                            <div className="flex flex-col gap-2 mt-auto">
                              <button
                                onClick={() => onOpenEnquiryModal(prod)}
                                className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-xl shadow-xs transition-opacity cursor-pointer text-center"
                              >
                                Get Quick Quote
                              </button>
                              <button
                                onClick={() => {
                                  onOpenEnquiryModal({
                                    ...prod,
                                    title: `[Sample Request] ${prod.title}`
                                  });
                                }}
                                className="w-full border border-[#e8e8e8] hover:border-[#b90064] hover:text-[#b90064] text-[#594047] font-bold text-[13px] py-2.5 rounded-xl transition-all cursor-pointer text-center bg-transparent"
                              >
                                Request Sample
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Suppliers Directory View */}
          {activeTab === 'suppliers' && (
            <div>
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8e8] p-8">
                  <Building2 className="w-12 h-12 text-[#8c7077] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#1c1b1b]">No verified suppliers found for this filter</h3>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-4">
                    Try selecting "All India Hubs" or clearing category filters to view all audited manufacturers.
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    className="bg-[#b90064] text-white font-bold px-6 py-2.5 rounded-lg text-[13px] shadow-sm hover:bg-[#8e004b] transition-colors"
                  >
                    Reset Location &amp; Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredSuppliers.map((sup) => {
                      const saved = isSupplierSaved ? isSupplierSaved(sup.id) : false;
                      return (
                        <motion.div
                          key={sup.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -10 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="bg-white rounded-xl border border-[#e8e8e8] p-5 shadow-2xs hover:border-[#8c7077] transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-[#b90064] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                  {sup.shortCode}
                                </div>
                                <div>
                                  <h3 className="font-bold text-[15px] text-[#1c1b1b]">{sup.name}</h3>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <p className="text-[12px] text-[#594047]">
                                      📍 {sup.city}, {sup.state}
                                    </p>
                                    {onOpenMapModal && (
                                      <button
                                        onClick={() => onOpenMapModal(sup)}
                                        className="text-[11px] font-bold text-[#b90064] hover:text-[#8e004b] bg-[#fde7f3] hover:bg-[#fbd0e8] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                        title="View manufacturer proximity to shipping ports, airports and raw material hubs"
                                      >
                                        <MapPin className="w-3 h-3" />
                                        <span>View on Map</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {onToggleSaveSupplier && (
                                  <button
                                    onClick={() => onToggleSaveSupplier(sup.id, sup.name)}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      saved
                                        ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064]'
                                        : 'bg-white border-[#e8e8e8] text-[#8c7077] hover:text-[#b90064] hover:border-[#b90064]'
                                    }`}
                                    title={saved ? 'Remove from Saved Suppliers' : 'Save Supplier'}
                                  >
                                    {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                  </button>
                                )}
                                <span className="text-[11px] font-bold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-full block">
                                  {sup.trustScore}/100 Trust
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 my-3">
                              {sup.categories.map((cat, idx) => (
                                <span key={idx} className="bg-[#f7f2f2] text-[#1c1b1b] text-[11px] px-2.5 py-1 rounded-md font-medium">
                                  {cat}
                                </span>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11.5px] text-[#594047] py-2.5 border-t border-b border-[#e8e8e8] my-3">
                              <div>
                                <span className="text-[#8c7077] block text-[10px] uppercase">Min Order Value</span>
                                <strong className="text-[#1c1b1b]">{sup.minOrderValue}</strong>
                              </div>
                              <div>
                                <span className="text-[#8c7077] block text-[10px] uppercase">Response SLA</span>
                                <strong className="text-[#0050d6]">{sup.responseTime} ({sup.responseRate})</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() =>
                                onOpenEnquiryModal({
                                  title: `Supplier Partnership Inquiry: ${sup.name}`,
                                  supplierName: sup.name,
                                  supplierLocation: `${sup.city}, ${sup.state}`,
                                  image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80'
                                })
                              }
                              className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[12px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Contact Supplier
                            </button>
                            <a
                              href={`https://wa.me/${sup.whatsapp}?text=Hi%20${encodeURIComponent(sup.name)},%20I%20found%20your%20verified%20profile%20on%20Nexora%20Luxe.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-[12px] font-bold"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OEM / Private Label Hub */}
          {activeTab === 'oem' && (
            <div>
              {filteredOem.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8e8] p-8">
                  <FlaskConical className="w-12 h-12 text-[#8c7077] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#1c1b1b]">No OEM formulations found</h3>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-4">
                    Adjust your category or location filters to discover private label contract developers.
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    className="bg-[#b90064] text-white font-bold px-6 py-2.5 rounded-lg text-[13px] shadow-sm hover:bg-[#8e004b] transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredOem.map((oem) => (
                      <motion.div
                        key={oem.id}
                        layout
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -10 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="bg-white rounded-xl border border-[#e8e8e8] p-5 shadow-2xs hover:border-[#8c7077] transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                      >
                        <div className="flex gap-4 items-start">
                          <img
                            src={oem.image}
                            alt={oem.title}
                            className="w-20 h-20 rounded-xl object-cover border border-[#e8e8e8] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-[#fde7f3] text-[#b90064] font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                                OEM Formulation
                              </span>
                              <span className="text-[12px] text-[#594047]">📍 {oem.location}</span>
                            </div>
                            <h3 className="font-bold text-[15px] text-[#1c1b1b]">{oem.title}</h3>
                            <p className="text-[12px] text-[#594047] mt-0.5">
                              Lab Developer: <strong>{oem.developer}</strong> • Capacity: {oem.batchCapacity}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {oem.tags.map((t, idx) => (
                                <span key={idx} className="bg-[#f0f5ff] text-[#0050d6] text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#e8e8e8]">
                          <div className="text-right">
                            <span className="text-[11px] text-[#8c7077] block">Target Unit Cost</span>
                            <strong className="text-[15px] font-bold text-[#b90064]">{oem.targetPrice}</strong>
                            <span className="text-[10px] text-[#594047] block">MOQ: {oem.moq}</span>
                          </div>
                          <button
                            onClick={() =>
                              onOpenEnquiryModal({
                                title: `OEM Private Label Inquiry: ${oem.title}`,
                                supplierName: oem.developer,
                                supplierLocation: oem.location,
                                moq: oem.moq,
                                price: oem.targetPrice,
                                image: oem.image
                              })
                            }
                            className="w-full sm:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[12px] px-5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            Request OEM Dossier &amp; Sample
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Floating Comparison Dock */}
      {comparedProducts.length > 0 && (
        <div
          id="floating-compare-dock"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-5 py-3.5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-[92%] max-w-3xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center justify-between w-full sm:w-auto sm:block shrink-0">
            <div>
              <span className="font-bold text-[14px] text-[#1c1b1b] block">Compare Products</span>
              <span className="text-[12px] font-semibold text-[#b90064]">
                {comparedProducts.length}/4 Selected
              </span>
            </div>
            <button
              onClick={() => setComparedProductIds([])}
              className="sm:hidden text-[12px] font-semibold text-[#8c7077] hover:text-red-600"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-1 overflow-x-auto no-scrollbar py-1">
            {comparedProducts.map((prod) => (
              <div
                key={prod.id}
                className="w-12 h-12 rounded-lg border border-[#e8e8e8] overflow-hidden relative group shrink-0 shadow-2xs"
              >
                <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleCompare(prod.id)}
                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-opacity"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 4 - comparedProducts.length) }).map((_, idx) => (
              <div
                key={idx}
                className="w-12 h-12 rounded-lg border border-dashed border-[#e0bec6] flex items-center justify-center text-[#8c7077] shrink-0"
              >
                <span className="text-xs">+</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setComparedProductIds([])}
              className="hidden sm:block text-[12px] font-semibold text-[#594047] hover:text-red-600 transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              id="open-compare-specs-btn"
              onClick={() => setIsCompareModalOpen(true)}
              className="w-full sm:w-auto bg-[#0050d6] hover:bg-[#0040ab] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-xs transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Compare Specs
            </button>
          </div>
        </div>
      )}

      {/* Product Comparison Modal */}
      <ProductCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        products={comparedProducts}
        onRemoveProduct={(id) => toggleCompare(id)}
        onOpenEnquiry={(product) => onOpenEnquiryModal(product)}
      />

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in">
          <div className="bg-white w-[85%] max-w-sm h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e8e8e8] mb-4">
                <h3 className="font-bold text-lg text-[#1c1b1b]">Filter Products</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-[#8c7077]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category mobile checkboxes */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase text-[#8c7077]">Categories</h4>
                {['Haircare', 'Skincare', 'Body Care', 'Salon Equipment', 'Packaging'].map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-[#1c1b1b]">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded text-[#b90064] accent-[#b90064]"
                    />
                    {cat}
                  </label>
                ))}
              </div>

              {/* MOQ radio options */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase text-[#8c7077]">MOQ Tier</h4>
                {[
                  { id: 'all', label: 'All MOQs' },
                  { id: 'lt_100', label: '< 100 units' },
                  { id: '100_500', label: '100 - 500 units' },
                  { id: 'gt_500', label: '500+ units' }
                ].map((tier) => (
                  <label key={tier.id} className="flex items-center gap-2 text-sm text-[#1c1b1b]">
                    <input
                      type="radio"
                      name="m-moq"
                      checked={selectedMoqTier === tier.id}
                      onChange={() => setSelectedMoqTier(tier.id as any)}
                      className="text-[#b90064] accent-[#b90064]"
                    />
                    {tier.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8e8e8] flex gap-2">
              <button
                onClick={handleClearAllFilters}
                className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#594047]"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
