import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, MapPin, ShieldCheck, ArrowLeft, Star, ExternalLink, 
  Calendar, Users, Award, Briefcase, Sparkles, Building2, 
  ChevronRight, ChevronLeft, Check, MessageSquare, FileText, Bookmark, 
  BookmarkCheck, CheckCircle2, SlidersHorizontal, ArrowUpDown, PlusCircle,
  Loader2
} from 'lucide-react';
import { fetchSuppliers } from '../services/supplierService';

interface BrandDirectoryDetailScreenProps {
  onOpenEnquiryModal: (productName: string, supplierName: string) => void;
  onOpenRFQModal: () => void;
  onOpenFacilityTour: (supplierName: string) => void;
  onNavigateToSuppliers: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
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
    isVerified: Boolean(sup.isVerified)
  };
}

export const BrandDirectoryDetailScreen: React.FC<BrandDirectoryDetailScreenProps> = ({
  onOpenEnquiryModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToSuppliers,
  onNavigateToSupplierProfile
}) => {
  const [remoteBrands, setRemoteBrands] = useState<BrandDirectoryItem[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandDirectoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Relevance');
  const [savedBrandIds, setSavedBrandIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll indicator state for categories bar
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const categories = [
    'All', 'Skincare', 'Haircare', 'Cosmetics', 
    'Professional Derma', 'Packaging', 'Clean Beauty', 
    'Ayurvedic & Herbal', 'Fragrance & Deos', 'Salon Equipment'
  ];

  // Live database fetch — replaces the old hard-coded brand cards.
  useEffect(() => {
    let mounted = true;
    setIsLoadingBrands(true);
    const serviceSort =
      sortBy === 'Rating' ? 'rating' :
      sortBy === 'Year Established' ? 'years_established' :
      sortBy === 'Employee Count' ? 'response_time' : 'relevance';

    fetchSuppliers({
      searchQuery,
      category: selectedCategory === 'All' ? 'All' : selectedCategory,
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

  const checkScroll = () => {
    if (filterScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      filterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleSaveBrand = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedBrandIds(prev => {
      const isSaved = prev.includes(id);
      if (isSaved) {
        showToast(`Removed ${name} from your saved shortlist`);
        return prev.filter(item => item !== id);
      } else {
        showToast(`Saved ${name} to your sourcing shortlist`);
        return [...prev, id];
      }
    });
  };

  // Filter & Sort logic — operates only on database-backed rows.
  const filteredBrands = useMemo(() => {
    const list = remoteBrands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            brand.about.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            brand.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            brand.categories.some((cat) => cat.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' ||
        brand.categories.some((cat) => cat.toLowerCase().includes(selectedCategory.toLowerCase()));
      return matchesSearch && matchesCategory;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'Rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'Year Established') {
        return a.establishedYearNum - b.establishedYearNum;
      }
      if (sortBy === 'Employee Count') {
        return b.employeeCountNum - a.employeeCountNum;
      }
      return 0; // Default Relevance
    });
  }, [remoteBrands, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="bg-[#FDFBF7] min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#2A0E3F] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#352B44] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#8236A0] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      
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
            
            {/* Filters & Sorting Bar */}
            <div className="bg-white p-4 border border-[#E8DEEF] rounded-xl flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 shadow-2xs">
              
              {/* Search Bar */}
              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search brands, formulators, active ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] focus:outline-none rounded-lg pl-10 pr-4 py-2 text-xs text-[#2A0E3F] font-medium"
                />
              </div>

              {/* Category Filter Tabs with Gradient Fade & Scroll Indicators */}
              <div className="relative flex-1 min-w-0 max-w-full overflow-hidden flex items-center">
                
                {/* Left Fade Gradient */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                    canScrollLeft ? 'opacity-100' : 'opacity-0'
                  }`} 
                />

                {/* Left Scroll Button */}
                {canScrollLeft && (
                  <button
                    onClick={() => handleScroll('left')}
                    aria-label="Scroll Left"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white shadow-md border border-[#E8DEEF] flex items-center justify-center text-[#5B4A6E] hover:text-[#6B2D8C] hover:border-[#6B2D8C] cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Scrollable Container */}
                <div 
                  ref={filterScrollRef}
                  onScroll={checkScroll}
                  className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth w-full"
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-[#6B2D8C] text-white shadow-3xs'
                          : 'bg-[#F6F1FA] text-[#5B4A6E] hover:bg-[#E8DEEF]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  
                  {/* Category Count Indicator */}
                  <span className="text-[10px] text-[#7E6C96] font-bold bg-[#FDFBF7] border border-[#E8DEEF] px-2 py-1 rounded-full shrink-0 whitespace-nowrap ml-1">
                    +{categories.length - 4} more
                  </span>
                </div>

                {/* Right Fade Gradient */}
                <div 
                  className={`absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                    canScrollRight ? 'opacity-100' : 'opacity-0'
                  }`} 
                />

                {/* Right Scroll Button */}
                {canScrollRight && (
                  <button
                    onClick={() => handleScroll('right')}
                    aria-label="Scroll Right"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white shadow-md border border-[#E8DEEF] flex items-center justify-center text-[#5B4A6E] hover:text-[#6B2D8C] hover:border-[#6B2D8C] cursor-pointer transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#F4F0E9]">
                <div className="flex items-center gap-1.5 text-xs text-[#5B4A6E] font-bold">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#6B2D8C]" />
                  <span>Sort by:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FDFBF7] border border-[#E8DEEF] text-xs font-semibold text-[#2A0E3F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A961] cursor-pointer"
                >
                  <option value="Relevance">Relevance</option>
                  <option value="Rating">Rating (Highest First)</option>
                  <option value="Year Established">Year Established (Oldest First)</option>
                  <option value="Employee Count">Employee Count (Largest First)</option>
                </select>
              </div>

            </div>

            {/* Inline Sourcing RFQ CTA Banner */}
            <div className="bg-gradient-to-r from-[#fff5f8] via-[#FDFBF7] to-[#fbf0f4] border border-[#f5d0de] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F5EEF8] text-[#6B2D8C] flex items-center justify-center shrink-0 border border-[#f5d0de]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs md:text-sm text-zinc-900 leading-tight">
                    Looking for custom beauty formulations, private label batches, or bespoke packaging?
                  </h4>
                  <p className="text-[11px] md:text-xs text-[#5B4A6E] mt-0.5">
                    Post your requirement once to receive custom quotes, lab trial terms, and verified MOQ offers from audited GMP factories within 24 hours.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenRFQModal}
                className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap self-stretch md:self-auto justify-center"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Post Custom Brand RFQ</span>
              </button>
            </div>

            {/* Brands & Manufacturers Grid */}
            {isLoadingBrands && remoteBrands.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-[#6B2D8C] animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#5B4A6E]">Loading suppliers &amp; brands from the live directory…</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredBrands.map((brand) => {
                const isSaved = savedBrandIds.includes(brand.id);

                return (
                  <div 
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand)}
                    className="bg-white border border-[#E8DEEF] hover:border-[#6B2D8C] hover:shadow-md rounded-2xl p-5 md:p-6 transition-all flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div className="space-y-4">
                      
                      {/* Brand Banner / Logo & Bookmark Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={brand.logo} 
                            alt={brand.name} 
                            className="w-13 h-13 rounded-xl object-cover border border-[#E8DEEF] shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-zinc-900 group-hover:text-[#6B2D8C] transition-colors flex items-center gap-1 truncate">
                              <span className="truncate">{brand.name}</span>
                              <ShieldCheck className="w-4 h-4 text-[#6B2D8C] fill-[#F5EEF8] shrink-0" />
                            </h3>
                            <span className="text-[11px] text-[#5B4A6E] font-semibold truncate block">{brand.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          <button
                            onClick={(e) => toggleSaveBrand(brand.id, brand.name, e)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isSaved 
                                ? 'bg-[#F5EEF8] text-[#6B2D8C] border border-[#D9C3E8]' 
                                : 'bg-[#F6F1FA] text-zinc-400 hover:text-[#6B2D8C] hover:bg-[#F5EEF8]'
                            }`}
                            title={isSaved ? "Saved in Shortlist" : "Bookmark / Save"}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4 fill-[#6B2D8C]" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                          {brand.isVerified === false || brand.status === 'pending_verification' ? (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-amber-200">
                              Pending Verification
                            </span>
                          ) : (
                            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                              GST Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#5B4A6E] leading-relaxed line-clamp-3">
                        {brand.about}
                      </p>

                      {/* Key Verified Sourcing Metrics Grid (Unclipped, clean responsive layout) */}
                      <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#E8DEEF] space-y-2.5 my-2">
                        <div className="grid grid-cols-2 gap-2.5 text-[11px] text-[#5B4A6E]">
                          <div className="flex items-center gap-1.5 min-w-0" title={`Location: ${brand.location}`}>
                            <MapPin className="w-3.5 h-3.5 text-[#6B2D8C] shrink-0" />
                            <span className="truncate font-semibold">{brand.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 min-w-0" title={`Established: ${brand.established}`}>
                            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">Est: <span className="font-bold text-zinc-900">{brand.established}</span></span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0" title={`Employees: ${brand.employees}`}>
                            <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">Team: <span className="font-bold text-zinc-900">{brand.employees}</span></span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0" title={`Rating: ${brand.rating} out of 5 (${brand.reviewsCount} verified audits)`}>
                            <div className="bg-[#fff8e6] text-[#92400e] border border-[#ffe082] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-black shrink-0">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              <span>{brand.rating}</span>
                            </div>
                            <span className="text-[10.5px] text-[#7E6C96] font-semibold">({brand.reviewsCount})</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E8DEEF] flex items-center justify-between text-[10px] text-[#7E6C96]">
                          <span className="font-semibold">Capacity: <span className="text-zinc-900 font-bold">{brand.capacity}</span></span>
                          <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">Response: {brand.responseRate}</span>
                        </div>
                      </div>

                      {/* Certification chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {brand.certifications.map((cert) => (
                          <span key={cert} className="text-[9.5px] bg-[#F6F1FA] text-zinc-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border border-[#E8DEEF]/50">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Direct Contact & Quick Action CTAs Row */}
                    <div className="mt-5 pt-4 border-t border-[#E8DEEF] space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEnquiryModal(`Direct Manufacturing Enquiry`, brand.name);
                          }}
                          className="bg-white border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#F5EEF8] font-bold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Direct Message</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRFQModal();
                          }}
                          className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Request Quote</span>
                        </button>
                      </div>

                      {/* Primary Navigation Action */}
                      <div className="flex items-center justify-between text-xs font-bold text-[#6B2D8C] group-hover:text-[#4A2560] pt-1">
                        <span>View Formulations &amp; Facility</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {filteredBrands.length === 0 && (
              <div className="bg-white border border-[#E8DEEF] rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto shadow-2xs space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#F5EEF8] text-[#6B2D8C] flex items-center justify-center mx-auto border border-[#f5d0de]">
                  <Building2 className="w-7 h-7" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base md:text-lg text-zinc-950">
                    No formulation brands found
                  </h3>
                  <p className="text-xs text-[#5B4A6E] leading-relaxed max-w-md mx-auto">
                    {searchQuery 
                      ? `We couldn't find an existing listed manufacturer matching "${searchQuery}". Submit a custom RFQ to have our verified supplier network quote your exact specifications.`
                      : `No manufacturers found in the "${selectedCategory}" category. Post a custom RFQ to connect with unlisted certified formulators.`
                    }
                  </p>
                </div>

                {/* Prominent RFQ Placement for Empty State */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button 
                    onClick={onOpenRFQModal}
                    className="w-full sm:w-auto bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Post Custom Brand RFQ</span>
                  </button>

                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSortBy('Relevance'); }}
                    className="w-full sm:w-auto bg-[#F6F1FA] hover:bg-[#E8DEEF] text-zinc-700 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Clear all search filters
                  </button>
                </div>
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
