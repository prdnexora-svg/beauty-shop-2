import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Send,
  Phone,
  MessageCircle,
  FileText,
  Clock,
  Package,
  CheckCircle2,
  Award,
  Factory,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Layers,
  FlaskConical,
  Truck,
  HelpCircle,
  IndianRupee,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { ProductDetailData } from '../types';
import { SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { VerifiedBadge } from './VerifiedBadge';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  onOpenEnquiryModal: (item: { name: string; supplierName: string }) => void;
  onOpenRFQModal: () => void;
  onNavigateToSampleRequest?: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
  onNavigateToProduct?: (productId: string) => void;
  onCallSupplier: (name: string, phone: string) => void;
  onWhatsAppSupplier: (name: string, whatsapp: string) => void;
  onOpenChat?: (
    supplier: { id: string; name: string; location: string; isVerified: boolean },
    product: { title: string; image: string; price?: string; moq?: string }
  ) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  onOpenEnquiryModal,
  onOpenRFQModal,
  onNavigateToSampleRequest,
  onNavigateToSupplierProfile,
  onNavigateToProduct,
  onCallSupplier,
  onWhatsAppSupplier,
  onOpenChat,
}) => {
  // Retrieve product details from DB
  const product: ProductDetailData | undefined = SPONSORED_PRODUCTS_DB[productId];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'priceTrend' | 'formulation' | 'packaging' | 'compliance'>('specs');

  // 6-Month Price Trend dataset generated for professional B2B sourcing decisions
  const priceHistoryData = React.useMemo(() => {
    if (!product) return [];
    const numbers = product.priceRange.match(/\d[\d,.]*/g);
    let basePrice = 1200;
    if (numbers && numbers.length > 0) {
      const parsed = parseFloat(numbers[0].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) basePrice = parsed;
    }

    const months = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'];
    const trendMultipliers = [1.12, 1.09, 1.06, 1.03, 1.01, 1.0];

    return months.map((month, idx) => {
      const unitPrice = Math.round(basePrice * trendMultipliers[idx]);
      const bulkPrice = Math.round(unitPrice * 0.88);
      return {
        month,
        unitPrice,
        bulkPrice,
        formattedUnit: `₹${unitPrice.toLocaleString('en-IN')}`,
        formattedBulk: `₹${bulkPrice.toLocaleString('en-IN')}`,
      };
    });
  }, [product?.priceRange]);

  // Lightbox Zoom state for high-resolution cosmetic texture inspection
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoomLevel, setLightboxZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Keyboard shortcut handlers for Lightbox (Esc, Left/Right arrows)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft' && product?.images?.length) {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
        setLightboxZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight' && product?.images?.length) {
        setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
        setLightboxZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, product?.images?.length]);

  // Related products: same category first, then remaining catalog (max 4)
  const relatedProducts = React.useMemo(() => {
    if (!product) return [];
    const all = Object.values(SPONSORED_PRODUCTS_DB).filter((p) => p.id !== product.id);
    const sameCategory = all.filter((p) => p.category === product.category);
    const rest = all.filter((p) => p.category !== product.category);
    return [...sameCategory, ...rest].slice(0, 4);
  }, [product?.id]);

  // Fallback state if product ID is invalid or removed
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#2A0E3F]">Product Listing Unavailable</h2>
        <p className="text-sm text-[#5B4A6E] mt-2 max-w-md mx-auto">
          The requested product ID <code className="bg-gray-100 px-2 py-0.5 rounded text-red-600 font-mono text-xs">{productId}</code> is no longer active, unpublished, or has been updated by the seller.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#6B2D8C] text-white font-bold text-sm hover:bg-[#4A2560] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-[#E8DEEF] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#5B4A6E]">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[#6B2D8C] font-bold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="hover:text-black cursor-pointer" onClick={onBack}>Explore</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#2A0E3F] font-medium truncate max-w-[200px] sm:max-w-none">
              {product.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
            <span className="text-gray-400 font-normal truncate max-w-[150px] hidden sm:inline">
              {product.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-md">
              ID: {product.id}
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-[#F5EEF8] border border-[#E8D5F2] text-[#6B2D8C] rounded-md">
              SELLER: {product.seller_id}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Main Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#E8DEEF] rounded-2xl overflow-hidden p-3 relative group">
              <div
                className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative cursor-zoom-in"
                onClick={() => {
                  setIsLightboxOpen(true);
                  setLightboxZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
              >
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#6B2D8C] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Sponsored Listing
                </span>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-3.5 py-2 rounded-xl bg-white/95 text-[#2A0E3F] text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-all">
                    <Maximize2 className="w-4 h-4 text-[#6B2D8C]" />
                    Click for High-Res Texture Zoom
                  </span>
                </div>
              </div>

              {/* Quick action bar beneath main image */}
              <div className="mt-2.5 flex items-center justify-between px-1 pt-1 border-t border-gray-100">
                <span className="text-[11px] text-[#5B4A6E] font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A961]" />
                  Cosmetic formulation texture view
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(true);
                    setLightboxZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className="text-xs font-bold text-[#6B2D8C] hover:text-[#4A2560] flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-[#F5EEF8] transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  Inspect Texture (Zoom)
                </button>
              </div>
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#6B2D8C] shadow-sm scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Supplier Card Summary */}
            <div className="bg-white border border-[#E8DEEF] rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase font-bold text-[#6B2D8C] tracking-wider">
                    Official Supplier
                  </p>
                  <h3 className="text-base font-extrabold text-[#2A0E3F]">
                    {product.supplierName}
                  </h3>
                  <p className="text-xs text-[#5B4A6E] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6B2D8C]" />
                    {product.supplierLocation}
                  </p>
                </div>
                <VerifiedBadge />
              </div>

              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Trust Score</span>
                  <span className="font-extrabold text-[#2A0E3F]">
                    {product.sellerDetails.trustScore}/100 Verified
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Response Time</span>
                  <span className="font-extrabold text-[#2A0E3F]">
                    {product.sellerDetails.responseRate}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToSupplierProfile?.(product.seller_id)}
                className="w-full py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-[#2A0E3F] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-[#6B2D8C]" />
                View Full Supplier Business Profile
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Right Column: B2B Buying & Specification Overview (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#E8DEEF] rounded-2xl p-6 md:p-8 space-y-6">
              {/* Product Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5EEF8] border border-[#E8D5F2] text-[#6B2D8C] text-xs font-bold">
                    {product.category}
                  </span>
                  {product.subcategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium">
                      {product.subcategory}
                    </span>
                  )}
                  {product.isGstVerified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> GST Verified
                    </span>
                  )}
                  {product.isIsoCertified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-1">
                      <Award className="w-3 h-3" /> ISO Certified
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-black text-[#2A0E3F] leading-tight">
                  {product.title}
                </h1>

                {/* Stock Availability Badge & Lead Time Indicator */}
                {(() => {
                  const availability = product.stockAvailability || (
                    product.id.includes('vitc') ? 'In-Stock' :
                    product.id.includes('barrier') ? 'Low Stock' :
                    'Made-to-Order'
                  );

                  const leadTime = product.leadTimeText || (
                    availability === 'In-Stock'
                      ? 'Ready Batch (Dispatches in 24–48 Hours)'
                      : availability === 'Low Stock'
                      ? 'Limited Ready Stock (Dispatches in 1–2 Days)'
                      : 'Fresh Custom Batch (Lead Time: 5–7 Business Days)'
                  );

                  const badgeConfig = {
                    'In-Stock': {
                      bg: 'bg-emerald-50 text-emerald-950 border-emerald-300/80',
                      dotColor: 'bg-emerald-500',
                      icon: Package,
                      statusLabel: 'In-Stock',
                      subtext: leadTime,
                      tagBg: 'bg-emerald-600 text-white',
                    },
                    'Low Stock': {
                      bg: 'bg-amber-50 text-amber-950 border-amber-300/80',
                      dotColor: 'bg-amber-500',
                      icon: Clock,
                      statusLabel: 'Low Stock',
                      subtext: leadTime,
                      tagBg: 'bg-amber-600 text-white',
                    },
                    'Made-to-Order': {
                      bg: 'bg-purple-50 text-purple-950 border-purple-300/80',
                      dotColor: 'bg-[#6B2D8C]',
                      icon: Factory,
                      statusLabel: 'Made-to-Order',
                      subtext: leadTime,
                      tagBg: 'bg-[#6B2D8C] text-white',
                    },
                  }[availability];

                  const IconComp = badgeConfig.icon;

                  return (
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs ${badgeConfig.bg}`}>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badgeConfig.dotColor}`} />
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${badgeConfig.dotColor}`} />
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wider ${badgeConfig.tagBg}`}>
                          {badgeConfig.statusLabel}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold">
                          <IconComp className="w-3.5 h-3.5 opacity-80" />
                          {badgeConfig.subtext}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#5B4A6E] font-medium flex items-center gap-1 bg-gray-50/80 px-2.5 py-1 rounded-lg border border-gray-200/60">
                        <Truck className="w-3.5 h-3.5 text-[#6B2D8C]" />
                        Sample Lead: {product.specs.sampleLeadTime || '1-2 Days'}
                      </span>
                    </div>
                  );
                })()}

                <p className="text-sm text-[#5B4A6E] mt-3 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* B2B Price & Tier Block */}
              <div className="p-4 bg-[#FDFBF7] border border-[#E8D5F2]/60 rounded-xl space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-[#5B4A6E]">Wholesale B2B Price</span>
                    <p className="text-2xl font-black text-[#6B2D8C]">
                      {product.priceRange}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-[#5B4A6E]">Min. Order Quantity (MOQ)</span>
                    <p className="text-base font-extrabold text-[#2A0E3F]">
                      {product.moq}
                    </p>
                  </div>
                </div>

                {/* Price Trend Summary Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E8D5F2]/60 text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Price -10.7% lower vs 6-month peak
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('priceTrend')}
                    className="text-[11px] font-bold text-[#6B2D8C] hover:text-[#4A2560] flex items-center gap-1 transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    View Price Trend Chart
                  </button>
                </div>

                {/* Bulk Tiers Table */}
                {product.bulkTiers.length > 0 && (
                  <div className="pt-3 border-t border-[#E8D5F2]/60">
                    <span className="text-[11px] font-bold text-[#2A0E3F] uppercase tracking-wider block mb-2">
                      Volume Discount Tiers
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {product.bulkTiers.map((tier, idx) => (
                        <div key={idx} className="bg-white border border-[#E8DEEF] p-2.5 rounded-lg text-center">
                          <span className="text-[10px] text-gray-500 block">{tier.quantityRange}</span>
                          <span className="text-xs font-extrabold text-[#6B2D8C]">{tier.unitPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversion CTAs */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => onOpenEnquiryModal({ name: product.title, supplierName: product.supplierName })}
                    className="w-full py-3.5 px-3 rounded-xl bg-[#6B2D8C] text-white font-extrabold text-xs sm:text-sm hover:bg-[#4A2560] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <IndianRupee className="w-4 h-4" />
                    Get Best Price
                  </button>

                  <button
                    onClick={() => onOpenEnquiryModal({ name: product.title, supplierName: product.supplierName })}
                    className="w-full py-3.5 px-3 rounded-xl bg-white border-2 border-[#6B2D8C] text-[#6B2D8C] font-extrabold text-xs sm:text-sm hover:bg-[#F5EEF8] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Enquiry
                  </button>

                  <button
                    onClick={() => {
                      onOpenChat?.(
                        {
                          id: product.seller_id || 'sup-1',
                          name: product.supplierName,
                          location: product.supplierLocation || 'Mumbai, MH',
                          isVerified: true
                        },
                        {
                          title: product.title,
                          image: product.images[0],
                          price: product.priceRange,
                          moq: product.moq
                        }
                      );
                    }}
                    className="w-full py-3.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    Live Chat
                  </button>

                  <button
                    onClick={onOpenRFQModal}
                    className="w-full py-3.5 px-3 rounded-xl bg-white border-2 border-[#6B2D8C] text-[#6B2D8C] font-extrabold text-xs sm:text-sm hover:bg-[#F5EEF8] transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Get Quote
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {onNavigateToSampleRequest && (
                    <button
                      onClick={onNavigateToSampleRequest}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2A0E3F] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-[#6B2D8C]" />
                      Order Lab Sample
                    </button>
                  )}

                  <button
                    onClick={() => onCallSupplier(product.supplierName, product.sellerDetails.phone)}
                    className="py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-purple-700" />
                    Call Supplier
                  </button>

                  <button
                    onClick={() => onWhatsAppSupplier(product.supplierName, product.sellerDetails.whatsapp)}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Specs & Information Tabs */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('specs')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'specs'
                        ? 'border-[#6B2D8C] text-[#6B2D8C]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Technical Specifications
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('priceTrend')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'priceTrend'
                        ? 'border-[#6B2D8C] text-[#6B2D8C]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    6-Month Price Trend
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('formulation')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'formulation'
                        ? 'border-[#6B2D8C] text-[#6B2D8C]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Formulation Base
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('packaging')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'packaging'
                        ? 'border-[#6B2D8C] text-[#6B2D8C]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Packaging & Private Label
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('compliance')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'compliance'
                        ? 'border-[#6B2D8C] text-[#6B2D8C]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Certifications & Compliance
                  </button>
                </div>

                <div className="text-xs space-y-3 pt-2">
                  {activeTab === 'priceTrend' && (
                    <div className="p-4 bg-gray-50/80 rounded-xl space-y-4 border border-[#E8DEEF]">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                        <div>
                          <h4 className="font-extrabold text-[#2A0E3F] text-sm flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4 text-[#6B2D8C]" />
                            6-Month B2B Wholesale Sourcing Index
                          </h4>
                          <p className="text-[11px] text-[#5B4A6E]">
                            Tracked unit pricing movement (INR) for cosmetic batch orders across Q2–Q3 2026
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> -10.7% Trend
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-[#6B2D8C] font-extrabold text-[10px]">
                            High Stability
                          </span>
                        </div>
                      </div>

                      {/* Stat Metrics Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-semibold block">Current Base Rate</span>
                          <span className="text-xs font-black text-[#6B2D8C]">
                            {priceHistoryData[priceHistoryData.length - 1]?.formattedUnit || '—'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-semibold block">6-Month High</span>
                          <span className="text-xs font-extrabold text-gray-800">
                            {priceHistoryData[0]?.formattedUnit || '—'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-semibold block">6-Month Low</span>
                          <span className="text-xs font-extrabold text-emerald-700">
                            {priceHistoryData[priceHistoryData.length - 1]?.formattedUnit || '—'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-semibold block">Bulk Tier (Est.)</span>
                          <span className="text-xs font-black text-[#0050D6]">
                            {priceHistoryData[priceHistoryData.length - 1]?.formattedBulk || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Recharts Area Chart */}
                      <div className="w-full h-[220px] bg-white p-3 rounded-xl border border-gray-200 shadow-inner pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={priceHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6B2D8C" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#6B2D8C" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="bulkGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0050D6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#0050D6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0E8F5" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5B4A6E' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#5B4A6E' }} axisLine={false} tickLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-[#2A0E3F] text-white p-2.5 rounded-xl shadow-xl border border-purple-300/20 text-xs space-y-1">
                                      <p className="font-bold text-[#C9A961] border-b border-purple-300/20 pb-1">{label} Sourcing Rate</p>
                                      <p className="font-semibold flex items-center justify-between gap-3 text-white">
                                        <span>Base Price:</span>
                                        <span className="text-purple-200 font-extrabold">₹{payload[0]?.value?.toLocaleString('en-IN')}</span>
                                      </p>
                                      {payload[1] && (
                                        <p className="font-semibold flex items-center justify-between gap-3 text-blue-200">
                                          <span>Bulk Tier:</span>
                                          <span className="font-extrabold">₹{payload[1]?.value?.toLocaleString('en-IN')}</span>
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="unitPrice"
                              name="Base Unit Price"
                              stroke="#6B2D8C"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#priceGradient)"
                            />
                            <Area
                              type="monotone"
                              dataKey="bulkPrice"
                              name="Bulk Tier Rate"
                              stroke="#0050D6"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              fillOpacity={1}
                              fill="url(#bulkGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 font-bold text-[#6B2D8C]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#6B2D8C]" /> Base Unit Price
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-[#0050D6]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0050D6]" /> Bulk Discount Rate
                          </span>
                        </div>
                        <span className="italic">Updated September 2026</span>
                      </div>
                    </div>
                  )}
                  {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Monthly Production Capacity</span>
                        <span className="font-extrabold text-[#2A0E3F]">{product.specs.productionCapacity || '100,000 Units'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Sample Lead Time</span>
                        <span className="font-extrabold text-[#2A0E3F]">{product.specs.sampleLeadTime || '1 - 3 Days'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Shelf Life</span>
                        <span className="font-extrabold text-[#2A0E3F]">{product.specs.shelfLife || '24 Months'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Facility Area</span>
                        <span className="font-extrabold text-[#2A0E3F]">{product.sellerDetails.facilityArea}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'formulation' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[#6B2D8C] font-bold">
                        <FlaskConical className="w-4 h-4" />
                        Active Ingredients & Base
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {product.specs.formulationBase || 'Standard OEM cosmeceutical grade formulation.'}
                      </p>
                    </div>
                  )}

                  {activeTab === 'packaging' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[#6B2D8C] font-bold">
                        <Package className="w-4 h-4" />
                        Packaging Options & Custom Branding
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {product.specs.packagingType || 'Standard bulk containers. Custom silk-screen printing and labeling available.'}
                      </p>
                    </div>
                  )}

                  {activeTab === 'compliance' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        Quality & Regulatory Standards
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {product.specs.certifications?.map((cert, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md font-semibold text-gray-800">
                            ✓ {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products — same-category sponsored listings */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold text-[#6B2D8C] tracking-wider">You may also source</p>
                <h2 className="text-lg md:text-xl font-black text-[#2A0E3F]">Related Products</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <div key={rel.id} className="bg-white border border-[#E8DEEF] rounded-2xl overflow-hidden group hover:shadow-md transition-all flex flex-col">
                  <button
                    onClick={() => onNavigateToProduct?.(rel.id)}
                    className="aspect-square bg-gray-50 overflow-hidden cursor-pointer"
                    aria-label={`View ${rel.title}`}
                  >
                    <img
                      src={rel.images[0]}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </button>
                  <div className="p-4 space-y-2 flex-1 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#7E6C96] tracking-wider">{rel.category}</span>
                    <h3 className="text-sm font-extrabold text-[#2A0E3F] leading-snug line-clamp-2">{rel.title}</h3>
                    <div className="flex items-baseline justify-between text-xs mt-auto pt-2">
                      <span className="font-black text-[#6B2D8C]">{rel.priceRange}</span>
                      <span className="text-[#5B4A6E] font-semibold">MOQ: {rel.moq}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => onNavigateToProduct?.(rel.id)}
                        className="flex-1 py-2 rounded-xl bg-white border border-[#6B2D8C] text-[#6B2D8C] font-bold text-xs hover:bg-[#F5EEF8] transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onOpenEnquiryModal({ name: rel.title, supplierName: rel.supplierName })}
                        className="flex-1 py-2 rounded-xl bg-[#6B2D8C] text-white font-bold text-xs hover:bg-[#4A2560] transition-colors"
                      >
                        Get Best Price
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for High-Resolution Cosmetic Texture Inspection */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => {
            setIsLightboxOpen(false);
            setLightboxZoomLevel(1);
            setPanPosition({ x: 0, y: 0 });
          }}
        >
          {/* Top Control Bar */}
          <div
            className="flex items-center justify-between text-white z-10 bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#6B2D8C] flex items-center justify-center text-white font-black text-xs shadow-md border border-purple-300/30">
                {activeImageIndex + 1}/{product.images.length}
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white truncate max-w-[200px] sm:max-w-md">
                  {product.title}
                </h3>
                <p className="text-[11px] text-purple-200 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#C9A961]" />
                  High-Resolution Cosmetic Texture Inspection
                </p>
              </div>
            </div>

            {/* Zoom Controls & Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLightboxZoomLevel((prev) => {
                    const next = Math.max(1, prev - 0.5);
                    if (next === 1) setPanPosition({ x: 0, y: 0 });
                    return next;
                  });
                }}
                disabled={lightboxZoomLevel <= 1}
                aria-label="Zoom Out"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-white/10 text-purple-200 min-w-[50px] text-center">
                {Math.round(lightboxZoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={() => {
                  setLightboxZoomLevel((prev) => Math.min(3, prev + 0.5));
                }}
                disabled={lightboxZoomLevel >= 3}
                aria-label="Zoom In"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLightboxZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                aria-label="Reset Zoom"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                aria-label="Close Lightbox Zoom"
                className="p-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-hidden my-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              if (lightboxZoomLevel > 1) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && lightboxZoomLevel > 1) {
                setPanPosition({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            {/* Previous Image Button */}
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
                  setLightboxZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                aria-label="Previous Image"
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-[#6B2D8C] text-white transition-colors border border-white/20 shadow-xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Image Button */}
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
                  setLightboxZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                aria-label="Next Image"
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-[#6B2D8C] text-white transition-colors border border-white/20 shadow-xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* High-Res Image with smooth zoom / pan transforms */}
            <div
              className="max-w-full max-h-[80vh] flex items-center justify-center"
              style={{
                cursor: lightboxZoomLevel === 1 ? 'zoom-in' : isDragging ? 'grabbing' : 'grab',
              }}
              onClick={() => {
                if (lightboxZoomLevel === 1) {
                  setLightboxZoomLevel(2);
                } else {
                  setLightboxZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }
              }}
            >
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${lightboxZoomLevel}) translate(${panPosition.x / lightboxZoomLevel}px, ${panPosition.y / lightboxZoomLevel}px)`,
                }}
              />
            </div>
          </div>

          {/* Bottom Thumbnail Strip & Texture Hint */}
          <div
            className="z-10 bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <Maximize2 className="w-4 h-4 text-[#C9A961]" />
              <span>
                {lightboxZoomLevel > 1
                  ? 'Drag mouse to pan high-res texture details. Click image to reset zoom.'
                  : 'Click image to toggle 200% texture zoom level, or use controls above.'}
              </span>
            </div>

            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setLightboxZoomLevel(1);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    aria-label={`View texture image ${idx + 1}`}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#C9A961] scale-105 shadow-lg'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
