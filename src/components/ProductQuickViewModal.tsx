import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Award,
  FlaskConical,
  ArrowRight,
  Layers,
  Sparkles,
  ShoppingBag,
  FileText,
  Download,
  AlertCircle,
  Truck,
  ChevronRight,
  Send,
  ExternalLink,
  Plus,
  Minus
} from 'lucide-react';
import type { SearchProduct, ProductDetailData } from '../types';
import { db } from '../db/database';
import { downloadOrderInvoice, downloadOrderInvoiceCsv } from '../utils/invoicePdf';
import type { DBOrder } from '../db/types';

interface ProductQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SearchProduct | ProductDetailData | null;
  onOpenEnquiry?: (product: any) => void;
  onNavigateToProductDetail?: (productId: string) => void;
  onOrderPlaced?: (order: DBOrder) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  isOpen,
  onClose,
  product,
  onOpenEnquiry,
  onNavigateToProductDetail,
  onOrderPlaced
}) => {
  // Modal step: 'details' -> 'checkout' -> 'success'
  const [step, setStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Buy Now Form State
  const [quantity, setQuantity] = useState<number>(100);
  const [shippingAddress, setShippingAddress] = useState('Plot 42, Bandra West Business Enclave, Mumbai, MH 400050');
  const [orderNotes, setOrderNotes] = useState('Standard primary branding with COA batch certificate.');
  const [paymentPreference, setPaymentPreference] = useState<'advance_50' | 'gst_invoice' | 'net_30'>('advance_50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<DBOrder | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Reset state when a new product is selected
  useEffect(() => {
    if (product) {
      setStep('details');
      setSelectedImageIndex(0);
      setConfirmedOrder(null);
      setDownloadSuccess(false);

      // Parse MOQ
      const moqMatch = (product.moq || '').match(/[\d,]+/);
      const initialQty = moqMatch ? Math.max(1, parseInt(moqMatch[0].replace(/,/g, ''), 10)) : 100;
      setQuantity(initialQty);
    }
  }, [product?.id]);

  if (!isOpen || !product) return null;

  // Resolve Images
  const allImages = (product as any).images && (product as any).images.length > 0 
    ? (product as any).images 
    : [product.image];
  const activeImage = allImages[selectedImageIndex] || product.image;

  // Resolve Stock Availability
  const rawStock = (product as any).stockAvailability || 
    (product.id.includes('vitc') ? 'In-Stock' : product.id.includes('barrier') ? 'Low Stock' : 'In-Stock');
  
  const leadTimeText = (product as any).leadTimeText || (
    rawStock === 'In-Stock'
      ? 'Ready Batch (Dispatches in 24–48 Hours)'
      : rawStock === 'Low Stock'
      ? 'Limited Ready Stock (Dispatches in 1–2 Days)'
      : 'Fresh Custom Formulation (Lead Time: 5–7 Business Days)'
  );

  // Resolve Specifications
  const specs = (product as any).specs || {};
  const formulationBase = specs.formulationBase || 'Aqueous Non-Comedogenic Cosmeceutical Base';
  const packagingType = specs.packagingType || 'UV-Coated Glass Bottle with Pipette';
  const shelfLife = specs.shelfLife || '24 Months (GMP Certified)';
  const sampleLeadTime = specs.sampleLeadTime || '1–2 Days';
  const productionCapacity = specs.productionCapacity || '150,000 Units / Month';
  const certifications = specs.certifications || product.certifications || ['WHO-GMP', 'ISO 22716', 'GST Verified'];

  // Resolve Bulk Slabs
  const bulkTiers = (product as any).bulkTiers || [
    { quantityRange: '100 – 249 Units', unitPrice: `₹${product.priceMin || 380} / Unit` },
    { quantityRange: '250 – 499 Units', unitPrice: `₹${Math.round((product.priceMin || 380) * 0.92)} / Unit` },
    { quantityRange: '500+ Units', unitPrice: `₹${Math.round((product.priceMin || 380) * 0.85)} / Unit` }
  ];

  // Calculate Unit Price for the chosen Quantity
  const calculateEffectiveUnitPrice = (qty: number): number => {
    const basePrice = product.priceMin || 380;
    if (qty >= 500) return Math.round(basePrice * 0.85);
    if (qty >= 250) return Math.round(basePrice * 0.92);
    return basePrice;
  };

  const currentUnitPrice = calculateEffectiveUnitPrice(quantity);
  const subtotal = Math.round(currentUnitPrice * quantity);
  const gstAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;

  // Handle Buy Now Submission
  const handleConfirmOrder = () => {
    setIsSubmitting(true);

    try {
      const newOrder = db.createDirectOrder({
        productTitle: product.title,
        supplierName: product.supplierName,
        quantity,
        quantityUnit: 'Units',
        unitPrice: currentUnitPrice,
        shippingAddress,
        notes: `${orderNotes} | Payment Preference: ${paymentPreference}`,
      });

      setConfirmedOrder(newOrder);
      setStep('success');
      onOrderPlaced?.(newOrder);
    } catch (err) {
      console.error('Failed to create order from quick view:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!confirmedOrder) return;
    try {
      const populated = db.getOrderById(confirmedOrder.id);
      if (populated) {
        downloadOrderInvoice(populated);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('Invoice download error:', err);
    }
  };

  const handleDownloadCsv = () => {
    if (!confirmedOrder) return;
    try {
      const populated = db.getOrderById(confirmedOrder.id);
      if (populated) {
        downloadOrderInvoiceCsv(populated);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('CSV download error:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl border border-[#E8DEEF] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#E8DEEF] bg-[#FDFBF7] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B2D8C]"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B2D8C]">
              Quick Formulation Overview
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-[#5B4A6E]">
              {product.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#2A0E3F] hover:bg-[#F6F1FA] transition-colors"
            title="Close Quick View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          {step === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Gallery Column (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#F6F1FA] border border-[#E8DEEF] mb-3">
                  <img
                    src={activeImage}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Stock Availability Pill Over Image */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-sm ${
                      rawStock === 'In-Stock'
                        ? 'bg-emerald-600 text-white'
                        : rawStock === 'Low Stock'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#6B2D8C] text-white'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      {rawStock}
                    </span>
                  </div>

                  {product.isNexoraVerified && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-white/95 backdrop-blur-xs text-[#6B2D8C] px-2 py-0.5 rounded text-[10px] font-bold shadow-xs border border-[#E8DEEF] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 fill-[#6B2D8C] text-white" />
                        Verified Partner
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails if multiple images */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
                    {allImages.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                          selectedImageIndex === idx
                            ? 'border-[#6B2D8C] ring-2 ring-[#6B2D8C]/20'
                            : 'border-[#E8DEEF] hover:border-gray-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Supplier Capsule Card */}
                <div className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E8DEEF] space-y-2 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="w-4 h-4 text-[#6B2D8C] shrink-0" />
                      <span className="font-bold text-xs text-[#2A0E3F] truncate">
                        {product.supplierName}
                      </span>
                    </div>
                    {product.isGstVerified && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        GST Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#5B4A6E]">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      {product.supplierLocation}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-[#2A0E3F]">
                      <Clock className="w-3 h-3 text-[#6B2D8C]" />
                      {product.responseTime || '< 2 hrs response'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Details Column (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {/* Title & Price Header */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#2A0E3F] leading-snug tracking-tight">
                    {product.title}
                  </h2>
                  <p className="text-xs text-[#5B4A6E] mt-1.5 line-clamp-2">
                    {product.description || 'Premium salon-grade cosmetic formulation ready for immediate bulk procurement and custom private label packaging.'}
                  </p>
                </div>

                {/* Stock Availability High-Impact Banner */}
                <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  rawStock === 'In-Stock'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : rawStock === 'Low Stock'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-[#F5EEF8] border-[#D9C3E8] text-[#2A0E3F]'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      rawStock === 'In-Stock' ? 'bg-emerald-600 text-white' : 'bg-[#6B2D8C] text-white'
                    }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider">
                          Stock Status: {rawStock}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current/20">
                          Live Verified
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#5B4A6E] font-medium mt-0.5">
                        {leadTimeText}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Min. Order (MOQ)</span>
                    <span className="text-xs font-black text-[#2A0E3F]">{product.moq}</span>
                  </div>
                </div>

                {/* Key Specifications Bento Grid */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7E6C96] mb-2 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[#6B2D8C]" />
                    Key Technical Specifications
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E8DEEF]">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Formulation Base</span>
                      <span className="font-bold text-[#2A0E3F] line-clamp-1" title={formulationBase}>
                        {formulationBase}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E8DEEF]">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Packaging</span>
                      <span className="font-bold text-[#2A0E3F] line-clamp-1" title={packagingType}>
                        {packagingType}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E8DEEF]">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Shelf Life</span>
                      <span className="font-bold text-[#2A0E3F]">{shelfLife}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E8DEEF]">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Sample Lead Time</span>
                      <span className="font-bold text-[#2A0E3F]">{sampleLeadTime}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E8DEEF]">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Monthly Capacity</span>
                      <span className="font-bold text-[#2A0E3F]">{productionCapacity}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#E8DEEF]">
                      <span className="text-[10px] text-gray-400 block font-semibold uppercase">Certifications</span>
                      <span className="font-bold text-[#6B2D8C] line-clamp-1">
                        {certifications.slice(0, 2).join(' • ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bulk Price Tiers Table */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7E6C96] mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#6B2D8C]" />
                    Volume Bulk Pricing Slabs
                  </h3>
                  <div className="grid grid-cols-3 gap-2 bg-[#FDFBF7] p-2 rounded-xl border border-[#E8DEEF] text-center text-xs">
                    {bulkTiers.map((tier: any, i: number) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-[#E8DEEF]/80">
                        <span className="text-[10px] text-gray-500 font-bold block">{tier.quantityRange}</span>
                        <span className="font-black text-[#2A0E3F] text-[13px] text-[#6B2D8C] mt-0.5 block">
                          {tier.unitPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Action Buttons: Buy Now & Sourcing Options */}
                <div className="pt-2 space-y-2.5 mt-auto">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* The Prominent Buy Now Button */}
                    <button
                      type="button"
                      onClick={() => setStep('checkout')}
                      className="flex-1 bg-[#6B2D8C] hover:bg-[#4A2560] text-white py-3 px-5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Buy Now (Instant PO)</span>
                    </button>

                    {/* Send Enquiry Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenEnquiry?.(product);
                      }}
                      className="py-3 px-4 border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#F5EEF8] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Custom Enquiry</span>
                    </button>
                  </div>

                  {/* Secondary Link to Full Specs */}
                  <div className="flex items-center justify-between px-1 text-xs text-[#5B4A6E]">
                    <span className="flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Direct Supplier Invoice Guarantee
                    </span>
                    {onNavigateToProductDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToProductDetail(product.id);
                        }}
                        className="text-[#6B2D8C] hover:underline font-bold flex items-center gap-1"
                      >
                        <span>View Full Specifications &amp; COA</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Instant Buy Now Express Checkout Flow */}
          {step === 'checkout' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="flex items-center justify-between border-b border-[#E8DEEF] pb-4">
                <div>
                  <h3 className="text-xl font-black text-[#2A0E3F]">
                    Express Sourcing Purchase Order
                  </h3>
                  <p className="text-xs text-[#5B4A6E] mt-0.5">
                    Order directly from <strong className="text-[#2A0E3F]">{product.supplierName}</strong> without leaving the page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs font-bold text-[#6B2D8C] hover:underline"
                >
                  ← Back to Details
                </button>
              </div>

              {/* Order Item Preview */}
              <div className="flex gap-4 items-center bg-[#FDFBF7] p-3.5 rounded-xl border border-[#E8DEEF]">
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg border border-[#E8DEEF]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-[#2A0E3F] truncate">{product.title}</h4>
                  <p className="text-xs text-[#5B4A6E] mt-0.5">
                    Supplier: {product.supplierName} • {product.supplierLocation}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rawStock} • {leadTimeText}
                  </span>
                </div>
              </div>

              {/* Quantity Selector & Tier Calculation */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DEEF] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#2A0E3F] block">Procurement Quantity</label>
                    <span className="text-[11px] text-[#5B4A6E]">Minimum Order Quantity: {product.moq}</span>
                  </div>

                  <div className="flex items-center border border-[#D9C3E8] rounded-xl overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(50, q - 50))}
                      className="p-2 hover:bg-[#F5EEF8] text-[#6B2D8C] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 text-center text-sm font-black text-[#2A0E3F] py-1.5 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 50)}
                      className="p-2 hover:bg-[#F5EEF8] text-[#6B2D8C] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Calculation Summary Table */}
                <div className="border-t border-[#E8DEEF] pt-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-[#5B4A6E]">
                    <span>Calculated Tiered Rate:</span>
                    <span className="font-bold text-[#2A0E3F]">₹{currentUnitPrice} / Unit</span>
                  </div>
                  <div className="flex justify-between text-[#5B4A6E]">
                    <span>Subtotal ({quantity} Units):</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5B4A6E]">
                    <span>GST (18% Standard Sourcing Rate):</span>
                    <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#2A0E3F] pt-2 border-t border-[#E8DEEF]">
                    <span>Total Purchase Order Amount:</span>
                    <span className="text-[#6B2D8C]">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Notes */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#2A0E3F] block mb-1">
                    Delivery / Warehouse Address
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter dispatch destination..."
                    className="w-full text-xs p-3 rounded-xl border border-[#E8DEEF] focus:border-[#6B2D8C] focus:ring-1 focus:ring-[#6B2D8C] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A0E3F] block mb-1">
                    Procurement Notes / Batch COA Instructions
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="E.g. Include Certificate of Analysis (COA) with shipment..."
                    className="w-full text-xs p-3 rounded-xl border border-[#E8DEEF] focus:border-[#6B2D8C] focus:ring-1 focus:ring-[#6B2D8C] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A0E3F] block mb-1.5">
                    Payment &amp; Terms Selection
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentPreference === 'advance_50'
                        ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#2A0E3F] font-bold'
                        : 'border-[#E8DEEF] text-[#5B4A6E]'
                    }`}>
                      <input
                        type="radio"
                        name="paymentPref"
                        checked={paymentPreference === 'advance_50'}
                        onChange={() => setPaymentPreference('advance_50')}
                        className="sr-only"
                      />
                      <span>50% Advance RTGS</span>
                      <span className="block text-[10px] font-normal text-gray-500">Balance on dispatch</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentPreference === 'gst_invoice'
                        ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#2A0E3F] font-bold'
                        : 'border-[#E8DEEF] text-[#5B4A6E]'
                    }`}>
                      <input
                        type="radio"
                        name="paymentPref"
                        checked={paymentPreference === 'gst_invoice'}
                        onChange={() => setPaymentPreference('gst_invoice')}
                        className="sr-only"
                      />
                      <span>GST Tax Invoice</span>
                      <span className="block text-[10px] font-normal text-gray-500">100% against delivery</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      paymentPreference === 'net_30'
                        ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#2A0E3F] font-bold'
                        : 'border-[#E8DEEF] text-[#5B4A6E]'
                    }`}>
                      <input
                        type="radio"
                        name="paymentPref"
                        checked={paymentPreference === 'net_30'}
                        onChange={() => setPaymentPreference('net_30')}
                        className="sr-only"
                      />
                      <span>Net-30 B2B Credit</span>
                      <span className="block text-[10px] font-normal text-gray-500">Subject to GST verification</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Confirm PO Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || quantity < 1}
                  className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] text-white py-3.5 px-6 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Generating Purchase Order...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Place Purchase Order (₹{totalAmount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Placed Success View (Never leaving the page) */}
          {step === 'success' && confirmedOrder && (
            <div className="py-6 px-4 text-center max-w-lg mx-auto space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#2A0E3F]">
                  Purchase Order Confirmed!
                </h3>
                <p className="text-xs text-[#5B4A6E] mt-1">
                  Your direct order has been logged into the Nexora Luxe relational database and dispatched to the supplier.
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="p-4 rounded-xl bg-[#FDFBF7] border border-[#E8DEEF] text-left text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8DEEF]">
                  <span className="text-gray-500 font-semibold">Order Reference No:</span>
                  <span className="font-mono font-black text-[#6B2D8C] text-sm">
                    {confirmedOrder.order_no}
                  </span>
                </div>
                <div className="flex justify-between text-[#5B4A6E]">
                  <span>Product:</span>
                  <span className="font-bold text-[#2A0E3F]">{product.title}</span>
                </div>
                <div className="flex justify-between text-[#5B4A6E]">
                  <span>Supplier:</span>
                  <span className="font-bold text-[#2A0E3F]">{product.supplierName}</span>
                </div>
                <div className="flex justify-between text-[#5B4A6E]">
                  <span>Total Amount (incl. 18% GST):</span>
                  <span className="font-black text-[#6B2D8C]">₹{confirmedOrder.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#5B4A6E]">
                  <span>Dispatch SLA:</span>
                  <span className="text-emerald-700 font-bold">{leadTimeText}</span>
                </div>
              </div>

              {/* Invoice Download Action Row */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="flex-1 bg-white border border-[#6B2D8C] text-[#6B2D8C] hover:bg-[#F5EEF8] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download GST Invoice PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </div>

              {downloadSuccess && (
                <p className="text-xs text-emerald-600 font-bold animate-in fade-in">
                  Tax invoice generated and downloaded to your device!
                </p>
              )}

              {/* Continue Sourcing Button (stays on page) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Done • Continue Sourcing Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
