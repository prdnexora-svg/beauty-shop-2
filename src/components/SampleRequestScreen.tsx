import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  ChevronLeft,
  Check,
  Info,
  Truck,
  Calendar,
  FlaskConical,
} from 'lucide-react';

export interface SampleRequestProduct {
  id: string;
  title: string;
  supplierName: string;
  supplierId?: string;
  image?: string;
  priceRange?: string;
  moq?: string;
  location?: string;
}

export interface SampleRequestFormData {
  productId: string;
  productTitle: string;
  supplierName: string;
  supplierId?: string;
  variant: string;
  sampleSet: string;
  purposes: string[];
  notes: string;
  recipientName: string;
  companyName: string;
  streetAddress: string;
  city: string;
  state: string;
  shippingMethod: 'standard' | 'express';
}

interface SampleRequestScreenProps {
  onBack: () => void;
  onSubmit: (data: SampleRequestFormData) => void;
  product?: SampleRequestProduct;
  onAskFormulationLead?: () => void;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80'
];

const EVALUATION_PURPOSES = [
  'Stability Testing',
  'Packaging Compatibility',
  'Sensory Assessment',
  'Lab Analysis'
];

export const SampleRequestScreen: React.FC<SampleRequestScreenProps> = ({
  onBack,
  onSubmit,
  product,
  onAskFormulationLead
}) => {
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [variant, setVariant] = useState('Standard Formulation');
  const [sampleSet, setSampleSet] = useState('1x 50ml — ₹1,250');
  const [purposes, setPurposes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const productTitle = product?.title || 'Catalogue Product';
  const supplierName = product?.supplierName || 'Verified Supplier';
  const heroImage = product?.image || 'https://images.unsplash.com/photo-1608248597359-00f723812586?auto=format&fit=crop&w=1200&q=80';

  const togglePurpose = (purpose: string) => {
    setPurposes((prev) =>
      prev.includes(purpose) ? prev.filter((p) => p !== purpose) : [...prev, purpose]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !streetAddress.trim() || !city.trim()) {
      setFormError('Recipient name, street address and city are required so the supplier can dispatch the sample.');
      return;
    }
    setFormError(null);
    onSubmit({
      productId: product?.id || 'catalogue',
      productTitle,
      supplierName,
      supplierId: product?.supplierId,
      variant,
      sampleSet,
      purposes,
      notes: notes.trim(),
      recipientName: recipientName.trim(),
      companyName: companyName.trim(),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      shippingMethod,
    });
  };

  const inputClass =
    'bg-transparent border-0 border-b border-[#7E6C96] rounded-none py-2 px-0 focus:ring-0 focus:border-[#C9A961] transition-colors font-light text-base placeholder:text-[#B9A8C6]/70 w-full';
  const labelClass = 'text-[11px] font-bold text-[#5B4A6E] uppercase tracking-[0.1em] mb-2';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2A0E3F] font-['Inter']">
      {/* Editorial Header */}
      <header className="max-w-[1440px] mx-auto px-5 md:px-10 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#7E6C96] hover:text-[#6B2D8C] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Details
        </button>
        <div className="hidden md:block font-bold text-sm uppercase tracking-[0.2em] text-[#2A0E3F]">
          Nexora Luxe
        </div>
        <div className="w-20 md:w-auto"></div>
      </header>

      <main className="max-w-[1600px] mx-auto px-5 md:px-10 py-10 md:py-20 flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
        {/* Left Content Area: Imagery & Info */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-12 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-bold text-[#5B4A6E] uppercase tracking-[0.15em] mb-4">Sample Requisition</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2A0E3F] leading-tight mb-6 tracking-tight">
              {productTitle}
            </h1>

            {onAskFormulationLead && (
              <button
                type="button"
                onClick={onAskFormulationLead}
                className="flex items-center gap-2 text-[11px] font-bold text-[#6B2D8C] uppercase tracking-widest mb-8 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Formulation Lead
              </button>
            )}

            <p className="text-base font-light text-[#5B4A6E] max-w-md mb-2 leading-relaxed">
              Custom Formulation <br/>
              Supplier: {supplierName}
              {product?.location ? ` · ${product.location}` : ''}
            </p>
            {(product?.priceRange || product?.moq) && (
              <p className="text-sm font-light text-[#7E6C96] mb-6">
                {[product.priceRange, product.moq ? `MOQ ${product.moq}` : null].filter(Boolean).join(' · ')}
              </p>
            )}
          </motion.div>

          <motion.figure
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full aspect-[4/5] overflow-hidden bg-[#F4F0E9] rounded-sm"
          >
            <img
              alt={`${productTitle} product shot`}
              className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              src={heroImage}
            />
          </motion.figure>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {FALLBACK_IMAGES.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="aspect-square overflow-hidden bg-[#F4F0E9]"
              >
                <img src={img} alt="Detail" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between items-end border-t border-[#E8DEEF] pt-6">
            <div>
              <p className="text-[13px] font-medium text-[#5B4A6E] mb-1">Base Sample Fee</p>
              <p className="text-2xl font-bold text-[#2A0E3F]">₹1,250 <span className="text-sm font-normal text-[#5B4A6E]">/ 50ml</span></p>
            </div>
            <p className="text-[11px] font-medium text-[#5B4A6E] text-right max-w-[150px] leading-relaxed">
              Fee refundable on bulk orders exceeding 500 units.
            </p>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="w-full lg:w-7/12 lg:pl-12 lg:border-l border-[#E8DEEF] py-8">
          <form onSubmit={handleSubmit} className="space-y-16 max-w-2xl">
            {/* Narrative Form Section */}
            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-[#2A0E3F] mb-8">Product Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <label className={labelClass}>Formula Variant</label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="bg-transparent border-0 border-b border-[#7E6C96] rounded-none py-2 px-0 focus:ring-0 focus:border-[#C9A961] transition-colors font-light text-base"
                  >
                    <option>Standard Formulation</option>
                    <option>Unscented</option>
                    <option>Enhanced Active Concentration</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Sample Set</label>
                  <select
                    value={sampleSet}
                    onChange={(e) => setSampleSet(e.target.value)}
                    className="bg-transparent border-0 border-b border-[#7E6C96] rounded-none py-2 px-0 focus:ring-0 focus:border-[#C9A961] transition-colors font-light text-base"
                  >
                    <option>1x 50ml — ₹1,250</option>
                    <option>3x 50ml — ₹3,200</option>
                  </select>
                </div>
              </div>
            </section>

            <hr className="border-[#E8DEEF]" />

            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-[#2A0E3F] mb-8">Shipping Details</h2>
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col">
                    <label className={labelClass}>Recipient Name*</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Jane Doe"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelClass}>Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Luxe Beauty Co."
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Street Address*</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="123 Innovation Drive, Suite 400"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col md:col-span-2">
                    <label className={labelClass}>City*</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Maharashtra"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-[#E8DEEF]" />

            <section>
              <h2 className="text-2xl font-bold text-[#2A0E3F] mb-8">Evaluation Purpose</h2>
              <p className="text-base font-light text-[#5B4A6E] mb-8">Select the primary intentions for this sample request.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mb-12">
                {EVALUATION_PURPOSES.map((purpose) => (
                  <label key={purpose} className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={purposes.includes(purpose)}
                        onChange={() => togglePurpose(purpose)}
                        className="peer appearance-none w-5 h-5 border border-[#7E6C96] rounded-none checked:bg-[#2A0E3F] checked:border-[#2A0E3F] transition-all cursor-pointer"
                      />
                      <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-base font-light text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors">{purpose}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col">
                <label className={labelClass}>Additional Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail any specific requirements, such as requested documentation (MSDS, COA) or specific packaging concerns..."
                  className="bg-transparent border-0 border-b border-[#7E6C96] rounded-none py-2 px-0 focus:ring-0 focus:border-[#C9A961] transition-colors font-light text-base placeholder:text-[#B9A8C6]/70 min-h-[120px] resize-y"
                />
              </div>
            </section>

            <hr className="border-[#E8DEEF]" />

            <section>
              <h2 className="text-2xl font-bold text-[#2A0E3F] mb-8">Shipping Method</h2>
              <div className="space-y-4">
                <label
                  className={`flex items-center justify-between p-6 border transition-all cursor-pointer ${
                    shippingMethod === 'standard' ? 'border-[#2A0E3F] bg-white' : 'border-[#E8DEEF] hover:bg-[#F4F0E9]'
                  }`}
                  onClick={() => setShippingMethod('standard')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingMethod === 'standard' ? 'border-[#2A0E3F]' : 'border-[#7E6C96]'}`}>
                      {shippingMethod === 'standard' && <div className="w-2 h-2 rounded-full bg-[#2A0E3F]" />}
                    </div>
                    <span className="text-base font-light text-[#2A0E3F]">Standard (5-7 days)</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#5B4A6E]">FREE</span>
                </label>

                <label
                  className={`flex items-center justify-between p-6 border transition-all cursor-pointer ${
                    shippingMethod === 'express' ? 'border-[#2A0E3F] bg-white' : 'border-[#E8DEEF] hover:bg-[#F4F0E9]'
                  }`}
                  onClick={() => setShippingMethod('express')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingMethod === 'express' ? 'border-[#2A0E3F]' : 'border-[#7E6C96]'}`}>
                      {shippingMethod === 'express' && <div className="w-2 h-2 rounded-full bg-[#2A0E3F]" />}
                    </div>
                    <span className="text-base font-light text-[#2A0E3F]">Express (2-3 days)</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#5B4A6E]">₹450</span>
                </label>
              </div>
            </section>

            <section className="bg-white p-8 border border-[#E8DEEF] rounded-sm shadow-sm">
              <h3 className="text-lg font-bold text-[#2A0E3F] mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#6B2D8C]" />
                Logistics Summary
              </h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-[#E8DEEF] pb-4">
                  <span className="text-[13px] font-medium text-[#5B4A6E]">Estimated Dispatch</span>
                  <span className="text-sm font-bold text-[#2A0E3F] flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-40" />
                    3-5 Business Days
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#E8DEEF] pb-4">
                  <span className="text-[13px] font-medium text-[#5B4A6E]">Courier Tracking</span>
                  <span className="text-sm font-bold text-[#2A0E3F] flex items-center gap-2">
                    <Info className="w-4 h-4 opacity-40" />
                    Via Email Confirmation
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-[#5B4A6E]">Dispatching From</span>
                  <span className="text-sm font-bold text-[#2A0E3F] flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 opacity-40 text-[#6B2D8C]" />
                    {supplierName}
                  </span>
                </div>
              </div>
            </section>

            {formError && (
              <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {formError}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-[#E8DEEF]">
              <button
                type="button"
                onClick={onBack}
                className="px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2A0E3F] border border-[#2A0E3F] hover:bg-[#2A0E3F] hover:text-white transition-all duration-300 w-full sm:w-auto text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-10 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white bg-[#6B2D8C] hover:bg-[#4A2560] transition-all duration-300 w-full sm:w-auto text-center flex-grow shadow-lg shadow-[#6B2D8C]/20 cursor-pointer"
              >
                Submit Requisition
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
