import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, MapPin, ShieldCheck, ArrowLeft, Star,
  Award, Briefcase, Sparkles, Building2, Eye,
  Check, MessageSquare, FileText,
  SlidersHorizontal, ArrowUpDown,
  Loader2, SearchX, RotateCcw, X
} from 'lucide-react';
import { fetchSuppliers } from '../services/supplierService';

interface BrandDirectoryDetailScreenProps {
  onOpenEnquiryModal: (productName: string, supplierName: string) => void;
  onOpenRFQModal: (supplier?: { id?: string; name?: string; category?: string; type?: string }) => void;
  onOpenFacilityTour: (supplierName?: string, location?: string) => void;
  onNavigateToSuppliers: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
  onOpenChat?: (
    supplier: { id: string; name: string; location: string; isVerified: boolean },
    product?: { title: string; image: string; price?: string; moq?: string }
  ) => void;
}

interface BrandDirectoryItem {
  id: string;
  name: string;
  logo: string;
  type: string;
  rating: number;
  reviewsCount: number;
  location: string;
  established: string;
  establishedYearNum: number;
  employees: string;
  employeeCountNum: number;
  capacity: string;
  responseRate: string;
  gstVerified: boolean;
  certifications: string[];
  about: string;
  categories: string[];
  products: Array<{ id: string; name: string; price: string; moq: string; image: string }>;
  facilities: Array<{ title: string; desc: string }>;
  status?: string;
  isVerified?: boolean;
}
/** Map a live `profiles_supplier` row into the brand-directory card shape. */
function mapSupplierToBrand(sup: any): BrandDirectoryItem {
  const c = sup.categories || [];
  const firstCat = c[0] || 'Beauty';
  const logo = sup.logo_url || sup.cover_image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80';
  const year = sup.establishedYear || sup.year_established || String(new Date().getFullYear());
  const yearNum = parseInt(String(year).match(/\d{4}/)?.[0] || '0', 10) || new Date().getFullYear();
  const about = sup.about || sup.brand_name || `${sup.name || sup.company_name} — ${sup.type || 'B2B Beauty Supplier'}`;
  const certs = sup.certificationsList || [
    ...(sup.isGstVerified ? ['GST Verified'] : []),
    ...(sup.isIsoCertified ? ['ISO 9001'] : []),
    ...(sup.isGmpCertified ? ['GMP'] : []),
    ...(sup.isFdaRegistered ? ['FDA'] : [])
  ];

  return {
    id: sup.id,
    name: sup.name || sup.company_name,
    logo,
    type: sup.type || sup.business_type || 'Supplier',
    rating: sup.overallRating || sup.trustScore / 20 || 4.6,
    reviewsCount: sup.totalReviewsCount || 0,
    location: `${sup.city || ''}, ${sup.state || ''}`.replace(/^,\s*|,\s*$/g, '') || 'India',
    established: year,
    establishedYearNum: yearNum,
    employees: sup.employeeCount || 'Contact for Details',
    employeeCountNum: sup.employeeCountNumber || 0,
    capacity: sup.monthlyCapacity || 'Contact for Capacity',
    responseRate: sup.responseRate || '95%',
    gstVerified: Boolean(sup.isGstVerified),
    certifications: certs,
    about,
    categories: c.length > 0 ? c : [firstCat],
    products: (sup.portfolioProducts || []).map((p: any) => ({
      id: p.id || `${sup.id}-${Math.random().toString(36).slice(2)}`,
      name: p.name || 'Contact for product catalog',
      price: p.price || 'Contact for price',
      moq: p.moq || 'Contact for MOQ',
      image: p.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=60'
    })),
    facilities: [],
    status: sup.status,
    isVerified: Boolean(sup.isVerified || (sup.trustScore && sup.trustScore >= 80) || sup.isGstVerified)
  };
}

