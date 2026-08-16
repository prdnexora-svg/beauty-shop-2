import React, { useState } from 'react';
import {
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  Download,
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Globe2,
  Package,
  Award,
  Sparkles,
  ChevronRight,
  FlaskConical,
  Handshake,
  Building2,
  Check,
  Clock,
  Send,
  ExternalLink,
  Info,
  Filter,
  Layers,
  ZoomIn,
  Video,
  X
} from 'lucide-react';
import { VerifiedSupplier } from '../types';

interface BrandItem {
  id: string;
  name: string;
  category: string;
  tier: 'Luxury' | 'Professional';
  origin: string;
  logo: string;
  heroImage: string;
  moq: string;
  mov: string;
  unitPriceRange: string;
  isVerified: boolean;
  seekingDistributors: boolean;
  activeSkus: number;
}

const BRANDS_LIST: BrandItem[] = [
  {
    id: 'brand-1',
    name: 'Aurevia Professional',
    category: 'Skincare',
    tier: 'Luxury',
    origin: 'Geneva, Switzerland',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80',
    moq: '100 Units',
    mov: '€2,500',
    unitPriceRange: '€9 – €15',
    isVerified: true,
    seekingDistributors: true,
    activeSkus: 42
  },
  {
    id: 'brand-2',
    name: 'Dermaglow Cosmeceuticals',
    category: 'Skincare',
    tier: 'Professional',
    origin: 'Delhi NCR, India',
    logo: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=80',
    moq: '150 Units',
    mov: '₹30,000',
    unitPriceRange: '₹350 – ₹650',
    isVerified: true,
    seekingDistributors: true,
    activeSkus: 28
  },
  {
    id: 'brand-3',
    name: 'KeratinPro Labs',
    category: 'Haircare',
    tier: 'Professional',
    origin: 'Mumbai, India',
    logo: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1200&q=80',
    moq: '50 Liters',
    mov: '₹25,000',
    unitPriceRange: '₹850 – ₹1,200',
    isVerified: true,
    seekingDistributors: true,
    activeSkus: 19
  },
  {
    id: 'brand-4',
    name: 'LuxeForm Glassware',
    category: 'Packaging',
    tier: 'Luxury',
    origin: 'Ahmedabad, India',
    logo: 'https://images.unsplash.com/photo-1608248597359-994b633bfd8a?auto=format&fit=crop&w=200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1200&q=80',
    moq: '1,000 Units',
    mov: '₹35,000',
    unitPriceRange: '₹31 – ₹48',
    isVerified: true,
    seekingDistributors: false,
    activeSkus: 65
  }
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface BrandDirectoryDetailScreenProps {
  onOpenEnquiryModal: (item?: any) => void;
  onOpenRFQModal: () => void;
  onOpenFacilityTour?: (supplier?: VerifiedSupplier) => void;
  onNavigateToSuppliers?: () => void;
}

export const BrandDirectoryDetailScreen: React.FC<BrandDirectoryDetailScreenProps> = ({
  onOpenEnquiryModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToSuppliers
}) => {
  const [selectedBrand, setSelectedBrand] = useState<BrandItem>(BRANDS_LIST[0]);
  const [selectedAlphabet, setSelectedAlphabet] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string[]>(['Luxury', 'Professional']);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'wholesale' | 'catalog' | 'marketing' | 'story'>('wholesale');
  
  // Territory Availability Checker State
  const [territoryQuery, setTerritoryQuery] = useState<string>('');
  const [territoryCheckResult, setTerritoryCheckResult] = useState<{ city: string; status: string; color: string } | null>(null);

  // Selected Products for Multi-Product RFQ Bar
  const [selectedCatalogSkus, setSelectedCatalogSkus] = useState<string[]>([]);

  // Gallery Modal Lightbox
  const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);

  // Download Feedback Toast
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const triggerDownload = (fileName: string) => {
    setDownloadNotification(`Downloading ${fileName}...`);
    setTimeout(() => {
      setDownloadNotification(null);
    }, 3000);
  };

  const handleTerritoryCheck = () => {
    if (!territoryQuery.trim()) return;
    const queryLower = territoryQuery.toLowerCase();
    if (queryLower.includes('mumbai') || queryLower.includes('delhi')) {
      setTerritoryCheckResult({ city: territoryQuery, status: 'Occupied (Exclusive Partner Assigned)', color: 'text-red-600 bg-red-50 border-red-200' });
    } else if (queryLower.includes('pune') || queryLower.includes('bangalore') || queryLower.includes('bengaluru')) {
      setTerritoryCheckResult({ city: territoryQuery, status: 'Limited (2 Slots Available)', color: 'text-amber-600 bg-amber-50 border-amber-200' });
    } else {
      setTerritoryCheckResult({ city: territoryQuery, status: 'OPEN (Exclusive Territory Rights Available)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' });
    }
  };

  const toggleCatalogSku = (skuId: string) => {
    if (selectedCatalogSkus.includes(skuId)) {
      setSelectedCatalogSkus(selectedCatalogSkus.filter((id) => id !== skuId));
    } else {
      setSelectedCatalogSkus([...selectedCatalogSkus, skuId]);
    }
  };

  return (
    <div className="bg-[#fdf8f8] min-h-screen text-[#1c1b1b]">
      
      {/* Download Notification Toast */}
      {downloadNotification && (
        <div className="fixed top-24 right-6 z-50 bg-[#1c1b1b] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border border-white/20">
          <Download className="w-4 h-4 text-[#b90064]" />
          <span>{downloadNotification}</span>
        </div>
      )}

      {/* Alphabet Quick Nav & Brand Search Strip */}
      <div className="bg-[#fcf9f8] border-b border-[#e8e8e8] sticky top-20 z-30 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          
          {/* Alphabet Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSelectedAlphabet('All')}
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                selectedAlphabet === 'All'
                  ? 'bg-[#b90064] text-white shadow-xs'
                  : 'text-[#594047] hover:text-[#b90064] hover:bg-[#fde7f3]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedAlphabet('#')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedAlphabet === '#'
                  ? 'bg-[#b90064] text-white shadow-xs'
                  : 'text-[#594047] hover:text-[#b90064] hover:bg-[#fde7f3]'
              }`}
            >
              #
            </button>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedAlphabet(letter)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedAlphabet === letter
                    ? 'bg-[#b90064] text-white shadow-xs'
                    : 'text-[#594047] hover:text-[#b90064] hover:bg-[#fde7f3]'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Quick Search Input */}
          <div className="relative shrink-0 w-64 hidden xl:block">
            <Search className="w-4 h-4 text-[#8c7077] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verified brands..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:ring-2 focus:ring-[#b90064]/20 focus:border-[#b90064] outline-none"
            />
          </div>

        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left SideNav Filter & Brand Selector Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#f0f0f0] pb-3">
              <h2 className="text-sm font-bold text-[#1c1b1b] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#b90064]" />
                Brand Filters
              </h2>
              <span className="text-[10px] font-bold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-full">
                4 Verified
              </span>
            </div>

            {/* Category Filter */}
            <div className="space-y-3 mb-6">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8c7077]">Categories</h3>
              <div className="space-y-1.5 text-xs">
                {['All', 'Skincare', 'Haircare', 'Packaging', 'Wellness'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#fde7f3] text-[#b90064] font-bold'
                        : 'text-[#594047] hover:bg-[#f7f2f2]'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-[#b90064]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Tier Filter */}
            <div className="space-y-3 mb-6">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8c7077]">Brand Tier</h3>
              <div className="space-y-2 text-xs text-[#594047]">
                <label className="flex items-center gap-2.5 cursor-pointer font-medium hover:text-[#1c1b1b]">
                  <input
                    type="checkbox"
                    checked={selectedTier.includes('Luxury')}
                    onChange={() => {
                      setSelectedTier(prev =>
                        prev.includes('Luxury') ? prev.filter(t => t !== 'Luxury') : [...prev, 'Luxury']
                      );
                    }}
                    className="rounded text-[#b90064] focus:ring-[#b90064]"
                  />
                  <span>Luxury Brands</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer font-medium hover:text-[#1c1b1b]">
                  <input
                    type="checkbox"
                    checked={selectedTier.includes('Professional')}
                    onChange={() => {
                      setSelectedTier(prev =>
                        prev.includes('Professional') ? prev.filter(t => t !== 'Professional') : [...prev, 'Professional']
                      );
                    }}
                    className="rounded text-[#b90064] focus:ring-[#b90064]"
                  />
                  <span>Professional Lines</span>
                </label>
              </div>
            </div>

            {/* Brand Selection List */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8c7077]">Select Brand</h3>
              <div className="space-y-2">
                {BRANDS_LIST.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedBrand.id === b.id
                        ? 'border-[#b90064] bg-[#fde7f3]/50 shadow-xs ring-1 ring-[#b90064]/20'
                        : 'border-[#e8e8e8] hover:border-[#b90064]/50 bg-white'
                    }`}
                  >
                    <img src={b.logo} alt={b.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#e8e8e8]" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#1c1b1b] truncate">{b.name}</p>
                      <p className="text-[10px] font-medium text-[#594047]">{b.origin}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Right Main Content Canvas Area */}
        <main className="flex-1 min-w-0">
          
          {/* Breadcrumb & Action Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            
            <div className="flex items-center gap-2 text-xs font-semibold text-[#594047]">
              <span className="hover:text-[#b90064] cursor-pointer">Brand Directory</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8c7077]" />
              <span className="hover:text-[#b90064] cursor-pointer">{selectedBrand.category}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8c7077]" />
              <span className="text-[#1c1b1b] font-bold">{selectedBrand.name}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onOpenEnquiryModal({ title: `Tester Kit Request for ${selectedBrand.name}` })}
                className="px-4 py-2 bg-[#fde7f3] text-[#b90064] rounded-xl font-bold text-xs hover:bg-white border border-[#f5b8d6] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <FlaskConical className="w-4 h-4 text-[#b90064]" />
                <span>Request Tester Kit</span>
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`px-3.5 py-2 border rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isSaved
                    ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064]'
                    : 'border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064] bg-white'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-[#b90064]" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={() => onOpenEnquiryModal({ title: `Wholesale Trade Terms for ${selectedBrand.name}` })}
                className="px-4 py-2 bg-[#b90064] text-white rounded-xl font-bold text-xs hover:bg-[#8e004b] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Handshake className="w-4 h-4" />
                <span>Request Terms</span>
              </button>
            </div>

          </div>

          {/* Brand Header Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Hero Image & Headline Box */}
            <div className="lg:col-span-2 relative h-[360px] rounded-2xl overflow-hidden shadow-sm group">
              <img
                src={selectedBrand.heroImage}
                alt={selectedBrand.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Floating Commercial Specs Pill Bar */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-2 flex-wrap">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 flex items-center gap-3 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1b1b]">
                    <span className="text-[#b90064] font-extrabold">MOV:</span>
                    <span>{selectedBrand.mov}</span>
                  </div>
                  <div className="w-px h-3.5 bg-[#e8e8e8]" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1b1b]">
                    <span className="text-[#b90064] font-extrabold">MOQ:</span>
                    <span>{selectedBrand.moq}</span>
                  </div>
                  <div className="w-px h-3.5 bg-[#e8e8e8]" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1b1b]">
                    <span className="text-[#b90064] font-extrabold">Unit Price:</span>
                    <span>{selectedBrand.unitPriceRange}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Brand Title & Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[11px] font-bold border border-white/30 mb-2">
                    Verified Partner • {selectedBrand.tier} Tier
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
                    {selectedBrand.name}
                  </h1>
                  <p className="text-xs text-white/90 max-w-md line-clamp-2">
                    Clinical-grade botanical formulations designed exclusively for luxury spa, aesthetic clinics, and dermatology practices.
                  </p>
                </div>

                <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center shadow-xl shrink-0 border border-white/50">
                  <img src={selectedBrand.logo} alt={selectedBrand.name} className="w-full h-full object-contain rounded-lg" />
                </div>
              </div>

            </div>

            {/* Commercial Overview Glass Card */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-[#1c1b1b] mb-4 pb-3 border-b border-[#f0f0f0] flex items-center justify-between">
                  <span>Commercial Overview</span>
                  <span className="text-[10px] font-bold text-[#00875a] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                    Audited B2B
                  </span>
                </h3>

                <ul className="space-y-3.5 text-xs">
                  <li className="flex justify-between items-center py-1 border-b border-[#f0f0f0]">
                    <span className="text-[#594047] flex items-center gap-2 font-medium">
                      <Globe2 className="w-4 h-4 text-[#b90064]" />
                      Origin
                    </span>
                    <span className="font-bold text-[#1c1b1b]">{selectedBrand.origin}</span>
                  </li>

                  <li className="flex justify-between items-center py-1 border-b border-[#f0f0f0]">
                    <span className="text-[#594047] flex items-center gap-2 font-medium">
                      <Package className="w-4 h-4 text-[#b90064]" />
                      Minimum Order (MOV)
                    </span>
                    <span className="font-bold text-[#1c1b1b]">{selectedBrand.mov}</span>
                  </li>

                  <li className="flex justify-between items-center py-1 border-b border-[#f0f0f0]">
                    <span className="text-[#594047] flex items-center gap-2 font-medium">
                      <Award className="w-4 h-4 text-[#b90064]" />
                      Certifications
                    </span>
                    <span className="font-bold text-[#1c1b1b]">ISO 22716, EcoCert</span>
                  </li>

                  <li className="flex justify-between items-center py-1 border-b border-[#f0f0f0]">
                    <span className="text-[#594047] flex items-center gap-2 font-medium">
                      <Layers className="w-4 h-4 text-[#b90064]" />
                      Active SKU Count
                    </span>
                    <span className="font-bold text-[#1c1b1b]">{selectedBrand.activeSkus} SKUs</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f0f0f0]">
                <p className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider mb-1">Avg. Fulfillment Turnaround</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#1c1b1b]">5–7</span>
                  <span className="text-xs font-semibold text-[#594047]">Business Days</span>
                </div>
              </div>

            </div>

          </div>

          {/* Brand Story & Lineage Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
              <h2 className="text-lg font-extrabold text-[#1c1b1b] mb-2">Brand Story & Lineage</h2>
              <p className="text-xs text-[#594047] leading-relaxed mb-6">
                Founded in Geneva, {selectedBrand.name} bridges the gap between clinical dermatology and botanical luxury. Our heritage is rooted in Alpine cellular research, utilizing high-altitude flora for potent regenerative properties with bio-fermented active complexes.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl">
                  <p className="text-[10px] font-bold text-[#b90064] uppercase tracking-wider">Origin & Lab</p>
                  <p className="text-xs font-bold text-[#1c1b1b]">{selectedBrand.origin}</p>
                </div>
                <div className="p-3.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl">
                  <p className="text-[10px] font-bold text-[#b90064] uppercase tracking-wider">Heritage & R&D</p>
                  <p className="text-xs font-bold text-[#1c1b1b]">30+ Years Research</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-2xs">
              <div className="w-14 h-14 bg-[#fde7f3] text-[#b90064] rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-[#1c1b1b] mb-1">Official Flagship Partner</h3>
              <p className="text-[11px] text-[#8c7077]">Trademark Verified • Reg. #CH-99281</p>
            </div>
          </div>

          {/* Sticky Internal Navigation Bar */}
          <div className="sticky top-[132px] z-20 bg-[#fdf8f8]/95 backdrop-blur-md border-b border-[#e8e8e8] mb-8 -mx-4 px-4 md:-mx-10 md:px-10">
            <div className="flex items-center gap-8 overflow-x-auto hide-scrollbar pt-3">
              <button
                onClick={() => setActiveTab('wholesale')}
                className={`pb-3 px-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'wholesale'
                    ? 'text-[#b90064] border-b-2 border-[#b90064]'
                    : 'text-[#594047] hover:text-[#b90064]'
                }`}
              >
                Distribution & Wholesale
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`pb-3 px-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'text-[#b90064] border-b-2 border-[#b90064]'
                    : 'text-[#594047] hover:text-[#b90064]'
                }`}
              >
                Product Catalog ({selectedBrand.activeSkus})
              </button>
              <button
                onClick={() => setActiveTab('marketing')}
                className={`pb-3 px-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'marketing'
                    ? 'text-[#b90064] border-b-2 border-[#b90064]'
                    : 'text-[#594047] hover:text-[#b90064]'
                }`}
              >
                Marketing Assets & Collateral
              </button>
              <button
                onClick={() => setActiveTab('story')}
                className={`pb-3 px-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'story'
                    ? 'text-[#b90064] border-b-2 border-[#b90064]'
                    : 'text-[#594047] hover:text-[#b90064]'
                }`}
              >
                Full Brand Dossier
              </button>
            </div>
          </div>

          {/* Tab Content: Distribution & Wholesale */}
          {activeTab === 'wholesale' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
              
              {/* Left Column: Territory Availability & Logistics */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Territory Availability Matrix */}
                <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-[#1c1b1b]">Authorized Territories & Availability</h3>
                    <div className="flex gap-1.5">
                      <span className="px-2.5 py-0.5 bg-[#fde7f3] text-[#b90064] rounded-full text-[10px] font-bold">
                        EU
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#fde7f3] text-[#b90064] rounded-full text-[10px] font-bold">
                        NA
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#fde7f3] text-[#b90064] rounded-full text-[10px] font-bold">
                        APAC
                      </span>
                    </div>
                  </div>

                  {/* Territory Checker Search Bar */}
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <MapPin className="w-4 h-4 text-[#8c7077] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={territoryQuery}
                          onChange={(e) => setTerritoryQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleTerritoryCheck()}
                          placeholder="Enter your city or region (e.g., Pune, Mumbai, Delhi, Bangalore)..."
                          className="w-full pl-9 pr-4 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:ring-2 focus:ring-[#b90064]/20 focus:border-[#b90064] outline-none"
                        />
                      </div>
                      <button
                        onClick={handleTerritoryCheck}
                        className="px-6 py-2.5 bg-[#fde7f3] text-[#b90064] font-bold text-xs rounded-xl hover:bg-[#b90064] hover:text-white transition-all cursor-pointer border border-[#f5b8d6]"
                      >
                        Check Territory Status
                      </button>
                    </div>

                    {territoryCheckResult && (
                      <div className={`mt-3 p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${territoryCheckResult.color}`}>
                        <span>Territory ({territoryCheckResult.city}): {territoryCheckResult.status}</span>
                        <button
                          onClick={() => onOpenEnquiryModal({ title: `Exclusive Territory Rights for ${territoryCheckResult.city}` })}
                          className="px-3 py-1 bg-[#b90064] text-white rounded-lg text-[11px] font-bold hover:bg-[#8e004b] transition-all"
                        >
                          Apply Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Regional Status Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3.5 border border-[#e8e8e8] rounded-xl bg-emerald-50/50">
                      <p className="text-xs font-bold text-[#1c1b1b]">North India</p>
                      <p className="text-[10px] text-emerald-700 font-extrabold uppercase mt-1">OPEN FOR DISTRIBUTOR</p>
                    </div>
                    <div className="p-3.5 border border-[#e8e8e8] rounded-xl bg-amber-50/50">
                      <p className="text-xs font-bold text-[#1c1b1b]">West India</p>
                      <p className="text-[10px] text-amber-700 font-extrabold uppercase mt-1">LIMITED (2 SLOTS)</p>
                    </div>
                    <div className="p-3.5 border border-[#e8e8e8] rounded-xl bg-blue-50/50">
                      <p className="text-xs font-bold text-[#1c1b1b]">South India</p>
                      <p className="text-[10px] text-blue-700 font-extrabold uppercase mt-1">RETAIL ONLY</p>
                    </div>
                    <div className="p-3.5 border border-[#e8e8e8] rounded-xl bg-[#f0edec]/60">
                      <p className="text-xs font-bold text-[#1c1b1b]">Mumbai Metro</p>
                      <p className="text-[10px] text-[#8c7077] font-extrabold uppercase mt-1">EXCLUSIVE ASSIGNED</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenEnquiryModal({ title: `Regional Partnership Application for ${selectedBrand.name}` })}
                    className="w-full mt-6 py-3 bg-[#b90064] text-white rounded-xl font-bold text-xs hover:bg-[#8e004b] transition-all cursor-pointer shadow-xs"
                  >
                    Apply for Brand Distribution Partnership
                  </button>

                </div>

                {/* Supply Chain & Trade Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center mb-4">
                      <Package className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1c1b1b] mb-1">Logistics & Shipping</h4>
                    <p className="text-xs text-[#594047] mb-4">
                      Ex-works (EXW) from Geneva / bonded Mumbai warehouse. DDP options available for orders over €10k.
                    </p>
                    <button
                      onClick={() => onOpenEnquiryModal({ title: 'Logistics Policy Inquiry' })}
                      className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1"
                    >
                      View Shipping Policy <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center mb-4">
                      <Handshake className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1c1b1b] mb-1">Trade Terms</h4>
                    <p className="text-xs text-[#594047] mb-4">
                      Net 30 for approved corporate accounts. 50% deposit required for initial opening orders.
                    </p>
                    <button
                      onClick={() => onOpenEnquiryModal({ title: 'Credit Application for Wholesale' })}
                      className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1"
                    >
                      Apply for B2B Credit <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Downloads, Account Manager & Manufacturer Link */}
              <div className="space-y-6">
                
                {/* Document Access */}
                <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                  <h3 className="text-sm font-bold text-[#1c1b1b] mb-2">Compliance & Brand Assets</h3>
                  <p className="text-xs text-[#594047] mb-4">
                    Download verified commercial documentation for immediate procurement evaluation.
                  </p>
                  
                  <div className="space-y-2.5">
                    <button
                      onClick={() => triggerDownload('Brand_Deck_2024.pdf')}
                      className="w-full flex items-center p-3 border border-[#e8e8e8] rounded-xl hover:border-[#b90064] transition-all text-left group cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-[#8c7077] group-hover:text-[#b90064] mr-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1c1b1b] truncate">Brand Deck & Lookbook 2024</p>
                        <p className="text-[10px] text-[#8c7077]">PDF • 4.2 MB</p>
                      </div>
                      <Download className="w-4 h-4 text-[#8c7077] group-hover:text-[#b90064] shrink-0 ml-2" />
                    </button>

                    <button
                      onClick={() => triggerDownload('Wholesale_Price_List.xlsx')}
                      className="w-full flex items-center p-3 border border-[#e8e8e8] rounded-xl hover:border-[#b90064] transition-all text-left group cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-[#8c7077] group-hover:text-[#b90064] mr-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1c1b1b] truncate">Wholesale Price Matrix (EU/IN)</p>
                        <p className="text-[10px] text-[#8c7077]">XLSX • 1.1 MB</p>
                      </div>
                      <Download className="w-4 h-4 text-[#8c7077] group-hover:text-[#b90064] shrink-0 ml-2" />
                    </button>

                    <button
                      onClick={() => triggerDownload('ISO_and_EcoCert.zip')}
                      className="w-full flex items-center p-3 border border-[#e8e8e8] rounded-xl hover:border-[#b90064] transition-all text-left group cursor-pointer"
                    >
                      <Award className="w-5 h-5 text-[#8c7077] group-hover:text-[#b90064] mr-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1c1b1b] truncate">ISO & EcoCert Compliance Dossier</p>
                        <p className="text-[10px] text-[#8c7077]">ZIP • 8.5 MB</p>
                      </div>
                      <Download className="w-4 h-4 text-[#8c7077] group-hover:text-[#b90064] shrink-0 ml-2" />
                    </button>
                  </div>
                </div>

                {/* Technical Downloads */}
                <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                  <h3 className="text-sm font-bold text-[#1c1b1b] mb-3">Technical Downloads</h3>
                  <div className="space-y-2">
                    {['SDS (Safety Data Sheets)', 'COA (Cert. of Analysis)', 'GMP Compliance Certificate'].map((doc) => (
                      <button
                        key={doc}
                        onClick={() => triggerDownload(`${doc}.pdf`)}
                        className="w-full flex items-center justify-between p-3 bg-[#fcf9f8] rounded-xl hover:bg-[#fde7f3] transition-all text-xs font-bold text-[#1c1b1b] cursor-pointer"
                      >
                        <span>{doc}</span>
                        <Download className="w-4 h-4 text-[#b90064]" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dedicated Account Manager Box */}
                <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                  <h3 className="text-sm font-bold text-[#1c1b1b] mb-4">Dedicated Account Manager</h3>
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                      alt="Elena Rostova"
                      className="w-12 h-12 rounded-full object-cover border border-[#e8e8e8]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#1c1b1b]">Elena Rostova</p>
                      <p className="text-[10px] text-[#8c7077]">Head of B2B Partnerships, EMEA</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#594047] mb-5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#b90064]" />
                      <span>e.rostova@aurevia.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#b90064]" />
                      <span>+41 22 555 0198</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenEnquiryModal({ title: `Intro Call Schedule with Elena Rostova for ${selectedBrand.name}` })}
                    className="w-full py-2.5 bg-white border border-[#e8e8e8] text-[#1c1b1b] font-bold text-xs rounded-xl hover:border-[#b90064] hover:text-[#b90064] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-[#b90064]" />
                    <span>Schedule Intro Call</span>
                  </button>
                </div>

                {/* Linked Manufacturer Card */}
                <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-2xs">
                  <p className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider mb-2">OEM / Contract Manufacturer</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-[#fde7f3] text-[#b90064] rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1c1b1b]">Aura Labs & Manufacturing</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9.5px] font-extrabold text-[#00875a] bg-[#e6f4ea] px-1.5 py-0.5 rounded">
                          NEXORA VERIFIED
                        </span>
                        <span className="text-[9.5px] font-bold text-[#0050d6] bg-[#dbe1ff] px-1.5 py-0.5 rounded">
                          ISO 9001
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onNavigateToSuppliers) {
                        onNavigateToSuppliers();
                      }
                    }}
                    className="w-full py-2 text-xs font-bold text-[#b90064] border border-[#f5b8d6] bg-[#fde7f3] rounded-xl hover:bg-[#b90064] hover:text-white transition-all cursor-pointer"
                  >
                    View Facility Profile & Virtual Tour
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Tab Content: Product Catalog Grid */}
          {activeTab === 'catalog' && (
            <div className="mb-10 space-y-6">
              <div className="flex items-center justify-between bg-white p-4 border border-[#e8e8e8] rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-[#1c1b1b]">Available B2B Wholesale SKUs</h3>
                  <p className="text-xs text-[#8c7077]">Select products to include in a multi-product bulk RFQ</p>
                </div>
                <span className="text-xs font-bold text-[#b90064] bg-[#fde7f3] px-3 py-1 rounded-full">
                  {selectedCatalogSkus.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    id: 'cat-sku-1',
                    title: 'Botanical Ceramide Barrier Repair Cream (50g Jar)',
                    moq: '100 Units',
                    price: '€12.50 / Unit',
                    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'
                  },
                  {
                    id: 'cat-sku-2',
                    title: 'Alpine Peptide Concentrated Serum Base (30ml Dropper)',
                    moq: '150 Units',
                    price: '€14.00 / Unit',
                    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80'
                  },
                  {
                    id: 'cat-sku-3',
                    title: 'Hydrating Botanical Cleansing Emulsion (200ml Pump)',
                    moq: '120 Units',
                    price: '€9.50 / Unit',
                    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80'
                  }
                ].map((item) => {
                  const isSelected = selectedCatalogSkus.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                        isSelected ? 'border-[#b90064] ring-1 ring-[#b90064]/20 bg-[#fde7f3]/20' : 'border-[#e8e8e8]'
                      }`}
                    >
                      <div>
                        <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded-xl mb-3" />
                        <h4 className="text-xs font-bold text-[#1c1b1b] mb-1 line-clamp-2">{item.title}</h4>
                        <div className="flex items-center justify-between text-[11px] text-[#594047] mb-3">
                          <span>MOQ: {item.moq}</span>
                          <span className="font-bold text-[#b90064]">{item.price}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleCatalogSku(item.id)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#b90064] text-white'
                            : 'bg-[#fde7f3] text-[#b90064] hover:bg-[#b90064] hover:text-white'
                        }`}
                      >
                        {isSelected ? 'SKU Selected' : '+ Select for RFQ'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content: Marketing Assets */}
          {activeTab === 'marketing' && (
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 mb-10 space-y-4">
              <h3 className="text-sm font-bold text-[#1c1b1b]">Retail & Merchandising Assets</h3>
              <p className="text-xs text-[#594047]">
                High-resolution POS display graphics, social media collateral, and clinical brochure templates available for verified stockists.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => triggerDownload('POS_Display_Graphics_2024.zip')}
                  className="p-4 border border-[#e8e8e8] rounded-xl text-left hover:border-[#b90064] transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1c1b1b]">POS Display Print Files (300 DPI)</p>
                    <p className="text-[10px] text-[#8c7077]">ZIP • 45 MB</p>
                  </div>
                  <Download className="w-4 h-4 text-[#b90064]" />
                </button>

                <button
                  onClick={() => triggerDownload('Clinical_Studies_Compendium.pdf')}
                  className="p-4 border border-[#e8e8e8] rounded-xl text-left hover:border-[#b90064] transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1c1b1b]">Clinical Trial Efficacy Compendium</p>
                    <p className="text-[10px] text-[#8c7077]">PDF • 12 MB</p>
                  </div>
                  <Download className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Full Brand Story */}
          {activeTab === 'story' && (
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 mb-10 space-y-4">
              <h3 className="text-sm font-bold text-[#1c1b1b]">Alpine Research & Innovation Dossier</h3>
              <p className="text-xs text-[#594047] leading-relaxed">
                Founded in 1994 in Geneva, {selectedBrand.name} operates dedicated bio-fermentation cleanrooms. Every formulation undergoes double-blind clinical trials for barrier efficacy, cellular longevity, and hypoallergenic tolerance.
              </p>
            </div>
          )}

          {/* Retail & Merchandising Photo Gallery Section */}
          <section className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-base font-bold text-[#1c1b1b]">Retail Presence & Merchandising</h2>
                <p className="text-xs text-[#594047]">Suggested POS layouts and premium clinic installations.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  title: 'Merchandising Display',
                  url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
                },
                {
                  title: 'Primary Packaging Detail',
                  url: 'https://images.unsplash.com/photo-1608248597359-994b633bfd8a?auto=format&fit=crop&w=600&q=80'
                },
                {
                  title: 'Clinic Reception Bay',
                  url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'
                },
                {
                  title: 'Treatment Room Setup',
                  url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveGalleryImage(item.url)}
                  className="relative group h-44 rounded-xl overflow-hidden cursor-pointer border border-[#e8e8e8]"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>

      </div>

      {/* Gallery Lightbox Modal */}
      {activeGalleryImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setActiveGalleryImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={activeGalleryImage} alt="Gallery Preview" className="w-full h-[500px] object-cover rounded-xl" />
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar / Multi-Product RFQ Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#e8e8e8] p-4 z-40 shadow-2xl">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 px-4 md:px-10">
          <div className="flex items-center gap-3">
            <span className="bg-[#fde7f3] text-[#b90064] px-3 py-1 rounded-full text-xs font-extrabold">
              {selectedCatalogSkus.length} SKUs Selected
            </span>
            <p className="text-xs text-[#594047] hidden md:block">
              Select products from the catalog tab to create a multi-product bulk RFQ
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedCatalogSkus.length > 0 && (
              <button
                onClick={() => setSelectedCatalogSkus([])}
                className="px-4 py-2 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#594047] hover:bg-[#f0edec] transition-colors"
              >
                Clear Selection
              </button>
            )}

            <button
              onClick={onOpenRFQModal}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-bold hover:bg-[#8e004b] transition-all shadow-sm cursor-pointer"
            >
              Send Multi-Product RFQ
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
