import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Send,
  ShieldCheck,
  Phone,
  MessageSquare,
  Sparkles,
  Building2,
  Clock,
  Check,
  Copy,
  ArrowRight,
  Package,
  Star,
  CheckCircle,
  User,
  Layers,
  UploadCloud,
  FileText,
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: any | null;
  onCallSupplier?: (supplierName: string) => void;
  onWhatsAppSupplier?: (supplierName: string) => void;
  onNavigateToDashboard?: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  onCallSupplier,
  onWhatsAppSupplier,
  onNavigateToDashboard
}) => {
  // Form Fields
  const [buyerName, setBuyerName] = useState('Jane Doe');
  const [company, setCompany] = useState('Luxe Beauty Clinics & Spas');
  const [mobile, setMobile] = useState('9876543210');
  const [email, setEmail] = useState('procurement@luxebeauty.in');
  const [gstin, setGstin] = useState('27AABCL1234F1Z5');

  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('Units');
  const [targetBudget, setTargetBudget] = useState('380');
  const [orderType, setOrderType] = useState('bulk');
  const [pincode, setPincode] = useState('400001');
  const [city, setCity] = useState('Mumbai');
  const [intent, setIntent] = useState<'price' | 'bulk' | 'sample' | 'label'>('price');
  const [urgency, setUrgency] = useState('immediate');
  const [description, setDescription] = useState(
    'Please provide your best quotation for commercial bulk supply. Kindly include details on formulation certifications, batch COA, shipping timeline, and payment terms.'
  );

  const [multiBroadcast, setMultiBroadcast] = useState(true);
  const [contactPref, setContactPref] = useState<'nexora' | 'whatsapp' | 'call' | 'email'>('nexora');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [copiedRef, setCopiedRef] = useState(false);
  const [referenceId] = useState(() => `#NX-${Math.floor(1000 + Math.random() * 9000)}`);

  // Reset or initialize state when opening
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setIsSubmitting(false);
      setFormErrors({});
      if (targetItem?.moq) {
        const numericMoq = parseInt(targetItem.moq.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numericMoq) && numericMoq > 0) {
          setQuantity(String(numericMoq));
        }
      }
    }
  }, [isOpen, targetItem]);

  if (!isOpen || !targetItem) return null;

  // Normalized product & supplier details
  const productName =
    targetItem.title ||
    targetItem.name ||
    'Professional Argan Repair Hair Serum';

  const categoryName = targetItem.category || 'Haircare';

  const productImage =
    targetItem.image ||
    'https://images.unsplash.com/photo-1608248597359-52e1eb704179?auto=format&fit=crop&q=80&w=800';

  const supplierName =
    targetItem.supplierName ||
    (targetItem.type ? targetItem.name : 'Aura Beauty Labs');

  const supplierCity = targetItem.city || 'Mumbai';
  const supplierState = targetItem.state ? `, ${targetItem.state}` : ', MH';
  const supplierType = targetItem.type || 'Manufacturer';

  const priceDisplay =
    targetItem.priceRange ||
    (targetItem.price ? `₹${targetItem.price} / unit` : '₹350 – ₹450 / unit');

  const moqDisplay = targetItem.moq || '50 Units';

  const handleValidateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!buyerName.trim()) errors.buyerName = 'Buyer name is required';
    if (!mobile.trim() || mobile.trim().length < 10) errors.mobile = 'Enter a valid 10-digit mobile number';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid business email is required';
    if (!quantity.trim() || parseInt(quantity, 10) <= 0) errors.quantity = 'Specify required quantity';
    if (!pincode.trim()) errors.pincode = 'Pincode is required';
    if (!city.trim()) errors.city = 'Delivery city is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0].name);
    }
  };

  return (
    <div
      id="modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        id="enquiry-modal"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#fcf9f8] rounded-2xl border border-[#e8e8e8] w-full max-w-[1020px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-[#e8e8e8] flex justify-between items-center bg-white/80 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1c1b1b]">Send Product Enquiry</h2>
            <p className="text-[13px] text-[#594047] mt-0.5">
              Share your business requirement directly with the supplier for a quick response.
            </p>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-[#f7f2f2] flex items-center justify-center transition-colors text-[#594047] hover:text-[#1c1b1b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Body: Split Layout (Left: Context, Right: Form / Success) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative min-h-0 bg-[#f7f2f2]">
          
          {/* Left Panel: Context (Product & Supplier) */}
          <aside className="w-full md:w-[36%] bg-white/95 border-r border-[#e8e8e8] p-5 sm:p-6 overflow-y-auto space-y-5 shrink-0">
            
            {/* Product Context Card */}
            <div className="group bg-[#fcf9f8] p-4 rounded-xl border border-[#e8e8e8] transition-all hover:border-[#e0bec6] hover:shadow-xs">
              <div className="aspect-4/3 rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f7f2f2] mb-3 relative">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1608248597359-52e1eb704179?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {categoryName}
                </span>
              </div>

              <h3 className="font-bold text-[15px] text-[#1c1b1b] leading-snug mb-1">
                {productName}
              </h3>
              <p className="text-[12px] text-[#594047] mb-3">
                Category: <strong className="text-[#1c1b1b]">{categoryName}</strong>
              </p>

              <div className="space-y-2 text-[12.5px] border-t border-[#e8e8e8] pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#8c7077]">Price Range</span>
                  <span className="font-bold text-[#1c1b1b]">{priceDisplay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8c7077]">MOQ</span>
                  <span className="font-bold text-[#1c1b1b]">{moqDisplay}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#f0edec]">
                  <span className="text-[#8c7077]">Availability</span>
                  <span className="text-[#b90064] font-bold flex items-center gap-1 text-[11.5px]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#b90064]" />
                    Ready Bulk Supply
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Context Card */}
            <div className="bg-[#fcf9f8] p-4 rounded-xl border border-[#e8e8e8] group hover:border-[#e0bec6] hover:shadow-xs transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#b90064] text-white flex-shrink-0 flex items-center justify-center font-bold text-base shadow-xs">
                  {supplierName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[14px] text-[#1c1b1b] truncate flex items-center gap-1.5">
                    <span>{supplierName}</span>
                    <ShieldCheck className="w-4 h-4 text-[#b90064] shrink-0" />
                  </h4>
                  <p className="text-[11.5px] text-[#594047] truncate">
                    {supplierType} • {supplierCity}{supplierState}
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#fde7f3] text-[#b90064] text-[10.5px] font-bold rounded-full border border-[#e0bec6]">
                  <ShieldCheck className="w-3 h-3" /> Nexora Verified
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-[#f0edec] text-[#594047] text-[10.5px] font-semibold rounded-full">
                  GST Registered
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-[#f0edec] text-[#594047] text-[10.5px] font-semibold rounded-full">
                  ISO 9001
                </span>
              </div>

              {/* Rating & Response Metrics */}
              <div className="flex items-center justify-between text-[11.5px] text-[#594047] pt-2.5 border-t border-[#e8e8e8]">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[#1c1b1b] font-bold">4.8</span>
                  <span className="text-[#8c7077]">(124)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0050d6]" />
                  <span>Response: <strong>&lt; 1 hr</strong></span>
                </div>
              </div>
            </div>

            {/* Sourcing SLA Trust Note */}
            <div className="bg-[#fde7f3]/40 p-3.5 rounded-xl border border-[#e0bec6] text-[11.5px] text-[#594047] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#b90064]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nexora Buyer Protection</span>
              </div>
              <p className="leading-relaxed">
                Direct manufacturing SLA guarantees confidential formulation quotes, audited laboratory quality reports, and verified direct contact.
              </p>
            </div>

          </aside>

          {/* Right Panel: Main Form Area */}
          <main className="w-full md:w-[64%] p-5 sm:p-6 overflow-y-auto bg-white transition-opacity duration-300 relative">
            <AnimatePresence mode="wait">
              {submitted ? (
                /* Post-Submit Success State */
                <motion.div
                  key="success-state"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center p-4 sm:p-8 text-center min-h-[460px] space-y-5"
                >
                  {/* Success Icon */}
                  <div className="w-20 h-20 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center shadow-inner relative">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    <div className="absolute inset-0 border-4 border-[#2E7D32] rounded-full opacity-20 scale-125 animate-ping"></div>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1c1b1b]">
                      Enquiry Successfully Sent
                    </h2>
                    <p className="text-[13.5px] text-[#594047] max-w-md mx-auto mt-1">
                      <strong className="text-[#1c1b1b]">{supplierName}</strong> has received your business requirement.
                    </p>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-[#f7f2f2] border border-[#e8e8e8] rounded-full text-[12px] text-[#594047]">
                      <span>Ref ID:</span>
                      <span className="font-mono text-[#b90064] font-bold">{referenceId}</span>
                      <button
                        onClick={handleCopyRef}
                        className="ml-1 text-[#8c7077] hover:text-[#b90064] transition-colors cursor-pointer"
                        title="Copy Reference ID"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl p-4 w-full max-w-md text-left shadow-xs text-[12.5px] space-y-2">
                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8c7077] border-b border-[#e8e8e8] pb-1.5">
                      Requirement Summary
                    </h4>
                    <div className="flex justify-between items-start">
                      <span className="text-[#8c7077] w-1/3">Product:</span>
                      <span className="font-bold text-[#1c1b1b] text-right w-2/3 truncate">{productName}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[#8c7077] w-1/3">Quantity:</span>
                      <span className="font-bold text-[#1c1b1b] text-right w-2/3">
                        {quantity} {unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[#8c7077] w-1/3">Order Type:</span>
                      <span className="font-bold text-[#1c1b1b] text-right w-2/3 capitalize">
                        {orderType === 'bulk' ? 'Bulk Commercial Purchase' : orderType === 'sample' ? 'Sample Order' : orderType === 'oem' ? 'OEM/Private Label' : 'Retail Dealership'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[#8c7077] w-1/3">Destination:</span>
                      <span className="font-bold text-[#1c1b1b] text-right w-2/3">{city}, {pincode}</span>
                    </div>
                  </div>

                  {/* Next Steps Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center pt-2">
                    <button
                      onClick={onClose}
                      type="button"
                      className="flex-1 px-4 py-2.5 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f7f2f2] rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                    >
                      Close &amp; Continue Browsing
                    </button>
                    {onWhatsAppSupplier && (
                      <button
                        onClick={() => {
                          onWhatsAppSupplier(supplierName);
                          onClose();
                        }}
                        type="button"
                        className="flex-1 px-4 py-2.5 bg-[#25D366] text-white hover:bg-[#20bd5a] rounded-xl font-bold text-[12.5px] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat on WhatsApp</span>
                      </button>
                    )}
                    {onNavigateToDashboard && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToDashboard();
                        }}
                        type="button"
                        className="flex-1 px-4 py-2.5 bg-[#b90064] text-white hover:bg-[#8e004b] rounded-xl font-bold text-[12.5px] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Buyer Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Primary Enquiry Form */
                <form
                  id="enquiry-form"
                  onSubmit={handleValidateAndSubmit}
                  className="space-y-6 pb-2"
                >
                  {/* Contact Info Section */}
                  <section className="space-y-3.5">
                    <h3 className="text-[14px] font-bold text-[#1c1b1b] flex items-center gap-2 border-b border-[#e8e8e8] pb-2">
                      <User className="w-4 h-4 text-[#b90064]" />
                      <span>Contact Information</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Buyer Full Name <span className="text-[#b90064]">*</span>
                        </label>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className={`w-full bg-[#fcf9f8] border ${
                            formErrors.buyerName ? 'border-red-500 ring-1 ring-red-500' : 'border-[#e8e8e8]'
                          } focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all`}
                          required
                        />
                        {formErrors.buyerName && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.buyerName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Company / Business Name
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Luxe Beauty Clinics"
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Direct Contact Number <span className="text-[#b90064]">*</span>
                        </label>
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className={`w-full bg-[#fcf9f8] border ${
                            formErrors.mobile ? 'border-red-500 ring-1 ring-red-500' : 'border-[#e8e8e8]'
                          } focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all`}
                          required
                        />
                        {formErrors.mobile && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.mobile}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Business Email Address <span className="text-[#b90064]">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="procurement@brand.com"
                          className={`w-full bg-[#fcf9f8] border ${
                            formErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#e8e8e8]'
                          } focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all`}
                          required
                        />
                        {formErrors.email && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          GST Identification Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all uppercase"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Requirement Details Section */}
                  <section className="space-y-4 pt-2">
                    <h3 className="text-[14px] font-bold text-[#1c1b1b] flex items-center gap-2 border-b border-[#e8e8e8] pb-2">
                      <Layers className="w-4 h-4 text-[#b90064]" />
                      <span>Requirement Details</span>
                    </h3>

                    {/* Quantity & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Required Quantity <span className="text-[#b90064]">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="100"
                            className="w-2/3 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all"
                            required
                          />
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-1/3 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-2.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                          >
                            <option value="Units">Units</option>
                            <option value="Bottles">Bottles</option>
                            <option value="Pieces">Pieces</option>
                            <option value="Litres">Litres</option>
                            <option value="Kg">Kg</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-[#8c7077] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-[#0050d6]" />
                          Supplier Minimum Order: <strong className="text-[#1c1b1b]">{moqDisplay}</strong>
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Target Budget per Unit (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-[#8c7077] text-[13px]">₹</span>
                          <input
                            type="number"
                            value={targetBudget}
                            onChange={(e) => setTargetBudget(e.target.value)}
                            placeholder="e.g. 380"
                            className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg pl-7 pr-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Type & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Order Type / Purpose <span className="text-[#b90064]">*</span>
                        </label>
                        <select
                          value={orderType}
                          onChange={(e) => setOrderType(e.target.value)}
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="bulk">Bulk Commercial Purchase</option>
                          <option value="sample">Sample Order (Pre-Production)</option>
                          <option value="oem">OEM / Private Labeling</option>
                          <option value="retail">Retail Dealership / Distributorship</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <div className="w-1/3">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                            Pincode <span className="text-[#b90064]">*</span>
                          </label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            placeholder="400001"
                            className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none"
                            required
                          />
                        </div>
                        <div className="w-2/3">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                            Delivery City <span className="text-[#b90064]">*</span>
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Mumbai"
                            className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Intent Selector (4 Radio Cards) */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-2 block">
                        Primary Information Needed <span className="text-[#b90064]">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <label
                          onClick={() => setIntent('price')}
                          className={`p-3 border rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                            intent === 'price'
                              ? 'bg-[#fde7f3] border-[#b90064] shadow-xs'
                              : 'bg-[#fcf9f8] hover:bg-[#f7f2f2] border-[#e8e8e8]'
                          }`}
                        >
                          <DollarSign className={`w-4 h-4 ${intent === 'price' ? 'text-[#b90064]' : 'text-[#594047]'}`} />
                          <span className={`text-[12px] font-bold ${intent === 'price' ? 'text-[#b90064]' : 'text-[#1c1b1b]'}`}>
                            Price &amp; Availability
                          </span>
                        </label>

                        <label
                          onClick={() => setIntent('bulk')}
                          className={`p-3 border rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                            intent === 'bulk'
                              ? 'bg-[#fde7f3] border-[#b90064] shadow-xs'
                              : 'bg-[#fcf9f8] hover:bg-[#f7f2f2] border-[#e8e8e8]'
                          }`}
                        >
                          <Package className={`w-4 h-4 ${intent === 'bulk' ? 'text-[#b90064]' : 'text-[#594047]'}`} />
                          <span className={`text-[12px] font-bold ${intent === 'bulk' ? 'text-[#b90064]' : 'text-[#1c1b1b]'}`}>
                            Bulk Quote
                          </span>
                        </label>

                        <label
                          onClick={() => setIntent('sample')}
                          className={`p-3 border rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                            intent === 'sample'
                              ? 'bg-[#fde7f3] border-[#b90064] shadow-xs'
                              : 'bg-[#fcf9f8] hover:bg-[#f7f2f2] border-[#e8e8e8]'
                          }`}
                        >
                          <Sparkles className={`w-4 h-4 ${intent === 'sample' ? 'text-[#b90064]' : 'text-[#594047]'}`} />
                          <span className={`text-[12px] font-bold ${intent === 'sample' ? 'text-[#b90064]' : 'text-[#1c1b1b]'}`}>
                            Product Sample
                          </span>
                        </label>

                        <label
                          onClick={() => setIntent('label')}
                          className={`p-3 border rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                            intent === 'label'
                              ? 'bg-[#fde7f3] border-[#b90064] shadow-xs'
                              : 'bg-[#fcf9f8] hover:bg-[#f7f2f2] border-[#e8e8e8]'
                          }`}
                        >
                          <Briefcase className={`w-4 h-4 ${intent === 'label' ? 'text-[#b90064]' : 'text-[#594047]'}`} />
                          <span className={`text-[12px] font-bold ${intent === 'label' ? 'text-[#b90064]' : 'text-[#1c1b1b]'}`}>
                            Private Label
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Timeline & Detailed Textarea */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                          Requirement Urgency <span className="text-[#b90064]">*</span>
                        </label>
                        <select
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value)}
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="immediate">Immediate (Ready Dispatch)</option>
                          <option value="7days">Within 7 Days</option>
                          <option value="15-30days">15 - 30 Days</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                        Requirement Description
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please provide your best quotation. We are looking for regular bulk supply..."
                        className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] rounded-lg p-3 text-[13px] text-[#1c1b1b] focus:outline-none resize-none transition-all"
                      />
                    </div>

                    {/* Attachment Box */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-1 block">
                        Attach Reference Documents (Optional)
                      </label>
                      <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-5 flex flex-col items-center justify-center bg-[#fcf9f8] hover:bg-[#f7f2f2] hover:border-[#b90064] transition-all duration-300 cursor-pointer group relative overflow-hidden text-center">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-[#f0edec] p-2.5 rounded-full mb-2 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-6 h-6 text-[#594047] group-hover:text-[#b90064]" />
                        </div>
                        <span className="font-bold text-[13px] text-[#1c1b1b]">
                          {attachedFile ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <FileText className="w-4 h-4" /> Attached: {attachedFile}
                            </span>
                          ) : (
                            <>
                              Drag &amp; Drop files or <span className="text-[#b90064] underline">Browse</span>
                            </>
                          )}
                        </span>
                        <span className="text-[11px] text-[#8c7077] mt-0.5">
                          Attach Specs, Reference Artwork, or Company Profile (PDF, JPG, PNG - Max 10MB)
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Preferences & Consents */}
                  <section className="space-y-4 pt-4 border-t border-[#e8e8e8]">
                    <div className="bg-[#fde7f3]/40 border border-[#e0bec6] rounded-xl p-3.5 transition-colors hover:bg-[#fde7f3]/60">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={multiBroadcast}
                          onChange={(e) => setMultiBroadcast(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-[#b90064] border-[#8c7077] rounded focus:ring-[#b90064] cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-[13px] text-[#1c1b1b] block group-hover:text-[#b90064] transition-colors">
                            Multi-Supplier Broadcasting
                          </span>
                          <span className="text-[11.5px] text-[#594047] block mt-0.5">
                            Send this enquiry to other verified suppliers of similar beauty products to get best quotes faster.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#594047] mb-2 block">
                        Preferred Mode of Contact
                      </span>
                      <div className="flex flex-wrap gap-4 text-[12.5px]">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="contact_pref"
                            value="nexora"
                            checked={contactPref === 'nexora'}
                            onChange={() => setContactPref('nexora')}
                            className="text-[#b90064] focus:ring-[#b90064]"
                          />
                          <span className="text-[#1c1b1b] group-hover:text-[#b90064]">Platform Chat</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="contact_pref"
                            value="whatsapp"
                            checked={contactPref === 'whatsapp'}
                            onChange={() => setContactPref('whatsapp')}
                            className="text-[#b90064] focus:ring-[#b90064]"
                          />
                          <span className="text-[#1c1b1b] group-hover:text-[#b90064]">WhatsApp</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="contact_pref"
                            value="call"
                            checked={contactPref === 'call'}
                            onChange={() => setContactPref('call')}
                            className="text-[#b90064] focus:ring-[#b90064]"
                          />
                          <span className="text-[#1c1b1b] group-hover:text-[#b90064]">Phone Call</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="contact_pref"
                            value="email"
                            checked={contactPref === 'email'}
                            onChange={() => setContactPref('email')}
                            className="text-[#b90064] focus:ring-[#b90064]"
                          />
                          <span className="text-[#1c1b1b] group-hover:text-[#b90064]">Email</span>
                        </label>
                      </div>
                    </div>
                  </section>
                </form>
              )}
            </AnimatePresence>
          </main>

        </div>

        {/* Modal Footer: Sticky Actions */}
        {!submitted && (
          <footer
            id="modal-footer"
            className="px-6 py-3.5 border-t border-[#e8e8e8] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
          >
            {/* Quick Supplier Contact Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              {onWhatsAppSupplier && (
                <button
                  type="button"
                  onClick={() => onWhatsAppSupplier(supplierName)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#e8e8e8] rounded-xl hover:bg-[#f7f2f2] text-[#1c1b1b] font-bold text-[12px] transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Supplier</span>
                </button>
              )}
              {onCallSupplier && (
                <button
                  type="button"
                  onClick={() => onCallSupplier(supplierName)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#e8e8e8] rounded-xl hover:bg-[#f7f2f2] text-[#1c1b1b] font-bold text-[12px] transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#b90064]" />
                  <span>Call Supplier</span>
                </button>
              )}
            </div>

            {/* Primary Submit Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-[#e8e8e8] text-[#594047] hover:text-[#1c1b1b] hover:bg-[#f7f2f2] rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="enquiry-form"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-7 py-2.5 bg-[#b90064] hover:bg-[#8e004b] text-white rounded-xl font-bold text-[12.5px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <span>Send Enquiry</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </footer>
        )}

      </motion.div>
    </div>
  );
};
