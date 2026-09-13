import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CATEGORY_TAXONOMY } from '../data/categories';
import { SUPPLIER_DIRECTORY_SEED } from '../data/supplierDirectorySeed';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  ShieldCheck,
  Award,
  BadgeCheck,
  FileCheck2,
  Phone,
  Send,
  MessageSquare,
  FolderDown,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  X,
  Grid,
  List as ListIcon,
  Map as MapIcon,
  Sparkles,
  ArrowRight,
  Factory,
  Mail,
  Lock,
  Unlock,
  Package,
  Clock,
  TrendingUp,
  Truck,
  Leaf,
  Building2,
  ExternalLink,
  CheckCircle2,
  Download,
  Info,
  Video,
  Star,
  Check,
  FlaskConical
} from 'lucide-react';
import { VerifiedSupplier } from '../types';
import { fetchSuppliers } from '../services/supplierService';
import { VerifiedBadge } from './VerifiedBadge';
import { Reveal } from './luxe/Reveal';

// ----------------------------------------------------------------------------
// Shared helpers & presentational pieces for the Supplier Directory
// ----------------------------------------------------------------------------

type BusinessKind = 'Manufacturer' | 'Wholesaler' | 'Distributor' | 'Exporter' | 'OEM/ODM';

/** Map a supplier's free-form `type` string onto one of the filter kinds. */
export function supplierTypeMatches(type: string, kind: BusinessKind): boolean {
  const t = type.toLowerCase();
  switch (kind) {
    case 'Manufacturer':
      return t.includes('manufacturer') || t.includes('formulator') || t.includes('contract manufacturer');
    case 'Wholesaler':
      return t.includes('wholesaler') || t.includes('stockist');
    case 'Distributor':
      return t.includes('distributor');
    case 'Exporter':
      return t.includes('exporter');
    case 'OEM/ODM':
      return t.includes('oem') || t.includes('private label');
    default:
      return t.includes(String(kind).toLowerCase());
  }
}

/** Skeleton placeholder shown while the list is loading / filtering. */
const SupplierCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-[#E8DEEF] flex flex-col lg:flex-row gap-6 animate-pulse">
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-[#F1EAF4]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-[#F1EAF4]" />
          <div className="h-3 w-1/2 rounded bg-[#F1EAF4]" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 py-3.5 px-4 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-[#F1EAF4]" />
        ))}
      </div>
      <div className="h-9 w-2/3 rounded-xl bg-[#F1EAF4]" />
    </div>
    <div className="w-full lg:w-80 flex flex-col gap-2.5">
      <div className="h-4 w-1/2 rounded bg-[#F1EAF4]" />
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-[#F1EAF4]" />
        ))}
      </div>
    </div>
  </div>
);

/** Explicit empty state shown when no supplier matches the active filters. */
const SupplierDirectoryEmptyState: React.FC<{ onReset: () => void; activeFilterCount: number }> = ({
  onReset,
  activeFilterCount
}) => (
  <div className="bg-white border border-[#E8DEEF] rounded-2xl p-10 md:p-14 flex flex-col items-center justify-center text-center shadow-xs">
    <div className="w-16 h-16 rounded-full bg-[#F5EEF8] flex items-center justify-center mb-5">
      <Search className="w-7 h-7 text-[#6B2D8C]" />
    </div>
    <h3 className="text-lg font-bold text-[#2A0E3F] mb-2">No Suppliers Found</h3>
    <p className="text-[13.5px] text-[#5B4A6E] max-w-md mb-6 font-medium">
      {activeFilterCount > 0
        ? `No suppliers match the ${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}. Try broadening your search or clearing the filters to see the full directory.`
        : 'No suppliers match your search. Try a different keyword or reset the filters.'}
    </p>
    <button
      onClick={onReset}
      className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-[13px] font-bold px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
    >
      <X className="w-4 h-4" />
      <span>Reset Filters</span>
    </button>
  </div>
);

/** Count how many filter controls are currently active (for the empty state). */
function countActiveFilters(args: {
  searchInput: string;
  selectedCity: string;
  distanceRadius: string;
  activeBusinessType: string;
  businessTypeFilters: string[];
  selectedCategory: string;
  selectedSubcategory: string;
  moqValue: number;
  capacityFilter: string;
  leadTimeFilter: string;
  quickFilters: Record<string, boolean>;
  complianceFilters: Record<string, boolean>;
}): number {
  let n = 0;
  if (args.searchInput.trim()) n++;
  if (args.selectedCity.trim()) n++;
  if (args.distanceRadius !== 'National') n++;
  if (args.activeBusinessType !== 'All') n++;
  n += args.businessTypeFilters.length;
  if (args.selectedCategory) n++;
  if (args.selectedSubcategory) n++;
  if (args.moqValue < 5000) n++;
  if (args.capacityFilter !== 'Any Capacity') n++;
  if (args.leadTimeFilter !== 'Any Lead Time') n++;
  n += Object.values(args.quickFilters).filter(Boolean).length;
  n += Object.values(args.complianceFilters).filter(Boolean).length;
  return n;
}

interface SupplierDirectoryScreenProps {
  isSupplierSaved?: (id: string) => boolean;
  onToggleSaveSupplier?: (id: string, name?: string) => void;
  onOpenEnquiryModal: (item: any) => void;
  onOpenQuoteModal: (rfq?: any) => void;
  onOpenRFQModal: (supplier?: { id?: string; name?: string; category?: string; type?: string }) => void;
  onOpenMapModal?: (supplier: VerifiedSupplier) => void;
  onOpenFacilityTour?: (supplier: VerifiedSupplier) => void;
  onNavigateToExplore?: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
  onNavigateToProductDetail?: (productId: string) => void;
  onOpenComparisonModal?: (selectedSuppliers: VerifiedSupplier[]) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
  onOpenChat?: (
    supplier: { id: string; name: string; location: string; isVerified: boolean },
    product?: { title: string; image: string; price?: string; moq?: string }
  ) => void;
}

