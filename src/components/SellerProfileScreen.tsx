import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Star,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  X,
  Award,
  Clock,
  Sparkles,
  MapPin,
  Bookmark,
  ChevronRight,
  ChevronDown,
  Send,
  Building2,
  ExternalLink,
  FlaskConical,
  PackageCheck,
  Check,
  BadgeCheck,
  Shield,
  Eye,
  Phone,
  MessageCircle,
  Search,
  Filter,
  ArrowLeft,
  ArrowUpDown,
  SlidersHorizontal,
  Calendar,
  Users,
  UserPlus,
  Layers,
  ShoppingBag,
  Zap,
  Globe,
  FileCheck
} from 'lucide-react';
import { getSellerProfile, getProductsForSeller, SellerProfileData } from '../data/sellerProfilesData';
import { ProductDetailData } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface SellerProfileScreenProps {
  sellerId?: string;
  isLoggedIn?: boolean;
  onBack?: () => void;
  onNavigateToProductDetail?: (productId: string) => void;
  onOpenAuth?: () => void;
  onOpenEnquiryModal?: (item: any) => void;
  onOpenQuoteModal?: (supplierName?: string) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const SellerProfileScreen: React.FC<SellerProfileScreenProps> = ({
  sellerId,
  isLoggedIn = false,
  onBack,
  onNavigateToProductDetail,
  onOpenAuth,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onCallSupplier,
  onWhatsAppSupplier
}) => {
  // Fetch supplier profile & products
  const profile: SellerProfileData = getSellerProfile(sellerId);
  const sellerProducts: ProductDetailData[] = getProductsForSeller(profile.id);

  // Tab State
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'oem' | 'contact'>('about');

  // Product Filter & Sort State
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'popularity' | 'moq_asc' | 'name_asc'>('latest');

  // Interactive Modals & Toast State
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCertForPreview, setSelectedCertForPreview] = useState<string | null>(null);

  // Dynamic Follower Tracking & State Persistence
  const followKey = `follow_${profile.id}`;
  const countKey = `follower_count_${profile.id}`;

  const [isFollowed, setIsFollowed] = useState<boolean>(() => {
    return localStorage.getItem(followKey) === 'true';
  });

  const [followerCount, setFollowerCount] = useState<number>(() => {
    const saved = localStorage.getItem(countKey);
    if (saved) return parseInt(saved, 10);
    // Consistent, realistic starting follower counts
    let hash = 0;
    for (let i = 0; i < profile.name.length; i++) {
      hash = (hash << 5) - hash + profile.name.charCodeAt(i);
    }
    return Math.abs(hash % 400) + 250; // realistic starting number between 250 and 650
  });

  const handleFollowToggle = () => {
    const nextFollowed = !isFollowed;
    const nextCount = followerCount + (nextFollowed ? 1 : -1);
    setIsFollowed(nextFollowed);
    setFollowerCount(nextCount);
    localStorage.setItem(followKey, String(nextFollowed));
    localStorage.setItem(countKey, String(nextCount));

    // Dispatch a custom event to sync across the application
    window.dispatchEvent(new CustomEvent('supplier-follow-updated', {
      detail: { supplierId: profile.id, isFollowed: nextFollowed, followerCount: nextCount }
    }));

    showToast(nextFollowed ? `You are now following ${profile.name}!` : `You have unfollowed ${profile.name}.`);
  };

  // RFQ Direct Form state inside Contact tab
  const [rfqProductName, setRfqProductName] = useState(sellerProducts[0]?.title || 'Custom Formulations');
  const [rfqQuantity, setRfqQuantity] = useState('1000 Units');
  const [rfqMessage, setRfqMessage] = useState('');
  const [rfqTimeline, setRfqTimeline] = useState('Immediate (Within 2 Weeks)');
  const [rfqSubmitted, setRfqSubmitted] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Helper parsers for sorting
  const parsePriceValue = (p: ProductDetailData): number => {
    if (typeof p.priceMin === 'number' && !isNaN(p.priceMin) && p.priceMin > 0) return p.priceMin;
    const match = p.priceRange?.match(/\d[\d,]*/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''), 10) || 0;
    }
    return 0;
  };

  const parseMoqValue = (p: ProductDetailData): number => {
    const match = p.moq?.match(/\d[\d,]*/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''), 10) || 0;
    }
    return 0;
  };

  // Filter & Sort products
  const categories = ['All', ...Array.from(new Set(sellerProducts.map(p => p.category)))];
  
  const filteredProducts = useMemo(() => {
    const list = sellerProducts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.category.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return parsePriceValue(a) - parsePriceValue(b);
      }
      if (sortBy === 'price_desc') {
        return parsePriceValue(b) - parsePriceValue(a);
      }
      if (sortBy === 'moq_asc') {
        return parseMoqValue(a) - parseMoqValue(b);
      }
      if (sortBy === 'name_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'popularity') {
        const scoreA = (a.sellerDetails?.trustScore || 90) + (a.bulkTiers?.length || 0) * 5;
        const scoreB = (b.sellerDetails?.trustScore || 90) + (b.bulkTiers?.length || 0) * 5;
        return scoreB - scoreA;
      }
      // 'latest' default
      return 0;
    });
  }, [sellerProducts, productSearch, selectedCategory, sortBy]);

  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRfqSubmitted(true);
    showToast(`RFQ for "${rfqProductName}" sent to ${profile.name}!`);
    setTimeout(() => {
      setRfqMessage('');
      setRfqSubmitted(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2A0E3F] font-sans pb-24 md:pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#2A0E3F] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#352B44] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#8236A0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar / Breadcrumb */}
      <div className="bg-white border-b border-[#F5EEF8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5B4A6E] hover:text-[#6B2D8C] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <div className="h-4 w-px bg-[#D9C3E8]" />
            <div className="flex items-center gap-2 text-xs text-[#5B4A6E]">
              <span>Suppliers</span>
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-[#2A0E3F]">{profile.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFollowToggle}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isFollowed
                  ? 'bg-[#F5EEF8] text-[#6B2D8C] border-[#D9C3E8]'
                  : 'bg-white text-[#5B4A6E] border-[#D9C3E8] hover:bg-[#FDFBF7]'
              }`}
            >
              {isFollowed ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#6B2D8C]" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-[#7E6C96]" />
                  <span>Follow</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                showToast(isBookmarked ? 'Removed from saved suppliers' : 'Supplier saved to your workspace');
              }}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#F5EEF8] text-[#6B2D8C] border-[#D9C3E8]'
                  : 'bg-white text-[#5B4A6E] border-[#D9C3E8] hover:bg-[#FDFBF7]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#6B2D8C]' : ''}`} />
              <span>{isBookmarked ? 'Saved Supplier' : 'Save Supplier'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini-Website Header Banner & Profile Summary */}
      <section className="relative bg-[#2A0E3F] text-white overflow-hidden">
        {/* Banner Background */}
        <div className="absolute inset-0 z-0 opacity-35">
          <img
            src={profile.bannerUrl}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A0E3F] via-[#2A0E3F]/80 to-transparent z-0" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-10 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white p-2 shadow-2xl border-2 border-white/80 overflow-hidden flex items-center justify-center">
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              {profile.isNexoraVerified && (
                <div className="absolute -bottom-2 -right-2 bg-[#6B2D8C] text-white p-1.5 rounded-full border-2 border-white shadow-md">
                  <BadgeCheck className="w-4 h-4 fill-[#6B2D8C] text-white" />
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#6B2D8C] text-white text-[11px] font-bold tracking-wide uppercase">
                  {profile.businessType}
                </span>
                {profile.isGstVerified && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> GST Verified ({profile.gstin})
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                  {profile.trustTier} Trust Tier
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600/25 text-purple-200 border border-purple-600/30 text-[11px] font-bold flex items-center gap-1.5 transition-all">
                  <Users className="w-3.5 h-3.5 text-purple-300" />
                  <span>{followerCount} Followers</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">
                {profile.legalName}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-300 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8236A0]" />
                  {profile.industrialZone}, {profile.city}, {profile.state} - {profile.pincode}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  Est. {profile.establishedYear}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  {profile.employeeCount}
                </span>
              </div>

              {/* Certifications Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {profile.certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium bg-white/10 backdrop-blur-xs text-white border border-white/15 px-2.5 py-1 rounded-md"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="w-full md:w-auto bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={handleFollowToggle}
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all border cursor-pointer ${
                  isFollowed
                    ? 'bg-[#F5EEF8] text-[#6B2D8C] border-[#D9C3E8] hover:bg-[#fbc5e3]'
                    : 'bg-[#6B2D8C] hover:bg-[#9e0055] text-white border-transparent'
                }`}
              >
                {isFollowed ? (
                  <>
                    <Check className="w-4 h-4 text-[#6B2D8C]" />
                    <span>Following Supplier</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-white animate-pulse" />
                    <span>Follow Supplier</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onWhatsAppSupplier(profile.name)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp Business</span>
              </button>

              <button
                onClick={() => {
                  setPhoneRevealed(true);
                  onCallSupplier(profile.name);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-stone-100 text-[#2A0E3F] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#6B2D8C]" />
                <span>{phoneRevealed ? profile.phone : `Call Supplier (${profile.phone.slice(0, 7)}***)`}</span>
              </button>

              <button
                onClick={() => onOpenQuoteModal ? onOpenQuoteModal(profile.name) : setActiveTab('contact')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#8236A0]" />
                <span>Request Custom Bulk Quote</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Dashboard Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/15">
            <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-[#8236A0] mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold text-stone-300">Response SLA</span>
              </div>
              <p className="text-lg font-extrabold text-white">{profile.responseSla}</p>
              <p className="text-[11px] text-stone-400">{profile.responseRate}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-[#8236A0] mb-1">
                <PackageCheck className="w-4 h-4" />
                <span className="text-xs font-bold text-stone-300">Orders Fulfilled</span>
              </div>
              <p className="text-lg font-extrabold text-white">{profile.ordersFulfilled}</p>
              <p className="text-[11px] text-stone-400">99.4% On-Time Delivery</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-xs font-bold text-stone-300">Buyer Rating</span>
              </div>
              <p className="text-lg font-extrabold text-white">{profile.overallRating} / 5.0</p>
              <p className="text-[11px] text-stone-400">Based on {profile.totalReviewsCount} reviews</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-stone-300">B2B Followers</span>
              </div>
              <p className="text-lg font-extrabold text-white transition-all duration-300 scale-100 hover:scale-105">{followerCount}</p>
              <p className="text-[11px] text-stone-400">Active beauty buyers</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold text-stone-300">Min Order Value</span>
              </div>
              <p className="text-lg font-extrabold text-white">{profile.minOrderValue}</p>
              <p className="text-[11px] text-stone-400">Flexible B2B Tiers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container & Interactive Tabbed Navigation */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-10 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#D9C3E8] mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-[#6B2D8C] text-[#6B2D8C] bg-[#F5EEF8]/40'
                : 'border-transparent text-[#5B4A6E] hover:text-[#2A0E3F] hover:bg-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>About &amp; Infrastructure</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-[#6B2D8C] text-[#6B2D8C] bg-[#F5EEF8]/40'
                : 'border-transparent text-[#5B4A6E] hover:text-[#2A0E3F] hover:bg-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Product Catalog ({sellerProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('oem')}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'oem'
                ? 'border-[#6B2D8C] text-[#6B2D8C] bg-[#F5EEF8]/40'
                : 'border-transparent text-[#5B4A6E] hover:text-[#2A0E3F] hover:bg-white'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>OEM &amp; Private Label</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-[#6B2D8C] text-[#6B2D8C] bg-[#F5EEF8]/40'
                : 'border-transparent text-[#5B4A6E] hover:text-[#2A0E3F] hover:bg-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Direct RFQ &amp; Contact</span>
          </button>
        </div>

        {/* TAB 1: ABOUT & INFRASTRUCTURE */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Story & Infrastructure Specs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Story Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#F5EEF8] shadow-xs">
                <h3 className="text-lg font-extrabold text-[#2A0E3F] mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#6B2D8C]" />
                  <span>Company Profile &amp; Legacy</span>
                </h3>
                <p className="text-sm text-[#5B4A6E] leading-relaxed mb-6">
                  {profile.aboutStory}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F5EEF8]">
                  <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#F5EEF8]">
                    <span className="text-xs font-semibold text-[#5B4A6E] block mb-1">Facility Footprint</span>
                    <span className="text-sm font-extrabold text-[#2A0E3F]">{profile.facilityArea}</span>
                  </div>
                  <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#F5EEF8]">
                    <span className="text-xs font-semibold text-[#5B4A6E] block mb-1">Cleanroom Grade</span>
                    <span className="text-sm font-extrabold text-[#2A0E3F]">{profile.cleanroomCapacity}</span>
                  </div>
                  <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#F5EEF8]">
                    <span className="text-xs font-semibold text-[#5B4A6E] block mb-1">Monthly Production Output</span>
                    <span className="text-sm font-extrabold text-[#2A0E3F]">{profile.monthlyProductionCapacity}</span>
                  </div>
                  <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#F5EEF8]">
                    <span className="text-xs font-semibold text-[#5B4A6E] block mb-1">Quality Control SLA</span>
                    <span className="text-sm font-extrabold text-[#2A0E3F]">100% Batch COA Included</span>
                  </div>
                </div>
              </div>

              {/* Compliance Vault / Certificates Gallery */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#F5EEF8] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-[#2A0E3F] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#6B2D8C]" />
                    <span>Verified Compliance &amp; Audit Certificates</span>
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    5 Active Verified Audit Records
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedCertForPreview(cert)}
                      className="group cursor-pointer bg-[#FDFBF7] hover:bg-[#F5EEF8]/30 p-4 rounded-xl border border-[#F5EEF8] hover:border-[#D9C3E8] transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-white border border-[#D9C3E8] text-[#6B2D8C] group-hover:bg-[#6B2D8C] group-hover:text-white transition-all">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-[#2A0E3F]">{cert}</p>
                          <p className="text-[11px] text-[#5B4A6E]">Audit Status: Verified &amp; Active</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-[#5B4A6E] group-hover:text-[#6B2D8C]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Location & Contact Direct Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#F5EEF8] shadow-xs">
                <h4 className="text-sm font-extrabold text-[#2A0E3F] uppercase tracking-wider mb-4 border-b border-[#F5EEF8] pb-2">
                  Headquarters &amp; Industrial Plant
                </h4>

                <div className="space-y-4 text-xs text-[#5B4A6E]">
                  <div>
                    <span className="font-bold text-[#2A0E3F] block mb-0.5">Full Plant Address:</span>
                    <p>{profile.fullAddress}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#2A0E3F] block mb-0.5">GST Registration (GSTIN):</span>
                    <p className="font-mono text-[#2A0E3F] bg-[#FDFBF7] p-1.5 rounded-md border border-[#F5EEF8] inline-block">
                      {profile.gstin}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-[#2A0E3F] block mb-0.5">Official B2B Email:</span>
                    <p className="text-[#6B2D8C] font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#2A0E3F] block mb-0.5">Company Website:</span>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6B2D8C] font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <span>{profile.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F5EEF8] space-y-2">
                  <button
                    onClick={() => onOpenEnquiryModal && onOpenEnquiryModal({ supplierName: profile.name })}
                    className="w-full py-2.5 rounded-lg bg-[#6B2D8C] text-white font-bold text-xs hover:bg-[#9e0055] transition-all shadow-sm"
                  >
                    Send Direct Supplier Enquiry
                  </button>
                  <button
                    onClick={() => onWhatsAppSupplier(profile.name)}
                    className="w-full py-2.5 rounded-lg bg-[#25D366] text-white font-bold text-xs hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT CATALOG (PLP) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Catalog Filter & Sort Bar */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#F5EEF8] shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B4A6E]" />
                  <input
                    type="text"
                    placeholder="Search products listed by this seller..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#FDFBF7] border border-[#D9C3E8] rounded-xl focus:outline-none focus:border-[#C9A961] text-[#2A0E3F] placeholder:text-[#B9A8C6]"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E6C96] hover:text-[#6B2D8C] cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right controls: Category Pills + Sort By Dropdown */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {categories.map((cat, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#6B2D8C] text-white shadow-xs'
                            : 'bg-[#FDFBF7] text-[#5B4A6E] border border-[#D9C3E8] hover:bg-[#F5EEF8]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#5B4A6E] whitespace-nowrap">
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#6B2D8C]" />
                      <span className="hidden sm:inline">Sort by:</span>
                    </div>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none bg-[#FDFBF7] hover:bg-white text-[#2A0E3F] text-xs font-semibold pl-3 pr-8 py-2 border border-[#D9C3E8] hover:border-[#6B2D8C] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A961]/25 focus:border-[#C9A961] transition-all cursor-pointer"
                      >
                        <option value="latest">Latest Arrivals</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="popularity">Popularity / Top Rated</option>
                        <option value="moq_asc">MOQ: Low to High</option>
                        <option value="name_asc">Name: A to Z</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5B4A6E] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Active Filter Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F5EEF8] text-xs text-[#5B4A6E]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#2A0E3F]">
                    Showing {filteredProducts.length} of {sellerProducts.length} Products
                  </span>
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5EEF8] text-[#6B2D8C] font-medium text-[11px]">
                      Category: {selectedCategory}
                      <button onClick={() => setSelectedCategory('All')} className="hover:text-[#2A0E3F] cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {productSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5EEF8] text-[#6B2D8C] font-medium text-[11px]">
                      Search: "{productSearch}"
                      <button onClick={() => setProductSearch('')} className="hover:text-[#2A0E3F] cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {sortBy !== 'latest' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-[#2A0E3F] font-medium text-[11px]">
                      Sorted: {
                        sortBy === 'price_asc' ? 'Price Low-High' :
                        sortBy === 'price_desc' ? 'Price High-Low' :
                        sortBy === 'popularity' ? 'Popularity' :
                        sortBy === 'moq_asc' ? 'MOQ Low-High' : 'A-Z'
                      }
                      <button onClick={() => setSortBy('latest')} className="hover:text-[#6B2D8C] cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                {(selectedCategory !== 'All' || productSearch || sortBy !== 'latest') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setProductSearch('');
                      setSortBy('latest');
                    }}
                    className="text-[#6B2D8C] hover:underline font-bold text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-[#F5EEF8] hover:border-[#D9C3E8] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Frame */}
                      <div
                        onClick={() => onNavigateToProductDetail && onNavigateToProductDetail(prod.id)}
                        className="relative aspect-4/3 bg-stone-100 cursor-pointer overflow-hidden group"
                      >
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-[#2A0E3F]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          MOQ: {prod.moq}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B2D8C] block mb-1">
                          {prod.category}
                        </span>
                        <h4
                          onClick={() => onNavigateToProductDetail && onNavigateToProductDetail(prod.id)}
                          className="text-sm font-extrabold text-[#2A0E3F] hover:text-[#6B2D8C] transition-colors cursor-pointer line-clamp-1 mb-1"
                        >
                          {prod.title}
                        </h4>
                        <p className="text-xs text-[#5B4A6E] line-clamp-2 mb-3">
                          {prod.description}
                        </p>

                        <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#F5EEF8] mb-3">
                          <span className="text-[10px] text-[#5B4A6E] block">Estimated Bulk Price</span>
                          <span className="text-sm font-extrabold text-[#6B2D8C]">{prod.priceRange}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenEnquiryModal && onOpenEnquiryModal(prod)}
                        className="py-2 rounded-lg bg-[#6B2D8C] hover:bg-[#9e0055] text-white text-xs font-bold transition-all"
                      >
                        Send Enquiry
                      </button>
                      <button
                        onClick={() => onNavigateToProductDetail && onNavigateToProductDetail(prod.id)}
                        className="py-2 rounded-lg bg-[#FDFBF7] hover:bg-[#F5EEF8] border border-[#D9C3E8] text-[#2A0E3F] text-xs font-bold transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#F5EEF8]">
                <p className="text-sm text-[#5B4A6E] mb-2">No products found matching your search filter.</p>
                <button
                  onClick={() => {
                    setProductSearch('');
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-bold text-[#6B2D8C] hover:underline"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OEM & PRIVATE LABEL */}
        {activeTab === 'oem' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#F5EEF8] shadow-xs">
                <h3 className="text-lg font-extrabold text-[#2A0E3F] mb-3 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-[#6B2D8C]" />
                  <span>Turn-Key Private Label &amp; OEM Contract Manufacturing</span>
                </h3>
                <p className="text-sm text-[#5B4A6E] leading-relaxed mb-6">
                  {profile.oemCapabilityOverview}
                </p>

                {/* Packaging Choices Grid */}
                <h4 className="text-xs font-extrabold uppercase text-[#2A0E3F] tracking-wider mb-3">
                  Available Packaging Containers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {profile.packagingOptions.map((opt, idx) => (
                    <div key={idx} className="bg-[#FDFBF7] p-3 rounded-xl border border-[#F5EEF8] flex items-center gap-2 text-xs font-semibold text-[#2A0E3F]">
                      <Check className="w-4 h-4 text-[#6B2D8C] shrink-0" />
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>

                {/* Formulation Types Grid */}
                <h4 className="text-xs font-extrabold uppercase text-[#2A0E3F] tracking-wider mb-3">
                  Benchmarked Base Formulations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {profile.formulationTypes.map((form, idx) => (
                    <div key={idx} className="bg-[#FDFBF7] p-3 rounded-xl border border-[#F5EEF8] flex items-center gap-2 text-xs font-semibold text-[#2A0E3F]">
                      <Sparkles className="w-4 h-4 text-[#6B2D8C] shrink-0" />
                      <span>{form}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* OEM Sample Box Request Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#F5EEF8] shadow-xs">
                <h4 className="text-sm font-extrabold text-[#2A0E3F] uppercase tracking-wider mb-2">
                  Order Evaluation Sample Kit
                </h4>
                <p className="text-xs text-[#5B4A6E] mb-4">
                  Test texture, viscosity, stability, and skin absorption prior to placing full commercial production run.
                </p>

                <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#F5EEF8] mb-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#5B4A6E]">Dispatch SLA:</span>
                    <span className="font-bold text-[#2A0E3F]">{profile.sampleLeadTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B4A6E]">Sample Price:</span>
                    <span className="font-bold text-[#6B2D8C]">{profile.samplePriceText}</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenEnquiryModal && onOpenEnquiryModal({ supplierName: profile.name, title: 'Sample Box Request' })}
                  className="w-full py-3 rounded-xl bg-[#6B2D8C] text-white font-bold text-xs hover:bg-[#9e0055] transition-all shadow-md"
                >
                  Order Lab Evaluation Kit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIRECT RFQ & CONTACT */}
        {activeTab === 'contact' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 border border-[#F5EEF8] shadow-xs">
            <h3 className="text-lg font-extrabold text-[#2A0E3F] mb-1">
              Send Requirement / Request Bulk Quote from {profile.name}
            </h3>
            <p className="text-xs text-[#5B4A6E] mb-6">
              Get direct response from the key technical account manager within {profile.responseSla}.
            </p>

            <form onSubmit={handleRfqSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2A0E3F] mb-1">
                  Product / Formulation Needed *
                </label>
                <input
                  type="text"
                  required
                  value={rfqProductName}
                  onChange={(e) => setRfqProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#D9C3E8] rounded-xl focus:outline-none focus:border-[#C9A961]"
                  placeholder="e.g. 20% Vitamin C Serum, Amber Glass Dropper Bottle..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1">
                    Target Volume / Quantity *
                  </label>
                  <input
                    type="text"
                    required
                    value={rfqQuantity}
                    onChange={(e) => setRfqQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#D9C3E8] rounded-xl focus:outline-none focus:border-[#C9A961]"
                    placeholder="e.g. 1,000 Units"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1">
                    Required Delivery Timeline
                  </label>
                  <select
                    value={rfqTimeline}
                    onChange={(e) => setRfqTimeline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#D9C3E8] rounded-xl focus:outline-none focus:border-[#C9A961]"
                  >
                    <option value="Immediate (Within 2 Weeks)">Immediate (Within 2 Weeks)</option>
                    <option value="3 to 4 Weeks">3 to 4 Weeks</option>
                    <option value="Flexible / Planning Phase">Flexible / Planning Phase</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A0E3F] mb-1">
                  Specific Specifications or Packaging Requirements
                </label>
                <textarea
                  rows={4}
                  value={rfqMessage}
                  onChange={(e) => setRfqMessage(e.target.value)}
                  placeholder="Describe your required active percentages, packaging type, delivery city, or target price point..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#D9C3E8] rounded-xl focus:outline-none focus:border-[#C9A961]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={rfqSubmitted}
                  className="w-full py-3 rounded-xl bg-[#6B2D8C] hover:bg-[#9e0055] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{rfqSubmitted ? 'RFQ Transmitted!' : 'Send RFQ Directly To Seller'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Certificate Lightbox Preview Modal */}
      {selectedCertForPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative border border-[#F5EEF8] shadow-2xl">
            <button
              onClick={() => setSelectedCertForPreview(null)}
              className="absolute top-4 right-4 text-[#5B4A6E] hover:text-[#2A0E3F] p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#F5EEF8] text-[#6B2D8C]">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#2A0E3F]">{selectedCertForPreview}</h4>
                <p className="text-xs text-emerald-600 font-semibold">Verified Active Certificate</p>
              </div>
            </div>
            <div className="bg-[#FDFBF7] p-6 rounded-xl border border-[#F5EEF8] text-center mb-4">
              <BadgeCheck className="w-12 h-12 text-[#6B2D8C] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#2A0E3F] mb-1">Document Verified on Blockchain Ledger</p>
              <p className="text-[11px] text-[#5B4A6E]">
                Issued for {profile.legalName} under accreditation record #{profile.gstin}.
              </p>
            </div>
            <button
              onClick={() => setSelectedCertForPreview(null)}
              className="w-full py-2.5 bg-[#2A0E3F] text-white font-bold text-xs rounded-xl hover:bg-black transition-all"
            >
              Close Document Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