export const BrandDirectoryDetailScreen: React.FC<BrandDirectoryDetailScreenProps> = ({
  onOpenEnquiryModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToSuppliers,
  onNavigateToSupplierProfile,
  onOpenChat
}) => {
  const [remoteBrands, setRemoteBrands] = useState<BrandDirectoryItem[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandDirectoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Relevance');

  // Simplified primary navigation — only the 5 essential sourcing categories.
  const categories = ['All', 'Skincare', 'Haircare', 'Cosmetics', 'Packaging'];

  // Live supplier rows use longer taxonomy labels (e.g. "Skincare & Serums",
  // "Eco Packaging", "Hair Treatments"); map each short pill to the keywords
  // that identify it so the simplified tabs still match live data.
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    Skincare: ['skincare', 'skin', 'serum', 'cosmeceutical', 'derma', 'clinical', 'organic', 'herbal', 'ayurved'],
    Haircare: ['haircare', 'hair', 'keratin', 'scalp'],
    Cosmetics: ['cosmetic', 'makeup', 'colour', 'color', 'lip', 'nail', 'fragrance', 'deo'],
    Packaging: ['packaging', 'pack', 'bottle', 'jar', 'container', 'pump', 'tube']
  };

  // Live database fetch — replaces the old hard-coded brand cards.
  useEffect(() => {
    let mounted = true;
    setIsLoadingBrands(true);
    const serviceSort = sortBy === 'Top Rated' ? 'rating' : 'relevance';

    fetchSuppliers({
      searchQuery,
      // Fetch the full database-backed supplier set; the simplified category
      // pills filter the live rows client-side via CATEGORY_KEYWORDS. The
      // `/suppliers` page uses the exact `.eq(...)` filter in supplierService.
      category: 'All',
      sortBy: serviceSort,
      verifiedOnly: false,
      limit: 100
    })
      .then((res) => {
        if (mounted) {
          setRemoteBrands((res.data || []).map(mapSupplierToBrand));
        }
      })
      .catch((err) => {
        console.warn('Brand directory fetch failed:', err);
        if (mounted) setRemoteBrands([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingBrands(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchQuery, selectedCategory, sortBy]);

  // Reset every active filter back to its default — used by the empty state
  // so buyers can recover from a zero-result search in one click.
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('Relevance');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All';

  const brandMatchesCategory = (brand: BrandDirectoryItem) => {
    if (selectedCategory === 'All') return true;
    const keywords = CATEGORY_KEYWORDS[selectedCategory] || [selectedCategory.toLowerCase()];
    return brand.categories.some((cat) => {
      const label = cat.toLowerCase();
      return keywords.some((keyword) => label.includes(keyword));
    });
  };

  // Filter & Sort logic — operates only on database-backed rows.
  const filteredBrands = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const list = remoteBrands.filter((brand) => {
      const matchesSearch =
        !query ||
        brand.name.toLowerCase().includes(query) ||
        brand.about.toLowerCase().includes(query) ||
        brand.location.toLowerCase().includes(query) ||
        brand.categories.some((cat) => cat.toLowerCase().includes(query));
      return matchesSearch && brandMatchesCategory(brand);
    });

    // Only two sorts remain: Relevance (service order) and Top Rated.
    if (sortBy === 'Top Rated') {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteBrands, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="bg-[#FDFBF7] min-h-screen">

      {/* Banner / Navigation Header */}
      <div className="bg-white border-b border-[#E8DEEF] py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#6B2D8C] uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Nexora Partner Brands &amp; Contract Formulators</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#2A0E3F] tracking-tight">
              {selectedBrand ? selectedBrand.name : 'Brand Directory & OEM Manufacturers'}
            </h1>
            <p className="text-xs text-[#5B4A6E] mt-1">
              {selectedBrand 
                ? `${selectedBrand.type} • GST Registered Manufacturer`
                : 'Directly connect with audited beauty brands, contract formulators, and GMP certified manufacturing plants.'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedBrand ? (
              <button 
                onClick={() => setSelectedBrand(null)}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#E8DEEF] hover:bg-neutral-50 rounded-lg text-xs font-bold text-zinc-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </button>
            ) : (
              <button
                onClick={onOpenRFQModal}
                className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Post Custom Brand RFQ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {!selectedBrand ? (
          /* ================== DIRECTORY VIEW ================== */
          <div className="space-y-8 pb-12">
            
            {/* Simplified Filters & Sorting Bar — search, 5 essential
                category pills, and a 2-option sort. No scroll chrome. */}
            <div className="bg-white p-4 border border-[#E8DEEF] rounded-xl flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 shadow-2xs">

              {/* Search Bar */}
              <div className="relative w-full lg:w-64 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search brands"
                  className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] focus:outline-none rounded-lg pl-10 pr-8 py-2 text-xs text-[#2A0E3F] font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-[#6B2D8C] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Essential Category Pills */}
              <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#6B2D8C] text-white shadow-3xs'
                        : 'bg-[#F6F1FA] text-[#5B4A6E] hover:bg-[#E8DEEF]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sorting Dropdown — Relevance or Top Rated only */}
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="brand-sort" className="flex items-center gap-1.5 text-xs text-[#5B4A6E] font-bold">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#6B2D8C]" />
                  <span className="hidden sm:inline">Sort:</span>
                </label>
                <select
                  id="brand-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FDFBF7] border border-[#E8DEEF] text-xs font-semibold text-[#2A0E3F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A961] cursor-pointer"
                >
                  <option value="Relevance">Relevance</option>
                  <option value="Top Rated">Top Rated</option>
                </select>
              </div>

            </div>

            {/* Brands & Manufacturers Grid */}
            {isLoadingBrands && remoteBrands.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-[#6B2D8C] animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#5B4A6E]">Loading suppliers &amp; brands from the live directory…</p>
              </div>
            )}

            {/* Dedicated empty state — only after loading finishes with zero
                matches for the current search query / category filters. */}
            {!isLoadingBrands && filteredBrands.length === 0 ? (
              <div
                data-testid="brand-directory-empty-state"
                role="status"
                aria-live="polite"
                className="bg-white border border-[#E8DEEF] rounded-2xl px-6 py-14 md:px-12 md:py-16 text-center max-w-2xl mx-auto shadow-2xs"
              >
                {/* Icon */}
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-[#F5EEF8] border border-[#E8D5F2]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SearchX className="w-8 h-8 text-[#6B2D8C]" strokeWidth={1.75} />
                  </div>
                </div>

                <h3 className="font-extrabold text-lg md:text-xl text-[#2A0E3F]">
                  No brands found
                </h3>
                <p className="text-xs md:text-sm text-[#5B4A6E] mt-2 max-w-sm mx-auto leading-relaxed">
                  Try another search or select a different category
                </p>

                {/* Active filter chips — remind the buyer which filters hid every result */}
                {hasActiveFilters && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {searchQuery.trim() !== '' && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6B2D8C] bg-[#F5EEF8] border border-[#E8D5F2] rounded-full pl-3 pr-1.5 py-1 max-w-[260px]">
                        <Search className="w-3 h-3 shrink-0" />
                        <span className="truncate">“{searchQuery.trim()}”</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search query"
                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center hover:bg-[#E8D5F2] transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedCategory !== 'All' && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6B2D8C] bg-[#F5EEF8] border border-[#E8D5F2] rounded-full pl-3 pr-1.5 py-1 max-w-[260px]">
                        <SlidersHorizontal className="w-3 h-3 shrink-0" />
                        <span className="truncate">{selectedCategory}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('All')}
                          aria-label="Clear category filter"
                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center hover:bg-[#E8D5F2] transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Recovery actions */}
                <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="w-full sm:w-auto bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear all search filters</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNavigateToSuppliers}
                      className="w-full sm:w-auto bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Browse all suppliers</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenRFQModal}
                    className="w-full sm:w-auto bg-white border border-[#E8DEEF] hover:border-[#6B2D8C] text-[#6B2D8C] font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Post Custom Brand RFQ</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrands.map((brand) => {
                // One primary verification tag on the card; ISO / FDA /
                // AYUSH / MoCRA detail is hidden here and lives on the profile.
                const isPending = !brand.isVerified && brand.status === 'pending_verification';

                return (
                  <div
                    key={brand.id}
                    className="bg-white border border-[#E8DEEF] hover:border-[#6B2D8C] hover:shadow-md rounded-2xl p-5 transition-all flex flex-col"
                  >
                    {/* Logo, brand name and the single primary tag */}
                    <div className="flex items-center gap-3">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E8DEEF] shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-zinc-900 truncate">
                          {brand.name}
                        </h3>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-[#F5EEF8] text-[#6B2D8C] border-[#E8D5F2]'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          {isPending ? 'Pending Audit' : 'WHO-GMP Certified'}
                        </span>
                      </div>
                    </div>

                    {/* Location + rating — the only metrics shown */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 min-w-0 text-[11px] text-[#5B4A6E] font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#6B2D8C] shrink-0" />
                        <span className="truncate">{brand.location}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-[#fff8e6] text-[#92400e] border border-[#ffe082] px-1.5 py-0.5 rounded-md text-[11px] font-black shrink-0">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {brand.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Exactly two direct actions per card */}
                    <div className="mt-4 pt-4 border-t border-[#E8DEEF] grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenChat) {
                            onOpenChat({
                              id: brand.id,
                              name: brand.name,
                              location: brand.location,
                              isVerified: Boolean(brand.isVerified || brand.gstVerified)
                            });
                          } else {
                            onOpenEnquiryModal('Direct Manufacturing Enquiry', brand.name);
                          }
                        }}
                        className="bg-white border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#F5EEF8] font-bold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contact Supplier</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBrand(brand)}
                        className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

          </div>
        ) : (
          /* ================== BRAND DETAIL VIEW ================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
            
            {/* Left: Brand Story & Manufacturing capacity (col-span-8) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Cover Card */}
              <div className="bg-white border border-[#E8DEEF] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedBrand.logo} 
                      alt={selectedBrand.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-[#E8DEEF]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-xl font-extrabold text-zinc-900">{selectedBrand.name}</h2>
                        <ShieldCheck className="w-5 h-5 text-[#6B2D8C] fill-[#F5EEF8]" />
                      </div>
                      <p className="text-xs text-[#5B4A6E] font-semibold">{selectedBrand.type}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#6B2D8C]" /> {selectedBrand.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onNavigateToSupplierProfile?.(selectedBrand.id)}
                      className="bg-white border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#F5EEF8] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Visit Mini-Website</span>
                    </button>
                    <button
                      onClick={() => onOpenFacilityTour(selectedBrand.name)}
                      className="border border-[#E8DEEF] text-[#5B4A6E] hover:border-[#6B2D8C] hover:text-[#6B2D8C] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Audit Facility</span>
                    </button>
                    <button
                      onClick={() => onOpenEnquiryModal('Custom Product Development', selectedBrand.name)}
                      className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-xs font-extrabold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Enquire Custom Batch</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-zinc-900">About Manufacturer / Brand Owner</h3>
                  <p className="text-xs text-[#5B4A6E] leading-relaxed">
                    {selectedBrand.about}
                  </p>
                </div>

                {/* Key specs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl text-center">
                  <div>
                    <span className="block text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Established</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block">{selectedBrand.established}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Daily Capacity</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block">{selectedBrand.capacity}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Response Rate</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block text-emerald-600">{selectedBrand.responseRate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">GST Verified</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block text-[#6B2D8C]">Yes</span>
                  </div>
                </div>
              </div>

              {/* Private Label Showcase */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#2A0E3F] flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-[#6B2D8C]" />
                  <span>Available Private Label Formulations</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBrand.products.length === 0 && (
                    <div className="md:col-span-2 p-5 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl text-xs text-[#5B4A6E] font-semibold">
                      Product catalogue will be shared after your enquiry. Use “Enquire Custom Batch” to request current formulations, price bands and MOQ.
                    </div>
                  )}
                  {selectedBrand.products.map((prod) => (
                    <div key={prod.id} className="bg-white border border-[#E8DEEF] rounded-xl overflow-hidden flex flex-col justify-between shadow-3xs">
                      <div className="flex gap-4 p-4">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-20 h-20 rounded-lg object-cover border border-[#E8DEEF] shrink-0"
                        />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-zinc-900 leading-tight">{prod.name}</h4>
                          <p className="text-[11px] text-[#6B2D8C] font-bold">Estimated Cost: {prod.price} <span className="text-zinc-400 font-normal">/ unit</span></p>
                          <p className="text-[10px] text-[#5B4A6E] font-semibold">Min Order Qty: {prod.moq}</p>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 bg-[#FDFBF7] border-t border-[#E8DEEF] flex items-center justify-between">
                        <span className="text-[9.5px] bg-[#F5EEF8] text-[#6B2D8C] px-1.5 py-0.5 rounded font-bold uppercase">Formulation Ready</span>
                        <button
                          onClick={() => onOpenEnquiryModal(prod.name, selectedBrand.name)}
                          className="text-xs font-bold text-[#6B2D8C] hover:underline cursor-pointer"
                        >
                          Get Best Price Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facility & GMP Compliance details */}
              <div className="bg-white border border-[#E8DEEF] rounded-xl p-6 space-y-4 shadow-3xs">
                <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#6B2D8C]" />
                  <span>State of the Art Facilities &amp; Standards</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedBrand.facilities.length === 0 && (
                    <div className="md:col-span-3 p-4 bg-[#FDFBF7] border border-[#E8DEEF] rounded-lg text-xs text-[#5B4A6E] font-semibold">
                      Facility &amp; compliance audit documents are available on request.
                    </div>
                  )}
                  {selectedBrand.facilities.map((fac, i) => (
                    <div key={i} className="p-4 bg-[#FDFBF7] border border-[#E8DEEF] rounded-lg">
                      <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B2D8C]" />
                        {fac.title}
                      </h4>
                      <p className="text-[11px] text-[#5B4A6E] leading-relaxed">{fac.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Supplier trust check sidebar (col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Sourcing credentials check */}
              <div className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-4 shadow-3xs">
                <h3 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wider text-[#7E6C96]">Trust &amp; Verification Signals</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${selectedBrand.gstVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">
                        {selectedBrand.gstVerified ? 'GST Registration Confirmed' : 'GST Verification Pending'}
                      </span>
                      <span className="block text-[10.5px] text-[#5B4A6E]">
                        {selectedBrand.gstVerified ? 'Corporate tax filings fully checked & active.' : 'Supplier is live; submitting GST documents for review.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${selectedBrand.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">
                        {selectedBrand.isVerified ? 'Nexora Verified Supplier' : 'Nexora Review In Progress'}
                      </span>
                      <span className="block text-[10.5px] text-[#5B4A6E]">
                        {selectedBrand.isVerified ? 'GMP, ISO and quality compliance audits passed.' : 'Approved suppliers receive the Nexora Verified badge after review.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">Stable Response rate (98%)</span>
                      <span className="block text-[10.5px] text-[#5B4A6E]">Usually responds within 2-4 business hours.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Consultation contact widget */}
              <div className="bg-gradient-to-br from-[#6B2D8C] to-[#4A2560] text-white rounded-xl p-6 space-y-4 shadow-sm text-center md:text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#f5ced8]">Turn-Key Service</h3>
                <h4 className="font-black text-lg leading-tight">Need custom beauty formulation?</h4>
                <p className="text-xs text-[#f5ced8] leading-relaxed">
                  Let us connect you directly with Aura formulation specialists to build your private label brand catalogs from scratch.
                </p>
                <button
                  onClick={() => onOpenEnquiryModal('Beauty private label consulting', selectedBrand.name)}
                  className="w-full py-3 bg-white hover:bg-neutral-50 text-[#6B2D8C] font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Request Consultation Call
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