export const SupplierDirectoryScreen: React.FC<SupplierDirectoryScreenProps> = ({
  isSupplierSaved,
  onToggleSaveSupplier,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onOpenMapModal,
  onOpenFacilityTour,
  onNavigateToExplore,
  onNavigateToSupplierProfile,
  onNavigateToProductDetail,
  onOpenComparisonModal,
  onCallSupplier,
  onWhatsAppSupplier,
  onOpenChat
}) => {
  // Search & Top Filters State
  // `searchInput` is the immediate, controlled text-field value; `searchQuery`
  // is the debounced value (300ms) that actually drives the filter so we don't
  // re-filter on every keystroke.
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [distanceRadius, setDistanceRadius] = useState('National');

  // Business Type Pill Tab
  const [activeBusinessType, setActiveBusinessType] = useState('All');

  // Quick Filters
  const [quickFilters, setQuickFilters] = useState<{ [key: string]: boolean }>({
    verifiedOnly: false,
    oemPrivateLabel: false,
    readyToSupply: false,
    topRated: false,
    fastResponse: false,
    lowMoq: false,
    panIndia: false
  });

  // Sidebar Filters State
  const [businessTypeFilters, setBusinessTypeFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [moqValue, setMoqValue] = useState<number>(5000);
  // `appliedMoq` is the debounced value (300ms) that actually drives the filter.
  const [appliedMoq, setAppliedMoq] = useState<number>(5000);
  const [capacityFilter, setCapacityFilter] = useState('Any Capacity');
  const [leadTimeFilter, setLeadTimeFilter] = useState('Any Lead Time');

  // Compliance Checkboxes
  const [complianceFilters, setComplianceFilters] = useState<{ [key: string]: boolean }>({
    gst: false,
    iso: false,
    gmp: false,
    fda: false,
    organic: false,
    crueltyFree: false
  });

  // Layout View Mode & Sorting
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('Recommended');

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Source dataset for the directory. It is seeded from the self-contained
  // sample data so every interactive control works out-of-the-box (no Supabase
  // / DB rows required); when the live service returns real supplier rows they
  // take precedence over the seed.
  const [allSuppliers, setAllSuppliers] = useState<VerifiedSupplier[]>(SUPPLIER_DIRECTORY_SEED);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  // True while a (debounced) filter pass is in flight — drives the skeleton UI
  // so large lists show a loading indicator instead of feeling frozen.
  const [isFiltering, setIsFiltering] = useState(false);

  // Load live supplier rows ONCE on mount. The directory is fully interactive
  // off the local seed; this only upgrades the dataset when a backend exists.
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSuppliers(true);

    const serviceSort =
      sortBy === 'Rating' ? 'rating' :
      sortBy === 'Year Established' ? 'years_established' :
      sortBy === 'Employee Count' ? 'response_time' : 'relevance';

    fetchSuppliers({
      businessType: activeBusinessType,
      category: selectedCategory || 'All',
      subcategory: selectedSubcategory || '',
      city: selectedCity || '',
      verifiedOnly: quickFilters.verifiedOnly,
      sortBy: serviceSort,
      limit: 200
    }).then(res => {
      // Only override the seed when the service actually returned rows.
      if (isMounted && res.data && res.data.length > 0) {
        setAllSuppliers(res.data);
      }
    }).catch(err => {
      console.warn('Supplier service unavailable — using local seed dataset:', err);
    }).finally(() => {
      if (isMounted) setIsLoadingSuppliers(false);
    });

    return () => {
      isMounted = false;
    };
    // Mount-only: the live seed upgrade does not need to re-run per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip the (cosmetic) "filtering" indicator on the very first render so we
  // don't flash skeletons before the seed data has even painted.
  const firstSearchRun = useRef(true);
  const firstMoqRun = useRef(true);

  // Debounce the free-text search (300ms) so the heavy filter runs only after
  // the user pauses typing, not on every keystroke.
  useEffect(() => {
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      setSearchQuery(searchInput);
      return;
    }
    setIsFiltering(true);
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Debounce the MOQ range slider (300ms) before it feeds the filter.
  useEffect(() => {
    if (firstMoqRun.current) {
      firstMoqRun.current = false;
      setAppliedMoq(moqValue);
      return;
    }
    setIsFiltering(true);
    const t = setTimeout(() => {
      setAppliedMoq(moqValue);
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(t);
  }, [moqValue]);

  // Comparison Selection State — starts empty; real DB rows get added on click.
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>([]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleComparisonSelection = (id: string) => {
    setSelectedComparisonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleQuickFilter = (key: string) => {
    setQuickFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleBusinessTypeFilter = (type: string) => {
    setBusinessTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleComplianceFilter = (key: string) => {
    setComplianceFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCity('');
    setDistanceRadius('National');
    setActiveBusinessType('All');
    setBusinessTypeFilters([]);
    setSelectedCategory('');
    setSelectedSubcategory('');
    setMoqValue(5000);
    setAppliedMoq(5000);
    setCapacityFilter('Any Capacity');
    setLeadTimeFilter('Any Lead Time');
    setComplianceFilters({
      gst: false,
      iso: false,
      gmp: false,
      fda: false,
      organic: false,
      crueltyFree: false
    });
    setQuickFilters({
      verifiedOnly: false,
      oemPrivateLabel: false,
      readyToSupply: false,
      topRated: false,
      fastResponse: false,
      lowMoq: false,
      panIndia: false
    });
    showToast('Filters reset to default');
  };

  // "Search Suppliers" button — commits the current text input immediately
  // (bypassing the debounce) and gives explicit feedback.
  const handleSearchSuppliers = () => {
    setSearchQuery(searchInput);
    setIsFiltering(false);
    const label = selectedCity
      ? `Searching suppliers near ${selectedCity}`
      : `Searching "${searchInput.trim() || 'all'}" suppliers`;
    showToast(label);
  };

  // Filtered & Sorted Suppliers List
  // ----------------------------------------------------------------------------
  // Evaluates the full supplier dataset against EVERY active filter control and
  // returns the matching, sorted list. Recomputed reactively whenever any filter
  // value (incl. the debounced search / MOQ) changes.
  // ----------------------------------------------------------------------------
  const filteredSuppliers = useMemo(() => {
    // --- Parse the dropdown / radius controls into comparable numeric values ---
    const radiusKm =
      distanceRadius === '+250 km' ? 250 :
      distanceRadius === '+500 km' ? 500 :
      Infinity; // 'National'

    const capacityMin =
      capacityFilter === '> 10,000 units' ? 10000 :
      capacityFilter === '> 50,000 units' ? 50000 :
      capacityFilter === '> 100,000 units' ? 100000 :
      -1; // 'Any Capacity'

    const leadTimeMax =
      leadTimeFilter === '< 15 Days' ? 15 :
      leadTimeFilter === '< 30 Days' ? 30 :
      leadTimeFilter === '< 60 Days' ? 60 :
      Infinity; // 'Any Lead Time'

    const getRating = (sup: VerifiedSupplier) =>
      sup.overallRating ?? sup.productQualityRating ?? (sup.trustScore ? sup.trustScore / 20 : 4.5);

    const getResponseHours = (sup: VerifiedSupplier) => {
      const match = (sup.responseTimeText || '').match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : 99;
    };

    const list = allSuppliers.filter((supplier) => {
      // 1. Location / City & Industrial Hub
      if (selectedCity && selectedCity.trim() !== '') {
        const q = selectedCity.toLowerCase();
        const matches =
          supplier.city.toLowerCase().includes(q) ||
          (supplier.state || '').toLowerCase().includes(q) ||
          (supplier.locationDetails?.industrialZone && supplier.locationDetails.industrialZone.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 1b. Radius (distance from the Mumbai reference hub; National = no limit)
      if (radiusKm !== Infinity && (supplier.distanceKm ?? Infinity) > radiusKm) {
        return false;
      }

      // 2. Free-text Search (name / type / city / state / category / about)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          supplier.name,
          supplier.type,
          supplier.city,
          supplier.state || '',
          supplier.about || '',
          ...(supplier.categories || []),
          ...(supplier.specialties || [])
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // 3. Business Type Tab (single-select)
      if (activeBusinessType !== 'All') {
        const kind =
          activeBusinessType === 'Manufacturers' ? 'Manufacturer' :
          activeBusinessType === 'Wholesalers' ? 'Wholesaler' :
          activeBusinessType === 'Distributors' ? 'Distributor' :
          activeBusinessType === 'OEM / Private Label' ? 'OEM/ODM' : null;
        if (kind && !supplierTypeMatches(supplier.type, kind)) return false;
      }

      // 4. Sidebar Business Type Checkboxes (multi-select OR)
      if (businessTypeFilters.length > 0) {
        const matchesAny = businessTypeFilters.some((bt) => supplierTypeMatches(supplier.type, bt as any));
        if (!matchesAny) return false;
      }

      // 5. Category + Subcategory
      if (selectedCategory) {
        const catMatch = supplier.categories.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase()));
        if (!catMatch) return false;
      }
      if (selectedSubcategory) {
        const subMatch =
          supplier.categories.some((c) => c.toLowerCase().includes(selectedSubcategory.toLowerCase())) ||
          (supplier.specialties || []).some((s) => s.toLowerCase().includes(selectedSubcategory.toLowerCase()));
        if (!subMatch) return false;
      }

      // 6. Production Scale — Max Order Quantity (MOQ) slider
      // Buyer's max acceptable MOQ; show suppliers whose MOQ is at/under it.
      if (appliedMoq < 10000 && supplier.moqNumber != null && supplier.moqNumber > appliedMoq) {
        return false;
      }

      // 6b. Monthly Capacity dropdown
      if (capacityMin > 0 && (supplier.monthlyCapacityUnits ?? -1) < capacityMin) {
        return false;
      }

      // 6c. Lead Time dropdown
      if (leadTimeMax !== Infinity && (supplier.leadTimeDays ?? Infinity) > leadTimeMax) {
        return false;
      }

      // 7. Quick Filters
      if (quickFilters.verifiedOnly && !supplier.isVerified) return false;
      if (quickFilters.oemPrivateLabel && !supplier.type.toLowerCase().includes('oem') && !supplier.type.toLowerCase().includes('private label')) return false;
      if (quickFilters.readyToSupply && !supplier.readyToSupply) return false;
      if (quickFilters.topRated && getRating(supplier) < 4.7) return false;
      if (quickFilters.fastResponse && getResponseHours(supplier) > 8) return false;
      if (quickFilters.lowMoq && (supplier.moqNumber == null || supplier.moqNumber > 500)) return false;
      if (quickFilters.panIndia && !supplier.panIndia) return false;

      // 8. Compliance & Certifications
      if (complianceFilters.gst && !supplier.isGstVerified) return false;
      if (complianceFilters.iso && !supplier.isIsoCertified) return false;
      if (complianceFilters.gmp && !supplier.isGmpCertified) return false;
      if (complianceFilters.fda && !supplier.isFdaRegistered) return false;
      if (complianceFilters.organic && !supplier.isOrganicCertified) return false;
      if (complianceFilters.crueltyFree && !supplier.isCrueltyFree) return false;

      return true;
    });

    // --- Sorting helpers ---
    const getSupplierEstablishedYear = (sup: VerifiedSupplier) => {
      if (sup.establishedYearNumber) return sup.establishedYearNumber;
      if (sup.establishedYear) {
        const match = sup.establishedYear.match(/\d{4}/);
        if (match) return parseInt(match[0], 10);
      }
      return 2015;
    };

    const getSupplierEmployeeCount = (sup: VerifiedSupplier) => {
      if (sup.employeeCountNumber) return sup.employeeCountNumber;
      if (sup.employeeCount) {
        const nums = sup.employeeCount.match(/\d+/g);
        if (nums && nums.length > 0) {
          return Math.max(...nums.map((n) => parseInt(n, 10)));
        }
      }
      if (sup.facilityArea) {
        const areaMatch = sup.facilityArea.replace(/,/g, '').match(/\d+/);
        if (areaMatch) return Math.round(parseInt(areaMatch[0], 10) / 250);
      }
      if (sup.monthlyCapacity) {
        const capMatch = sup.monthlyCapacity.replace(/,/g, '').match(/\d+/);
        if (capMatch) return Math.round(parseInt(capMatch[0], 10) / 1000);
      }
      return 50;
    };

    return [...list].sort((a, b) => {
      if (sortBy === 'Rating') {
        const diff = getRating(b) - getRating(a);
        if (diff !== 0) return diff;
        return (b.trustScore || 0) - (a.trustScore || 0);
      }
      if (sortBy === 'Year Established') {
        // Oldest established (industry longevity) first
        return getSupplierEstablishedYear(a) - getSupplierEstablishedYear(b);
      }
      if (sortBy === 'Employee Count') {
        // Largest workforce / scale first
        return getSupplierEmployeeCount(b) - getSupplierEmployeeCount(a);
      }
      // 'Relevance' / 'Recommended'
      return (b.trustScore || 0) - (a.trustScore || 0);
    });
  }, [
    allSuppliers,
    searchQuery,
    selectedCity,
    distanceRadius,
    activeBusinessType,
    businessTypeFilters,
    selectedCategory,
    selectedSubcategory,
    appliedMoq,
    capacityFilter,
    leadTimeFilter,
    quickFilters,
    complianceFilters,
    sortBy
  ]);

  const selectedSuppliersObjects = useMemo(() => {
    return allSuppliers.filter((s) => selectedComparisonIds.includes(s.id));
  }, [allSuppliers, selectedComparisonIds]);

  // How many filters are currently active — used to personalise the empty state.
  const activeFilterCount = useMemo(
    () =>
      countActiveFilters({
        searchInput,
        selectedCity,
        distanceRadius,
        activeBusinessType,
        businessTypeFilters,
        selectedCategory,
        selectedSubcategory,
        moqValue,
        capacityFilter,
        leadTimeFilter,
        quickFilters,
        complianceFilters
      }),
    [searchInput, selectedCity, distanceRadius, activeBusinessType, businessTypeFilters, selectedCategory, selectedSubcategory, moqValue, capacityFilter, leadTimeFilter, quickFilters, complianceFilters]
  );

  // Human-readable labels for the quick-filter + compliance chips.
  const QUICK_FILTER_LABELS: Record<string, string> = {
    verifiedOnly: 'Verified Only',
    oemPrivateLabel: 'OEM / Private Label',
    readyToSupply: 'Ready to Supply',
    topRated: 'Top Rated',
    fastResponse: 'Fast Response',
    lowMoq: 'Low MOQ',
    panIndia: 'Pan India'
  };
  const COMPLIANCE_LABELS: Record<string, string> = {
    gst: 'GST',
    iso: 'ISO',
    gmp: 'GMP',
    fda: 'US-FDA',
    organic: 'Organic',
    crueltyFree: 'Cruelty-Free'
  };

  // A single, deduplicated list of every active filter — powers the "Active"
  // pill strip and lets users remove any single filter with one click.
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (selectedCity) chips.push({ key: 'city', label: `City: ${selectedCity}` });
    if (distanceRadius !== 'National') chips.push({ key: 'radius', label: `Radius: ${distanceRadius}` });
    if (activeBusinessType !== 'All') chips.push({ key: 'tab', label: activeBusinessType });
    businessTypeFilters.forEach((bt) => chips.push({ key: `bt-${bt}`, label: bt }));
    if (selectedCategory) chips.push({ key: 'cat', label: `Category: ${selectedCategory}` });
    if (selectedSubcategory) chips.push({ key: 'subcat', label: selectedSubcategory });
    if (moqValue < 5000) chips.push({ key: 'moq', label: `Max MOQ ≤ ${moqValue.toLocaleString()}` });
    if (capacityFilter !== 'Any Capacity') chips.push({ key: 'cap', label: `Cap ${capacityFilter}` });
    if (leadTimeFilter !== 'Any Lead Time') chips.push({ key: 'lead', label: `Lead ${leadTimeFilter}` });
    Object.entries(quickFilters).forEach(([k, v]) => { if (v) chips.push({ key: `qf-${k}`, label: QUICK_FILTER_LABELS[k] }); });
    Object.entries(complianceFilters).forEach(([k, v]) => { if (v) chips.push({ key: `cf-${k}`, label: COMPLIANCE_LABELS[k] }); });
    return chips;
  }, [selectedCity, distanceRadius, activeBusinessType, businessTypeFilters, selectedCategory, selectedSubcategory, moqValue, capacityFilter, leadTimeFilter, quickFilters, complianceFilters]);

  const removeFilterChip = (key: string) => {
    if (key === 'city') return setSelectedCity('');
    if (key === 'radius') return setDistanceRadius('National');
    if (key === 'tab') return setActiveBusinessType('All');
    if (key === 'cat') { setSelectedCategory(''); return setSelectedSubcategory(''); }
    if (key === 'subcat') return setSelectedSubcategory('');
    if (key === 'moq') { setMoqValue(5000); return setAppliedMoq(5000); }
    if (key === 'cap') return setCapacityFilter('Any Capacity');
    if (key === 'lead') return setLeadTimeFilter('Any Lead Time');
    if (key.startsWith('bt-')) return toggleBusinessTypeFilter(key.slice(3));
    if (key.startsWith('qf-')) return toggleQuickFilter(key.slice(3));
    if (key.startsWith('cf-')) return toggleComplianceFilter(key.slice(3));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2A0E3F] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#2A0E3F] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#352B44] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#8236A0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Search & Location Header Bar */}
      <section className="bg-white border-b border-[#E8DEEF] sticky top-20 z-30 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center bg-[#F4F0E9] rounded-xl border border-[#E8DEEF] focus-within:ring-2 focus-within:ring-[#6B2D8C] transition-all p-1.5 gap-2">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center px-3 gap-2.5 bg-transparent">
              <Search className="w-4 h-4 text-[#5B4A6E] shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSuppliers();
                }}
                placeholder="Search suppliers, manufacturers, distributors or business categories"
                className="bg-transparent border-none text-[13.5px] text-[#2A0E3F] placeholder:text-[#B9A8C6] focus:outline-none w-full py-2 font-medium"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="text-[#7E6C96] hover:text-[#2A0E3F]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="hidden lg:block w-px h-8 bg-[#E8DEEF]" />

            {/* Location Input */}
            <div className="flex items-center px-3 gap-2 w-full lg:w-64 bg-transparent">
              <MapPin className="w-4 h-4 text-[#6B2D8C] shrink-0" />
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none text-[13px] text-[#2A0E3F] font-medium focus:outline-none w-full py-2"
                placeholder="City, State"
              />
            </div>

            <div className="hidden lg:block w-px h-8 bg-[#E8DEEF]" />

            {/* Distance Radius Selector */}
            <div className="flex items-center px-3 gap-2 w-full lg:w-36 bg-transparent">
              <span className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider shrink-0">Radius</span>
              <select
                value={distanceRadius}
                onChange={(e) => setDistanceRadius(e.target.value)}
                className="bg-transparent border-none text-[13px] font-semibold text-[#2A0E3F] focus:outline-none w-full py-2 cursor-pointer"
              >
                <option value="+250 km">+250 km</option>
                <option value="+500 km">+500 km</option>
                <option value="National">National</option>
              </select>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleSearchSuppliers}
              className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-[13px] font-bold px-7 py-3 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Suppliers</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Layout Container */}
      <div className="max-w-[1440px] mx-auto w-full flex flex-col md:flex-row">
        
        {/* Left Sticky Sidebar Filters (Desktop) */}
        <aside className="hidden md:flex flex-col p-6 bg-white sticky top-[152px] h-[calc(100vh-152px)] w-72 border-r border-[#E8DEEF] shrink-0 overflow-y-auto">
          <div className="mb-5 flex justify-between items-center pb-3 border-b border-[#F4F0E9]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6B2D8C]" />
              <h2 className="text-[15px] font-bold text-[#2A0E3F] tracking-tight">Supplier Filters</h2>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[12px] text-[#6B2D8C] font-bold hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Business Type Filter */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-[#2A0E3F] mb-3 uppercase tracking-widest text-[#7E6C96]">
              Business Type
            </h3>
            <div className="flex flex-col gap-2.5">
              {['Manufacturer', 'Wholesaler', 'Distributor', 'Exporter', 'OEM/ODM'].map((type) => (
                <label key={type} className="flex items-center gap-2.5 text-[13px] text-[#2A0E3F] cursor-pointer hover:text-[#6B2D8C] font-medium">
                  <input
                    type="checkbox"
                    checked={businessTypeFilters.includes(type)}
                    onChange={() => toggleBusinessTypeFilter(type)}
                    className="rounded border-[#E8DEEF] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* City & Industrial Hubs Filter */}
          <div className="mb-6 pb-6 border-b border-[#F4F0E9]">
            <h3 className="text-[11px] font-bold text-[#2A0E3F] mb-3 uppercase tracking-widest text-[#7E6C96] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#6B2D8C]" />
              <span>City &amp; Industrial Hubs</span>
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { name: 'All India', value: '' },
                { name: 'Mumbai (Taloja MIDC)', value: 'Mumbai' },
                { name: 'Baddi (Himachal Hub)', value: 'Baddi' },
                { name: 'Delhi NCR (IMT Manesar)', value: 'Delhi' },
                { name: 'Ahmedabad (Sanand)', value: 'Ahmedabad' },
                { name: 'Bengaluru (Peenya Hub)', value: 'Bengaluru' }
              ].map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => {
                    setSelectedCity(hub.value);
                    showToast(`Filtering for suppliers in ${hub.name}`);
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-all font-bold flex justify-between items-center cursor-pointer ${
                    selectedCity === hub.value
                      ? 'bg-[#F5EEF8] text-[#6B2D8C] border border-[#D9C3E8]'
                      : 'bg-transparent text-[#5B4A6E] hover:bg-[#F4F0E9] hover:text-[#2A0E3F]'
                  }`}
                >
                  <span>{hub.name}</span>
                  {selectedCity === hub.value && <Check className="w-3.5 h-3.5 text-[#6B2D8C]" />}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#9b8aad] mt-2 leading-snug">
              Radius is measured as road-distance from the Mumbai reference hub.
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-6 pb-6 border-b border-[#F4F0E9]">
            <h3 className="text-[11px] font-bold text-[#2A0E3F] mb-3 uppercase tracking-widest text-[#7E6C96]">
              Categories
            </h3>
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {Object.entries(CATEGORY_TAXONOMY).map(([catName, subcategories]) => {
                const isSelected = selectedCategory === catName;
                return (
                  <div key={catName} className="space-y-1.5">
                    <label className="flex items-center justify-between text-[13px] text-[#2A0E3F] cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedCategory('');
                              setSelectedSubcategory('');
                            } else {
                              setSelectedCategory(catName);
                              setSelectedSubcategory('');
                            }
                          }}
                          className="rounded border-[#E8DEEF] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4"
                        />
                        <span className={`font-medium transition-colors ${isSelected ? 'font-bold text-[#6B2D8C]' : 'group-hover:text-[#6B2D8C]'}`}>
                          {catName}
                        </span>
                      </div>
                    </label>

                    {/* Subcategories Tree */}
                    {isSelected && (
                      <div className="pl-6 flex flex-col gap-1.5 border-l-2 border-[#6B2D8C]/30 ml-2 mt-1 py-1">
                        {subcategories.map((subName) => (
                          <label key={subName} className="flex items-center justify-between text-[12px] text-[#2A0E3F] cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedSubcategory === subName}
                                onChange={() => setSelectedSubcategory(selectedSubcategory === subName ? '' : subName)}
                                className="rounded border-[#E8DEEF] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-3.5 h-3.5"
                              />
                              <span className={selectedSubcategory === subName ? 'font-semibold text-[#6B2D8C]' : 'text-[#5B4A6E]'}>
                                {subName}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Production Scale Filters */}
          <div className="mb-6 pb-6 border-b border-[#F4F0E9]">
            <h3 className="text-[11px] font-bold text-[#2A0E3F] mb-3 uppercase tracking-widest text-[#7E6C96]">
              Production Scale
            </h3>

            {/* Range slider for MOQ */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-[12px] text-[#5B4A6E] mb-1.5 font-medium">
                <span>Max Order Quantity</span>
                <span className="font-bold text-[#6B2D8C]">{moqValue.toLocaleString()} units</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={moqValue}
                onChange={(e) => setMoqValue(Number(e.target.value))}
                className="w-full accent-[#6B2D8C] h-1.5 bg-[#F4F0E9] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7E6C96] mt-1 font-semibold">
                <span>100 Units</span>
                <span>10k+ Units</span>
              </div>
            </div>

            {/* Monthly Capacity Dropdown */}
            <div className="mb-3.5">
              <label className="block text-[11.5px] font-semibold text-[#5B4A6E] mb-1">Monthly Capacity</label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="w-full bg-white border border-[#E8DEEF] text-[12.5px] text-[#2A0E3F] rounded-lg p-2 focus:ring-1 focus:ring-[#C9A961]/30 font-medium cursor-pointer"
              >
                <option value="Any Capacity">Any Capacity</option>
                <option value="> 10,000 units">&gt; 10,000 units / mo</option>
                <option value="> 50,000 units">&gt; 50,000 units / mo</option>
                <option value="> 100,000 units">&gt; 100,000 units / mo</option>
              </select>
            </div>

            {/* Lead Time Dropdown */}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#5B4A6E] mb-1">Lead Time</label>
              <select
                value={leadTimeFilter}
                onChange={(e) => setLeadTimeFilter(e.target.value)}
                className="w-full bg-white border border-[#E8DEEF] text-[12.5px] text-[#2A0E3F] rounded-lg p-2 focus:ring-1 focus:ring-[#C9A961]/30 font-medium cursor-pointer"
              >
                <option value="Any Lead Time">Any Lead Time</option>
                <option value="< 15 Days">&lt; 15 Days</option>
                <option value="< 30 Days">&lt; 30 Days</option>
                <option value="< 60 Days">&lt; 60 Days</option>
              </select>
            </div>
          </div>

          {/* Compliance & Certifications */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-[#2A0E3F] mb-3 uppercase tracking-widest text-[#7E6C96] flex justify-between items-center">
              <span>Compliance &amp; Certs</span>
              <Info className="w-3.5 h-3.5 text-[#7E6C96] cursor-help" title="3rd-party audited compliance status" />
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'gst', label: 'GST Registered' },
                { key: 'iso', label: 'ISO 9001:2015' },
                { key: 'gmp', label: 'WHO-GMP Certified' },
                { key: 'fda', label: 'US-FDA Registered' },
                { key: 'organic', label: 'Organic (COSMOS)' },
                { key: 'crueltyFree', label: 'Cruelty-Free / Leaping Bunny' }
              ].map((cert) => (
                <label key={cert.key} className="flex items-center gap-2.5 text-[13px] text-[#2A0E3F] cursor-pointer hover:text-[#6B2D8C] font-medium">
                  <input
                    type="checkbox"
                    checked={complianceFilters[cert.key]}
                    onChange={() => toggleComplianceFilter(cert.key)}
                    className="rounded border-[#E8DEEF] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer"
                  />
                  <span>{cert.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Directory Canvas */}
        <main className="flex-1 p-4 md:p-8 bg-[#FDFBF7] min-h-[calc(100vh-152px)]">
          
          {/* Top Sticky Business Type Pills & Quick Filters Bar */}
          <div className="sticky top-[152px] z-20 bg-[#FDFBF7]/95 backdrop-blur-md py-3 mb-6 border-b border-[#E8DEEF]">
            {/* Primary Business Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { label: 'All Suppliers', key: 'All', count: allSuppliers.length },
                {
                  label: 'Verified Manufacturers',
                  key: 'Manufacturers',
                  count: allSuppliers.filter((s) => s.type.toLowerCase().includes('manufacturer') || s.type.toLowerCase().includes('formulator')).length
                },
                {
                  label: 'Wholesalers & Stockists',
                  key: 'Wholesalers',
                  count: allSuppliers.filter((s) => s.type.toLowerCase().includes('wholesaler') || s.type.toLowerCase().includes('stockist')).length
                },
                {
                  label: 'National Distributors',
                  key: 'Distributors',
                  count: allSuppliers.filter((s) => s.type.toLowerCase().includes('distributor')).length
                },
                {
                  label: 'OEM / Private Label',
                  key: 'OEM / Private Label',
                  count: allSuppliers.filter((s) => s.type.toLowerCase().includes('oem') || s.type.toLowerCase().includes('private label') || s.type.toLowerCase().includes('formulator')).length
                }
              ].map((typeTab) => {
                const isActive = activeBusinessType === typeTab.key;
                return (
                  <button
                    key={typeTab.key}
                    onClick={() => setActiveBusinessType(typeTab.key)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#6B2D8C] text-white shadow-xs'
                        : 'bg-white border border-[#E8DEEF] text-[#2A0E3F] hover:border-[#6B2D8C] hover:text-[#6B2D8C]'
                    }`}
                  >
                    <span>{typeTab.label}</span>
                    <span
                      className={`text-[11px] px-2 py-0.2 rounded-full font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#F4F0E9] text-[#7E6C96]'
                      }`}
                    >
                      {typeTab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar text-[12px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7E6C96] shrink-0">
                Quick Filters:
              </span>
              {[
                { key: 'verifiedOnly', label: 'Verified Only' },
                { key: 'oemPrivateLabel', label: 'OEM / Private Label' },
                { key: 'readyToSupply', label: 'Ready to Supply' },
                { key: 'topRated', label: 'Top Rated' },
                { key: 'fastResponse', label: 'Fast Response' },
                { key: 'lowMoq', label: 'Low MOQ' },
                { key: 'panIndia', label: 'Pan India' }
              ].map((qf) => {
                const isChecked = quickFilters[qf.key];
                return (
                  <button
                    key={qf.key}
                    onClick={() => toggleQuickFilter(qf.key)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      isChecked
                        ? 'bg-[#F5EEF8] border-[#6B2D8C] text-[#6B2D8C] font-bold'
                        : 'bg-[#F4F0E9] border-[#E8DEEF] text-[#5B4A6E] hover:border-[#6B2D8C]'
                    }`}
                  >
                    {qf.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Geographic Hub Filter */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar text-[12px] md:hidden">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7E6C96] shrink-0 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#6B2D8C]" />
                <span>Hubs:</span>
              </span>
              {[
                { name: 'All India', value: '' },
                { name: 'Mumbai (Taloja)', value: 'Mumbai' },
                { name: 'Baddi (Himachal)', value: 'Baddi' },
                { name: 'Delhi NCR (Manesar)', value: 'Delhi' },
                { name: 'Ahmedabad (Sanand)', value: 'Ahmedabad' },
                { name: 'Bengaluru (Peenya)', value: 'Bengaluru' }
              ].map((hub) => {
                const isSelected = selectedCity === hub.value;
                return (
                  <button
                    key={hub.name}
                    onClick={() => {
                      setSelectedCity(hub.value);
                      showToast(`Filtering for suppliers in ${hub.name}`);
                    }}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[#6B2D8C] border-[#6B2D8C] text-white font-extrabold shadow-sm'
                        : 'bg-white border-[#E8DEEF] text-[#5B4A6E] hover:border-[#6B2D8C]'
                    }`}
                  >
                    {hub.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Header Summary & Toolbar */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#2A0E3F] flex items-center gap-2.5 flex-wrap">
                  <span>
                    {filteredSuppliers.length} Suppliers &amp; Brands
                    {selectedCategory ? ` for '${selectedCategory}'` : ''}
                    {activeBusinessType !== 'All' ? ` (${activeBusinessType})` : ''}
                  </span>
                  <span className="bg-[#F5EEF8] text-[#6B2D8C] text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {activeBusinessType !== 'All' ? activeBusinessType : 'Live Directory'}
                  </span>
                </h1>
                <p className="text-[13px] text-[#5B4A6E] mt-1 font-medium">
                  Verified beauty &amp; cosmetic manufacturers, wholesalers &amp; distributors across India
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Mobile Filter Toggle Trigger */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E8DEEF] rounded-xl text-[13px] font-bold text-[#2A0E3F]"
                >
                  <Filter className="w-4 h-4 text-[#6B2D8C]" />
                  <span>Filters</span>
                </button>

                {/* View Toggles */}
                <div className="flex items-center gap-1 border border-[#E8DEEF] rounded-xl bg-white p-1 shadow-2xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#F4F0E9] text-[#6B2D8C]' : 'text-[#7E6C96] hover:text-[#2A0E3F]'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#F4F0E9] text-[#6B2D8C]' : 'text-[#7E6C96] hover:text-[#2A0E3F]'
                    }`}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('map');
                      if (onOpenMapModal && filteredSuppliers[0]) {
                        onOpenMapModal(filteredSuppliers[0]);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'map' ? 'bg-[#F4F0E9] text-[#6B2D8C]' : 'text-[#7E6C96] hover:text-[#2A0E3F]'
                    }`}
                    title="Map View"
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative" id="supplier-sort-dropdown-container">
                  <label htmlFor="supplier-directory-sort-select" className="sr-only">
                    Sort Manufacturers
                  </label>
                  <select
                    id="supplier-directory-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-[#E8DEEF] hover:border-[#6B2D8C] text-[13px] font-semibold text-[#2A0E3F] rounded-xl py-2 pl-3.5 pr-8 focus:outline-none focus:ring-1 focus:ring-[#C9A961]/30 cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="Relevance">Sort: Relevance</option>
                    <option value="Rating">Sort: Rating</option>
                    <option value="Year Established">Sort: Year Established</option>
                    <option value="Employee Count">Sort: Employee Count</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E6C96] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters Pill Strip */}
            <div className="flex flex-wrap gap-2 items-center text-[12px]">
              {activeFilterChips.length > 0 ? (
                <>
                  <span className="text-[#7E6C96] font-semibold">Active:</span>
                  {activeFilterChips.map((chip) => (
                    <div
                      key={chip.key}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E8DEEF] rounded-full text-[#2A0E3F] font-medium shadow-2xs"
                    >
                      <span>{chip.label}</span>
                      <button
                        onClick={() => removeFilterChip(chip.key)}
                        className="hover:text-[#6B2D8C] text-[#7E6C96]"
                        aria-label={`Remove ${chip.label} filter`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <span className="text-[#7E6C96] font-medium">No filters applied</span>
              )}
              <button
                onClick={handleResetFilters}
                disabled={activeFilterChips.length === 0}
                className={`text-[#6B2D8C] font-bold hover:underline ml-2 cursor-pointer text-[12px] ${
                  activeFilterChips.length === 0 ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Concierge Sourcing Header Banner */}
          <section className="mb-8 bg-white border border-[#E8DEEF] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex-1">
              <span className="bg-[#6B2D8C] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                Concierge Sourcing
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-[#2A0E3F] mb-2 tracking-tight">
                Need a Manufacturing Partner?
              </h2>
              <p className="text-[13.5px] text-[#5B4A6E] mb-5 max-w-2xl leading-relaxed font-normal">
                Leverage our network of elite OEM partners for end-to-end support, from custom formulation R&amp;D to sustainable packaging design.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-[#FDFBF7] px-3.5 py-2 rounded-xl border border-[#E8DEEF]">
                  <Sparkles className="w-4 h-4 text-[#6B2D8C]" />
                  <span className="text-[13px] font-semibold text-[#2A0E3F]">R&amp;D Support</span>
                </div>
                <div className="flex items-center gap-2 bg-[#FDFBF7] px-3.5 py-2 rounded-xl border border-[#E8DEEF]">
                  <Package className="w-4 h-4 text-[#6B2D8C]" />
                  <span className="text-[13px] font-semibold text-[#2A0E3F]">Packaging Design</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={onOpenRFQModal}
                className="w-full md:w-auto bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-bold px-7 py-3.5 rounded-xl hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-[14px]"
              >
                <span>Request Custom Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Supplier Cards List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 mb-16' : 'flex flex-col gap-6 mb-16'}>
            {(isLoadingSuppliers || isFiltering) ? (
              // Loading skeletons while the (possibly large) list is being filtered.
              Array.from({ length: 6 }).map((_, i) => <SupplierCardSkeleton key={i} />)
            ) : filteredSuppliers.length === 0 ? (
              <SupplierDirectoryEmptyState onReset={handleResetFilters} activeFilterCount={activeFilterCount} />
            ) : (
              filteredSuppliers.map((sup, index) => {
              const saved = isSupplierSaved ? isSupplierSaved(sup.id) : false;
              const isSelectedForCompare = selectedComparisonIds.includes(sup.id);

              return (
                <React.Fragment key={sup.id}>
                  {/* Supplier Card */}
                  <article className={`bg-white rounded-2xl p-6 hover:shadow-md transition-all duration-300 border border-[#E8DEEF] relative group flex flex-col ${viewMode === 'grid' ? 'gap-6' : 'lg:flex-row gap-6'}`}>
                    
                    {/* Floating Save & Compare Quick Tools */}
                    <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (onToggleSaveSupplier) onToggleSaveSupplier(sup.id, sup.name);
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          saved
                            ? 'bg-[#F5EEF8] text-[#6B2D8C] border border-[#D9C3E8]'
                            : 'bg-[#F4F0E9] text-[#7E6C96] hover:text-[#6B2D8C] hover:bg-[#F5EEF8]'
                        }`}
                        title={saved ? 'Saved in My List' : 'Save Supplier'}
                      >
                        {saved ? <BookmarkCheck className="w-4 h-4 fill-[#6B2D8C]" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <label
                        className={`flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition-colors ${
                          isSelectedForCompare ? 'bg-[#EDE0F5]' : 'bg-[#F4F0E9] hover:bg-[#e6e1e1]'
                        }`}
                        title="Select for Comparison"
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForCompare}
                          onChange={() => toggleComparisonSelection(sup.id)}
                          className="rounded border-[#E8DEEF] text-[#6B2D8C] focus:ring-[#6B2D8C] w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Main Supplier Metadata Column */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header Row: Logo, Name, Badges */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-xl bg-[#FDFBF7] flex items-center justify-center border border-[#E8DEEF] shrink-0 overflow-hidden relative shadow-2xs">
                            <span className="font-extrabold text-xl text-[#6B2D8C]">{sup.shortCode}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap pr-16">
                              <h3
                                onClick={() => onNavigateToSupplierProfile?.(sup.id)}
                                className="text-xl font-bold tracking-tight text-[#2A0E3F] hover:text-[#6B2D8C] cursor-pointer transition-colors"
                              >
                                {sup.name}
                              </h3>
                              
                              {/* Rating Widget */}
                              <div className="flex items-center gap-1 bg-[#fff8e6] px-2 py-0.5 rounded-full border border-[#ffe082]">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span className="text-[11px] font-black text-amber-900">{sup.overallRating || 4.9}</span>
                              </div>

                              <VerifiedBadge
                                trustScore={sup.trustScore}
                                overallRating={sup.overallRating}
                                size="sm"
                              />
                              {sup.isVerified ? (
                                <span className="flex items-center gap-1 text-[#6B2D8C] text-[12px] font-bold" title="Nexora Verified Partner">
                                  <ShieldCheck className="w-4 h-4 fill-[#6B2D8C] text-white" />
                                  <span className="hidden sm:inline">Verified</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-700 text-[12px] font-bold" title="Supplier is live, verification review pending">
                                  <Clock className="w-4 h-4 text-amber-500" />
                                  <span>Pending Verification</span>
                                </span>
                              )}
                              {/* Avg Response Time Tag (Soft Gold Luxe Accent) */}
                              <span className="inline-flex items-center gap-1 bg-[#FFFBF0] text-[#8C5D00] border border-[#F3E5AB] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs" title="Average enquiry response time SLA">
                                <Clock className="w-3 h-3 text-[#D97706]" />
                                <span>Responds in {sup.responseTimeText || '< 2 hrs'}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mb-2.5">
                              {/* Multiple descriptive B2B Business Type Tags */}
                              {(() => {
                                const t = sup.type.toLowerCase();
                                const tags = [];
                                
                                if (t.includes('manufacturer') || t.includes('formulator')) {
                                  tags.push(
                                    <span key="mfg" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-purple-50 text-purple-900 border border-purple-200 shadow-3xs uppercase tracking-wider">
                                      <Factory className="w-3.5 h-3.5 text-purple-800" />
                                      Contract Manufacturer
                                    </span>
                                  );
                                }
                                if (t.includes('oem') || t.includes('private label') || sup.categories.some(c => c.toLowerCase().includes('oem') || c.toLowerCase().includes('private label'))) {
                                  tags.push(
                                    <span key="oem" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-purple-50 text-purple-800 border border-purple-200 shadow-3xs uppercase tracking-wider">
                                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                                      OEM / Private Label
                                    </span>
                                  );
                                }
                                if (t.includes('wholesaler') || t.includes('stockist')) {
                                  tags.push(
                                    <span key="wh" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-3xs uppercase tracking-wider">
                                      <Package className="w-3.5 h-3.5 text-emerald-700" />
                                      Wholesaler &amp; Stockist
                                    </span>
                                  );
                                }
                                if (t.includes('raw material') || sup.categories.some(c => c.toLowerCase().includes('raw material') || c.toLowerCase().includes('actives'))) {
                                  tags.push(
                                    <span key="raw" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-3xs uppercase tracking-wider">
                                      <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                                      Raw Materials
                                    </span>
                                  );
                                }
                                if (t.includes('distributor')) {
                                  tags.push(
                                    <span key="dist" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-purple-50 text-[#6B2D8C] border border-purple-200 shadow-3xs uppercase tracking-wider">
                                      <Building2 className="w-3.5 h-3.5 text-[#6B2D8C]" />
                                      Distributor
                                    </span>
                                  );
                                }
                                
                                if (tags.length === 0) {
                                  tags.push(
                                    <span key="generic" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-rose-50 text-[#6B2D8C] border border-rose-200 shadow-3xs uppercase tracking-wider">
                                      <Factory className="w-3.5 h-3.5 text-[#6B2D8C]" />
                                      {sup.type}
                                    </span>
                                  );
                                }
                                return tags;
                              })()}

                              <span className="text-[#7E6C96] hidden sm:inline">•</span>
                              
                              <span className="flex items-center gap-1 text-[11.5px] text-[#5B4A6E] font-bold bg-[#FDFBF7] border border-[#E8DEEF] px-2.5 py-1 rounded-md">
                                <MapPin className="w-3.5 h-3.5 text-[#6B2D8C]" />
                                <span className="text-[#2A0E3F] font-extrabold">{sup.city}</span>, {sup.state}
                              </span>
                            </div>
                          </div>
                        </div>

                            {/* Compliance Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {sup.isGstVerified && (
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10.5px] font-bold rounded-md border border-emerald-200 flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" />
                                  GST Verified
                                </span>
                              )}
                              {sup.isIsoCertified && (
                                <span className="px-2.5 py-0.5 bg-[#F5EEF8] text-[#6B2D8C] text-[10.5px] font-bold rounded-md border border-[#D9C3E8] flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  ISO 9001
                                </span>
                              )}
                              {sup.isGmpCertified && (
                                <span className="px-2.5 py-0.5 bg-[#e8f5e9] text-[#059669] text-[10.5px] font-bold rounded-md border border-[#a5d6a7] flex items-center gap-1">
                                  <BadgeCheck className="w-3 h-3" />
                                  GMP Certified
                                </span>
                              )}
                              {sup.isFdaRegistered && (
                                <span className="px-2.5 py-0.5 bg-[#EDE0F5] text-[#6B2D8C] text-[10.5px] font-bold rounded-md border border-[#a5c0ff] flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  US-FDA
                                </span>
                              )}
                            </div>

                        {/* Performance Metrics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 px-4 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl mb-4 text-[12px]">
                          <div>
                            <p className="text-[10px] text-[#7E6C96] uppercase tracking-widest font-bold mb-0.5">Business</p>
                            <p className="font-bold text-[#2A0E3F]">12+ Years</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#7E6C96] uppercase tracking-widest font-bold mb-0.5">Response</p>
                            <p className="font-bold text-[#059669]">{sup.responseRate || '98% (<2h)'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#7E6C96] uppercase tracking-widest font-bold mb-0.5">Capacity</p>
                            <p className="font-bold text-[#2A0E3F]">{sup.monthlyCapacity || '100k units/mo'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#7E6C96] uppercase tracking-widest font-bold mb-0.5">Lead Time</p>
                            <p className="font-bold text-[#2A0E3F]">15-30 Days</p>
                          </div>
                        </div>


                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                          onClick={() =>
                            onOpenRFQModal({
                              id: sup.id,
                              name: sup.name,
                              category: sup.categories?.[0] || 'Cosmetics & Skincare',
                              type: sup.type
                            })
                          }
                          className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-bold px-4 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Request Quote</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenChat) {
                              onOpenChat({
                                id: sup.id,
                                name: sup.name,
                                location: `${sup.city}, ${sup.state}`,
                                isVerified: Boolean(sup.isVerified)
                              });
                            } else {
                              onOpenEnquiryModal({
                                title: `${sup.name} Direct Sourcing Enquiry`,
                                supplierName: sup.name,
                                type: sup.type,
                                city: sup.city,
                                state: sup.state
                              });
                            }
                          }}
                          className="bg-purple-50 hover:bg-purple-100 text-[#6B2D8C] font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D9C3E8]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Direct Chat</span>
                        </button>

                        <button
                          onClick={() => onNavigateToSupplierProfile?.(sup.id)}
                          className="bg-stone-100 hover:bg-stone-200 text-[#2A0E3F] font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#6B2D8C]" />
                          <span>View Profile</span>
                        </button>

                        {onOpenFacilityTour && (
                          <button
                            onClick={() => onOpenFacilityTour(sup)}
                            className="bg-[#F5EEF8] border border-[#D9C3E8] text-[#6B2D8C] hover:bg-[#6B2D8C] hover:text-white font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            title="Play 15-second virtual tour video of manufacturing plant"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>View Facility</span>
                          </button>
                        )}

                        <button
                          onClick={() => onCallSupplier(sup.name)}
                          className="border border-[#6B2D8C] text-[#6B2D8C] font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>

                        <button
                          onClick={() => onWhatsAppSupplier(sup.name)}
                          className="bg-[#25D366]/10 text-[#075E54] border border-[#25D366]/30 px-3 py-2 rounded-xl hover:bg-[#25D366]/20 transition-colors flex items-center justify-center cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Right Showcase: Product Catalog Thumbnails */}
                    <div className="w-full lg:w-80 shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[#E8DEEF] pt-4 lg:pt-0 lg:pl-6 bg-[#FDFBF7] rounded-r-2xl">
                      <div className="flex justify-between items-center mb-2.5">
                        <h4 className="text-[13px] font-bold text-[#2A0E3F]">Product Catalog</h4>
                        <span className="text-[10px] text-[#7E6C96] bg-white px-2 py-0.5 rounded-full border border-[#E8DEEF] font-bold uppercase tracking-wider">
                          MOQ: 500+
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 flex-1">
                        {(sup.portfolioProducts && sup.portfolioProducts.length > 0
                          ? sup.portfolioProducts.slice(0, 3)
                          : [
                              {
                                id: 'p1',
                                name: 'Vitamin C Serum Base',
                                image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
                                price: '₹450 / L',
                                moq: '50 Liters'
                              },
                              {
                                id: 'p2',
                                name: 'Night Cream Repair Base',
                                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
                                price: '₹380 / Unit',
                                moq: '100 Units'
                              },
                              {
                                id: 'p3',
                                name: 'Body Lotion Bulk Fl',
                                image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
                                price: '₹210 / Unit',
                                moq: '200 Units'
                              }
                            ]
                        ).map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              if (onNavigateToProductDetail) {
                                onNavigateToProductDetail(prod.id);
                              } else {
                                onOpenEnquiryModal({
                                  title: prod.name,
                                  supplierName: sup.name,
                                  image: prod.image,
                                  priceRange: prod.price,
                                  moq: prod.moq
                                });
                              }
                            }}
                            className="bg-white rounded-xl border border-[#E8DEEF] hover:border-[#6B2D8C] aspect-square relative group/thumb overflow-hidden cursor-pointer p-1 transition-all"
                            title={`Enquire about ${prod.name}`}
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover rounded-lg group-hover/thumb:scale-108 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                              <p className="text-[11px] text-white font-bold truncate leading-tight">{prod.name}</p>
                              <p className="text-[9px] text-[#E8D5F2] font-semibold">{prod.price}</p>
                            </div>
                          </div>
                        ))}

                        <div
                          onClick={() =>
                            onOpenEnquiryModal({
                              title: `${sup.name} Entire Catalog`,
                              supplierName: sup.name
                            })
                          }
                          className="bg-white rounded-xl border border-[#E8DEEF] hover:border-[#6B2D8C] aspect-square flex flex-col items-center justify-center transition-colors cursor-pointer group/more p-2"
                        >
                          <Package className="w-5 h-5 text-[#6B2D8C] mb-1 group-hover/more:scale-110 transition-transform" />
                          <p className="text-[11px] text-[#6B2D8C] font-bold text-center leading-tight">
                            View All 24+
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Interspersed In-Feed Formulation Banner (after second supplier) */}
                  {index === 1 && (
                    <div className="bg-[#6B2D8C] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm my-2">
                      <div className="flex-1 z-10">
                        <h3 className="text-xl font-bold tracking-tight mb-1.5 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#E8D5F2]" />
                          <span>Need a Custom Formulation?</span>
                        </h3>
                        <p className="text-[#E8D5F2] text-[13px] mb-3 leading-relaxed font-medium">
                          Work with our expert chemists to develop, test, and package your unique cosmetic line from scratch.
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                          <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">R&amp;D Lab Access</span>
                          <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">Custom Packaging</span>
                          <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">Compliance Testing</span>
                        </div>
                      </div>
                      <div className="z-10 shrink-0 w-full md:w-auto">
                        <button
                          onClick={onOpenRFQModal}
                          className="w-full md:w-auto bg-white text-[#6B2D8C] font-bold px-6 py-3 rounded-xl hover:bg-[#F5EEF8] transition-colors flex items-center justify-center gap-2 cursor-pointer text-[13px]"
                        >
                          <span>Request Custom Quote</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            }))}
          </div>

          {/* Floating Bottom Comparison & Action Bar Tray */}
          {selectedComparisonIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#E8DEEF] rounded-full px-6 py-3 flex gap-4 items-center z-50 shadow-2xl transition-all animate-in slide-in-from-bottom-6">
              <div className="flex items-center gap-3 pr-4 border-r border-[#E8DEEF]">
                <span className="text-[13px] font-bold text-[#2A0E3F]">
                  {selectedComparisonIds.length} Suppliers Selected
                </span>
              </div>

              <button
                onClick={() => {
                  if (onOpenComparisonModal) {
                    onOpenComparisonModal(selectedSuppliersObjects);
                  } else {
                    showToast(`Comparing ${selectedComparisonIds.length} suppliers`);
                  }
                }}
                className="flex items-center gap-1.5 text-[#2A0E3F] hover:text-[#6B2D8C] transition-colors font-bold text-[13px] cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#6B2D8C]" />
                <span>Compare Specs</span>
              </button>

              <div className="w-px h-5 bg-[#E8DEEF]" />

              <button
                onClick={() => {
                  const csvData = selectedSuppliersObjects.map((s) => `${s.name},${s.type},${s.city},${s.phone}`).join('\n');
                  const blob = new Blob([`Name,Type,City,Phone\n${csvData}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Nexora_Suppliers_Export.csv`;
                  a.click();
                  showToast('Exported selected suppliers to CSV');
                }}
                className="flex items-center gap-1.5 text-[#2A0E3F] hover:text-[#6B2D8C] transition-colors font-bold text-[13px] cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#6B2D8C]" />
                <span>Export CSV</span>
              </button>

              <div className="w-px h-5 bg-[#E8DEEF]" />

              <button
                onClick={() =>
                  onOpenEnquiryModal({
                    title: `Bulk Sourcing Request to ${selectedComparisonIds.length} Suppliers`,
                    supplierName: `${selectedComparisonIds.length} Selected Manufacturers`
                  })
                }
                className="bg-[#6B2D8C] text-white font-bold px-5 py-2 rounded-full hover:bg-[#4A2560] transition-colors text-[13px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Bulk Enquiry</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end md:hidden">
          <div className="bg-white w-5/6 max-w-md h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#E8DEEF] mb-5">
                <h2 className="text-lg font-bold text-[#2A0E3F]">Filter Suppliers</h2>
                <button onClick={() => setIsMobileFilterOpen(false)} className="text-[#7E6C96]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Sort By */}
              <div className="mb-5">
                <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">
                  Sort Manufacturers
                </h3>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[#FDFBF7] border border-[#E8DEEF] text-[13px] font-semibold text-[#2A0E3F] rounded-xl py-2.5 pl-3.5 pr-8 focus:ring-1 focus:ring-[#C9A961]/30 cursor-pointer"
                  >
                    <option value="Relevance">Sort: Relevance</option>
                    <option value="Rating">Sort: Rating</option>
                    <option value="Year Established">Sort: Year Established</option>
                    <option value="Employee Count">Sort: Employee Count</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#7E6C96] pointer-events-none" />
                </div>
              </div>

              {/* Mobile Business Type */}
              <div className="mb-5">
                <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">
                  Business Type
                </h3>
                <div className="flex flex-col gap-2">
                  {['Manufacturer', 'Wholesaler', 'Distributor', 'Exporter', 'OEM/ODM'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-[13px] text-[#2A0E3F]">
                      <input
                        type="checkbox"
                        checked={businessTypeFilters.includes(type)}
                        onChange={() => toggleBusinessTypeFilter(type)}
                        className="rounded border-[#E8DEEF] text-[#6B2D8C]"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Quick Filters */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">Quick Filters</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'verifiedOnly', label: 'Verified Only' },
                  { key: 'oemPrivateLabel', label: 'OEM / Private Label' },
                  { key: 'readyToSupply', label: 'Ready to Supply' },
                  { key: 'topRated', label: 'Top Rated' },
                  { key: 'fastResponse', label: 'Fast Response' },
                  { key: 'lowMoq', label: 'Low MOQ' },
                  { key: 'panIndia', label: 'Pan India' }
                ].map((qf) => (
                  <button
                    key={qf.key}
                    onClick={() => toggleQuickFilter(qf.key)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      quickFilters[qf.key]
                        ? 'bg-[#F5EEF8] border-[#6B2D8C] text-[#6B2D8C] font-bold'
                        : 'bg-[#F4F0E9] border-[#E8DEEF] text-[#5B4A6E]'
                    }`}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile City & Industrial Hubs */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">City &amp; Industrial Hubs</h3>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'All India', value: '' },
                  { name: 'Mumbai', value: 'Mumbai' },
                  { name: 'Baddi', value: 'Baddi' },
                  { name: 'Delhi', value: 'Delhi' },
                  { name: 'Ahmedabad', value: 'Ahmedabad' },
                  { name: 'Bengaluru', value: 'Bengaluru' }
                ].map((hub) => (
                  <button
                    key={hub.name}
                    onClick={() => setSelectedCity(hub.value)}
                    className={`text-left px-3 py-2 rounded-lg text-[13px] font-bold border ${
                      selectedCity === hub.value
                        ? 'bg-[#F5EEF8] text-[#6B2D8C] border-[#D9C3E8]'
                        : 'bg-transparent text-[#5B4A6E] border-[#E8DEEF]'
                    }`}
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-[11.5px] font-semibold text-[#5B4A6E] mb-1">Radius</label>
                <select
                  value={distanceRadius}
                  onChange={(e) => setDistanceRadius(e.target.value)}
                  className="w-full appearance-none bg-[#FDFBF7] border border-[#E8DEEF] text-[13px] font-semibold text-[#2A0E3F] rounded-xl py-2.5 pl-3.5 pr-8"
                >
                  <option value="+250 km">+250 km</option>
                  <option value="+500 km">+500 km</option>
                  <option value="National">National</option>
                </select>
              </div>
            </div>

            {/* Mobile Categories */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">Categories</h3>
              <div className="flex flex-col gap-2">
                {Object.keys(CATEGORY_TAXONOMY).map((catName) => (
                  <label key={catName} className="flex items-center gap-2 text-[13px] text-[#2A0E3F]">
                    <input
                      type="checkbox"
                      checked={selectedCategory === catName}
                      onChange={() => {
                        if (selectedCategory === catName) {
                          setSelectedCategory('');
                          setSelectedSubcategory('');
                        } else {
                          setSelectedCategory(catName);
                          setSelectedSubcategory('');
                        }
                      }}
                      className="rounded border-[#E8DEEF] text-[#6B2D8C]"
                    />
                    <span>{catName}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile Production Scale */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">Production Scale</h3>
              <div className="mb-3">
                <div className="flex justify-between text-[12px] text-[#5B4A6E] font-medium mb-1">
                  <span>Max Order Quantity</span>
                  <span className="font-bold text-[#6B2D8C]">{moqValue.toLocaleString()} units</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={moqValue}
                  onChange={(e) => setMoqValue(Number(e.target.value))}
                  className="w-full accent-[#6B2D8C]"
                />
              </div>
              <div className="mb-2">
                <label className="block text-[11.5px] font-semibold text-[#5B4A6E] mb-1">Monthly Capacity</label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full bg-white border border-[#E8DEEF] text-[12.5px] text-[#2A0E3F] rounded-lg p-2"
                >
                  <option value="Any Capacity">Any Capacity</option>
                  <option value="> 10,000 units">&gt; 10,000 units / mo</option>
                  <option value="> 50,000 units">&gt; 50,000 units / mo</option>
                  <option value="> 100,000 units">&gt; 100,000 units / mo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-[#5B4A6E] mb-1">Lead Time</label>
                <select
                  value={leadTimeFilter}
                  onChange={(e) => setLeadTimeFilter(e.target.value)}
                  className="w-full bg-white border border-[#E8DEEF] text-[12.5px] text-[#2A0E3F] rounded-lg p-2"
                >
                  <option value="Any Lead Time">Any Lead Time</option>
                  <option value="< 15 Days">&lt; 15 Days</option>
                  <option value="< 30 Days">&lt; 30 Days</option>
                  <option value="< 60 Days">&lt; 60 Days</option>
                </select>
              </div>
            </div>

            {/* Mobile Compliance */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider mb-2.5">Compliance &amp; Certs</h3>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'gst', label: 'GST Registered' },
                  { key: 'iso', label: 'ISO 9001:2015' },
                  { key: 'gmp', label: 'WHO-GMP Certified' },
                  { key: 'fda', label: 'US-FDA Registered' },
                  { key: 'organic', label: 'Organic (COSMOS)' },
                  { key: 'crueltyFree', label: 'Cruelty-Free / Leaping Bunny' }
                ].map((cert) => (
                  <label key={cert.key} className="flex items-center gap-2 text-[13px] text-[#2A0E3F]">
                    <input
                      type="checkbox"
                      checked={complianceFilters[cert.key]}
                      onChange={() => toggleComplianceFilter(cert.key)}
                      className="rounded border-[#E8DEEF] text-[#6B2D8C]"
                    />
                    <span>{cert.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8DEEF] flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 border border-[#E8DEEF] rounded-xl text-[13px] font-bold text-[#5B4A6E]"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#6B2D8C] text-white rounded-xl text-[13px] font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Contact Reveal Paywall Modal */}

    </div>
  );
};
