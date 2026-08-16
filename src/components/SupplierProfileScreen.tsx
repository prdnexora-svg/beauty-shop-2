import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  Mail,
  MessageSquare,
  Download,
  FileText,
  CheckCircle2,
  X,
  UploadCloud,
  Award,
  Clock,
  Sparkles,
  MapPin,
  Bookmark,
  ChevronRight,
  Send,
  Building2,
  ExternalLink,
  FlaskConical,
  PackageCheck,
  Truck,
  Check,
  FileSpreadsheet,
  Video
} from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/mockData';

interface SupplierProfileScreenProps {
  onOpenEnquiryModal?: (item: any) => void;
  onOpenQuoteModal?: (rfq?: any) => void;
  onOpenRFQModal?: () => void;
  onOpenFacilityTour?: (supplier?: any) => void;
  onNavigateToDirectory?: () => void;
}

export const SupplierProfileScreen: React.FC<SupplierProfileScreenProps> = ({
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToDirectory
}) => {
  // Local modal states
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);

  // RFQ Modal form state
  const [rfqProductInterest, setRfqProductInterest] = useState('Skincare • Serum Base');
  const [rfqVolume, setRfqVolume] = useState('');
  const [rfqMessage, setRfqMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>('packaging_artwork_v2.pdf');

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSendRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRfqModalOpen(false);
    showToast('Request sent successfully to Aura Labs!');
    setRfqVolume('');
    setRfqMessage('');
  };

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] font-sans relative pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#1c1b1b] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Section */}
      <section className="relative w-full min-h-[580px] md:min-h-[620px] flex items-center justify-center overflow-hidden bg-[#1c1b1b] py-12 md:py-16">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=1920&q=80"
            alt="State of the art cosmetics manufacturing facility showing automated filling lines"
            className="w-full h-full object-cover brightness-75"
          />
        </div>

        {/* Hero Content Card */}
        <div className="relative z-10 w-full max-w-[1440px] px-4 md:px-10 mx-auto">
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 md:p-12 max-w-4xl mx-auto text-center border border-white/60 shadow-2xl">
            {/* Verified Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#fde7f3] text-[#e6007e] font-bold text-[12px] uppercase tracking-wider mb-5 border border-[#e0bec6]">
              <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
              <span>Verified Premium Manufacturer</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-[#1c1b1b] mb-3 tracking-tight">
              Aura Labs &amp; Manufacturing
            </h1>

            <p className="text-[14px] md:text-[15px] text-[#594047] mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
              Specializing in high-efficacy botanical serums and luxury foundations. Providing end-to-end OEM/ODM services for premier global brands.
            </p>

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064]">98%</span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Response Rate</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064]">5k+</span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Min. Order (MOQ)</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064]">15 Yrs</span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Experience</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064] flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> 4.9
                </span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Rating</span>
              </div>
            </div>

            {/* Hero Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <button
                onClick={() => {
                  if (onOpenRFQModal) onOpenRFQModal();
                  else setIsRfqModalOpen(true);
                }}
                className="bg-[#b90064] text-white px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#8e004b] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Request Quote</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'Aura Labs Direct Business Inquiry',
                      supplierName: 'Aura Labs & Manufacturing'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="bg-white/80 border border-[#b90064] text-[#b90064] px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#fde7f3] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Supplier</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenFacilityTour) {
                    onOpenFacilityTour(VERIFIED_SUPPLIERS[0]);
                  }
                }}
                className="bg-[#fde7f3] border border-[#b90064] text-[#b90064] px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#b90064] hover:text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>View Facility (15s Tour)</span>
              </button>

              <button
                onClick={() => setIsDocModalOpen(true)}
                className="bg-white/80 border border-[#e8e8e8] text-[#594047] px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#f0edec] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#b90064]" />
                <span>Corporate Brochure</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Aura Process (Narrative Section) */}
      <section className="py-12 md:py-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-extrabold text-[#b90064] uppercase tracking-widest bg-[#fde7f3] px-3 py-1 rounded-full inline-block mb-2">
            End-to-End Excellence
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1c1b1b] mb-2 tracking-tight">
            The Aura Process
          </h2>
          <p className="text-[14px] text-[#594047] max-w-lg mx-auto font-medium">
            Precision engineering and certified standards at every stage of production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 group flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80"
                alt="Two cosmetic scientists analyzing formulations in a R&D laboratory"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#b90064] border border-[#e8e8e8]">
                Phase 01
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-2 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                  <span>Research &amp; Development</span>
                </h3>
                <p className="text-[13px] text-[#594047] leading-relaxed font-normal">
                  Our team of expert cosmetic chemists develop bespoke formulations using cutting-edge active ingredients, ensuring high efficacy and clinical stability.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0edec] flex items-center justify-between text-[11.5px] font-semibold text-[#8c7077]">
                <span>R&amp;D Turnaround</span>
                <span className="text-[#b90064] font-bold">3–5 Days</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 group flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
                alt="Cleanroom environment showing automated mixing vats"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#b90064] border border-[#e8e8e8]">
                Phase 02
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#b90064]" />
                  <span>Precision Manufacturing</span>
                </h3>
                <p className="text-[13px] text-[#594047] leading-relaxed font-normal">
                  ISO 22716 certified cleanroom facilities equipped with automated mixing lines, guaranteeing consistency across large-scale commercial production runs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0edec] flex items-center justify-between text-[11.5px] font-semibold text-[#8c7077]">
                <span>Daily Yield</span>
                <span className="text-[#00875a] font-bold">50,000+ Units</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 group flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
                alt="Automated packaging line filling luxury serum bottles"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#b90064] border border-[#e8e8e8]">
                Phase 03
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-2 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#b90064]" />
                  <span>Premium Packaging</span>
                </h3>
                <p className="text-[13px] text-[#594047] leading-relaxed font-normal">
                  We source and assemble luxury packaging components, from frosted glass droppers to sustainable airless pumps, ensuring an unboxing experience matching global luxury standards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0edec] flex items-center justify-between text-[11.5px] font-semibold text-[#8c7077]">
                <span>Defect Tolerance</span>
                <span className="text-[#0050d6] font-bold">&lt; 0.01%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade & Export Specifications Section */}
      <section className="pb-12 md:pb-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="bg-white rounded-2xl p-6 md:p-10 border border-[#e8e8e8] shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0edec]">
            <Truck className="w-5 h-5 text-[#b90064]" />
            <h2 className="text-xl font-bold text-[#1c1b1b]">Trade &amp; Export Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Accepted Delivery Terms
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">FOB, CIF, EXW, DDP</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Standard Production Lead Time
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">7–15 Business Days</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Accepted Payment Modes
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">Bank Transfer (T/T), L/C, Advance</span>
            </div>

            <div className="flex flex-col gap-1 lg:col-span-2">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Customization Capabilities
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">
                OEM Custom Formulation, Custom Color Matching, Private Labeling, Sustainable Packaging
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Sample Lead Time
              </span>
              <span className="text-base font-bold text-[#b90064]">3–5 Days (Express Dispatch)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Formulations / Product Catalog Section */}
      <section className="py-12 md:py-16 px-4 md:px-10 max-w-[1440px] mx-auto bg-[#fcf9f8] rounded-3xl mb-16 border border-[#e8e8e8]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-[11px] font-extrabold text-[#b90064] uppercase tracking-widest bg-[#fde7f3] px-3 py-1 rounded-full inline-block mb-2">
              Ready to Label
            </span>
            <h2 className="text-2xl font-bold text-[#1c1b1b] tracking-tight">
              Featured Formulations
            </h2>
            <p className="text-[13.5px] text-[#594047] font-medium mt-1">
              High-demand base formulas available for immediate OEM customization.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="text-[#b90064] font-bold text-[13px] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Product Catalog</span>
            </button>
          </div>
        </div>

        {/* Formulations Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] flex flex-col justify-between group">
            <div className="aspect-square bg-[#fdf8f8] overflow-hidden relative p-3">
              <img
                src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"
                alt="Radiance Vit-C Serum"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="absolute top-5 right-5 bg-white/90 rounded-full p-2 shadow-xs hover:bg-[#fde7f3] transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#b90064] text-[#b90064]' : 'text-[#8c7077]'}`} />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
                  Skincare • Serum
                </span>
                <h4 className="text-base font-bold text-[#1c1b1b] mb-1">Radiance Vit-C Serum</h4>
                <p className="text-[12.5px] text-[#594047] mb-4 line-clamp-2">
                  15% L-Ascorbic Acid + Hyaluronic Acid &amp; Ferulic. Shelf Life: 24 Months.
                </p>

                <div className="space-y-1.5 mb-4 bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">500–1K pcs</span>
                    <span className="font-bold text-[#b90064]">₹350 / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">1K–5K pcs</span>
                    <span className="font-bold text-[#b90064]">₹280 / unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenEnquiryModal) {
                      onOpenEnquiryModal({
                        title: 'Radiance Vit-C Serum Formula RFQ',
                        supplierName: 'Aura Labs & Manufacturing',
                        priceRange: '₹280 - ₹350 / unit'
                      });
                    } else {
                      setIsRfqModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2.5 rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                >
                  Send RFQ
                </button>
                <button
                  onClick={() => showToast('Sample formula specs copied!')}
                  className="px-3 py-2.5 border border-[#e8e8e8] rounded-xl text-[#1c1b1b] hover:bg-[#f0edec] transition-colors cursor-pointer"
                  title="View Formula Specs"
                >
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] flex flex-col justify-between group">
            <div className="aspect-square bg-[#fdf8f8] overflow-hidden relative p-3">
              <img
                src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80"
                alt="Lumina Radiance Foundation"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
                  Cosmetics • Complexion
                </span>
                <h4 className="text-base font-bold text-[#1c1b1b] mb-1">Lumina Foundation</h4>
                <p className="text-[12.5px] text-[#594047] mb-4 line-clamp-2">
                  SPF 30 / PA+++. 40 Inclusive Shade range. Sweat-resistant lightweight coverage.
                </p>

                <div className="space-y-1.5 mb-4 bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">500–1K pcs</span>
                    <span className="font-bold text-[#b90064]">₹420 / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">1K+ pcs</span>
                    <span className="font-bold text-[#b90064]">₹380 / unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenEnquiryModal) {
                      onOpenEnquiryModal({
                        title: 'Lumina Foundation Base RFQ',
                        supplierName: 'Aura Labs & Manufacturing'
                      });
                    } else {
                      setIsRfqModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2.5 rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                >
                  Send RFQ
                </button>
                <button
                  onClick={() => showToast('Sample formula specs copied!')}
                  className="px-3 py-2.5 border border-[#e8e8e8] rounded-xl text-[#1c1b1b] hover:bg-[#f0edec] transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] flex flex-col justify-between group">
            <div className="aspect-square bg-[#fdf8f8] overflow-hidden relative p-3">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
                alt="Restorative Keratin Mask"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
                  Haircare • Treatment
                </span>
                <h4 className="text-base font-bold text-[#1c1b1b] mb-1">Keratin Repair Mask</h4>
                <p className="text-[12.5px] text-[#594047] mb-4 line-clamp-2">
                  Pure Argan Oil &amp; Organic Shea Butter. Sulfate &amp; Paraben free salon formula.
                </p>

                <div className="space-y-1.5 mb-4 bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">500–1K pcs</span>
                    <span className="font-bold text-[#b90064]">₹290 / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">1K+ pcs</span>
                    <span className="font-bold text-[#b90064]">₹240 / unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenEnquiryModal) {
                      onOpenEnquiryModal({
                        title: 'Keratin Repair Mask RFQ',
                        supplierName: 'Aura Labs & Manufacturing'
                      });
                    } else {
                      setIsRfqModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2.5 rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                >
                  Send RFQ
                </button>
                <button
                  onClick={() => showToast('Sample formula specs copied!')}
                  className="px-3 py-2.5 border border-[#e8e8e8] rounded-xl text-[#1c1b1b] hover:bg-[#f0edec] transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: View Catalog Launcher */}
          <div className="bg-white rounded-2xl overflow-hidden border border-dashed border-[#b90064]/40 hover:border-[#b90064] transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-[#fde7f3]/20">
            <div className="w-14 h-14 rounded-full bg-[#fde7f3] text-[#b90064] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-[#1c1b1b] mb-1">View 124+ Formulas</h4>
            <p className="text-[12.5px] text-[#594047] mb-4">
              Explore complete formulation library with MOQs and pricing tiers.
            </p>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="text-[#b90064] font-bold text-[13px] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Browse Full Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Similar Verified Suppliers Section */}
      <section className="pb-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1c1b1b] mb-1">
              Similar Verified Suppliers
            </h2>
            <p className="text-[13.5px] text-[#594047] font-medium">
              Top-rated OEM &amp; private label manufacturing partners in Western India.
            </p>
          </div>
          {onNavigateToDirectory && (
            <button
              onClick={onNavigateToDirectory}
              className="text-[#b90064] font-bold text-[13px] hover:underline cursor-pointer"
            >
              View All Suppliers
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Similar Card 1 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#b90064] text-[12px] font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                  <span>Nexora Verified</span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">Lumina Skin Labs</h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#8c7077] bg-[#f0edec] px-2.5 py-0.5 rounded-full">
                Mumbai
              </span>
            </div>

            <p className="text-[12.5px] text-[#594047] mb-4">
              Organic Skincare &amp; Herbal OEM Formulations with ISO 9001.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Min Order</span>
                <span className="font-bold text-[#1c1b1b]">500 units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Response</span>
                <span className="font-bold text-[#00875a]">&gt; 98%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'Lumina Skin Labs Direct Inquiry',
                      supplierName: 'Lumina Skin Labs'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                Contact
              </button>
              {onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="flex-1 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f0edec] py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>

          {/* Similar Card 2 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#b90064] text-[12px] font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                  <span>Nexora Verified</span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">PureEssence Mfg</h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#8c7077] bg-[#f0edec] px-2.5 py-0.5 rounded-full">
                Delhi NCR
              </span>
            </div>

            <p className="text-[12.5px] text-[#594047] mb-4">
              Bulk Essential Oils, Cold Pressed Actives &amp; Serum Bases.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Min Order</span>
                <span className="font-bold text-[#1c1b1b]">1,000 units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Response</span>
                <span className="font-bold text-[#00875a]">&gt; 95%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'PureEssence Mfg Direct Inquiry',
                      supplierName: 'PureEssence Mfg'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                Contact
              </button>
              {onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="flex-1 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f0edec] py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>

          {/* Similar Card 3 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#b90064] text-[12px] font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                  <span>Nexora Verified</span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">Velvet Touch</h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#8c7077] bg-[#f0edec] px-2.5 py-0.5 rounded-full">
                Mumbai
              </span>
            </div>

            <p className="text-[12.5px] text-[#594047] mb-4">
              Luxury Color Cosmetics, Matte Lipsticks &amp; Highlighters.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Min Order</span>
                <span className="font-bold text-[#1c1b1b]">500 units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Response</span>
                <span className="font-bold text-[#00875a]">&gt; 97%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'Velvet Touch Cosmetics Direct Inquiry',
                      supplierName: 'Velvet Touch'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                Contact
              </button>
              {onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="flex-1 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f0edec] py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e8e8e8] p-3.5 md:hidden z-40 flex gap-3 shadow-lg">
        <button
          onClick={() => {
            if (onOpenRFQModal) onOpenRFQModal();
            else setIsRfqModalOpen(true);
          }}
          className="flex-1 bg-[#b90064] text-white py-3 rounded-xl font-bold text-[13.5px] hover:bg-[#8e004b] transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          <span>Request Quote</span>
        </button>
        <button
          onClick={() => {
            if (onOpenEnquiryModal) {
              onOpenEnquiryModal({
                title: 'Aura Labs Mobile Inquiry',
                supplierName: 'Aura Labs & Manufacturing'
              });
            } else {
              setIsRfqModalOpen(true);
            }
          }}
          className="p-3 border border-[#b90064] text-[#b90064] rounded-xl hover:bg-[#fde7f3] transition-colors flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Corporate Brochure PDF Modal (`doc-modal`) */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#e8e8e8]">
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-[#f0edec] bg-[#fcf9f8]">
              <h3 className="font-bold text-[16px] text-[#1c1b1b] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#b90064]" />
                <span>Aura Labs Corporate Brochure &amp; Technical Specs</span>
              </h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-[#f0edec] p-6 md:p-8 flex items-center justify-center overflow-y-auto min-h-[360px]">
              <div className="bg-white w-full max-w-xl aspect-[1/1.3] shadow-md p-8 md:p-12 flex flex-col items-center justify-center text-center border border-[#e8e8e8] rounded-2xl relative">
                <div className="w-16 h-16 bg-[#fde7f3] rounded-full flex items-center justify-center mb-4 text-[#b90064]">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Aura Labs Corporate Dossier</h2>
                <p className="text-[13px] text-[#594047] max-w-md leading-relaxed">
                  Comprehensive overview of facility certifications (WHO-GMP, ISO 22716, US-FDA), formula library specs, MOQ tiers, and export delivery terms.
                </p>
                <div className="mt-6 py-1.5 px-4 bg-[#f0edec] rounded-full text-[11.5px] font-bold text-[#8c7077]">
                  Page 1 of 12 (Verified PDF)
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#f0edec] bg-white flex justify-end gap-3">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold border border-[#e8e8e8] text-[#594047] hover:bg-[#f0edec] transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setIsDocModalOpen(false);
                  showToast('Corporate Brochure PDF downloaded to device!');
                }}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-[#b90064] text-white hover:bg-[#8e004b] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF (4.2 MB)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier RFQ & Direct Quote Modal (`rfq-modal`) */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#e8e8e8]">
            <div className="flex justify-between items-center p-5 border-b border-[#f0edec] bg-[#fcf9f8]">
              <div>
                <h3 className="font-bold text-lg text-[#1c1b1b]">Request Custom Quote &amp; Send Enquiry</h3>
                <p className="text-[12px] text-[#8c7077]">Direct inquiry to Aura Labs &amp; Manufacturing</p>
              </div>
              <button
                onClick={() => setIsRfqModalOpen(false)}
                className="p-1.5 text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRfqSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-bold text-[#1c1b1b]">Product Interest</label>
                  <select
                    value={rfqProductInterest}
                    onChange={(e) => setRfqProductInterest(e.target.value)}
                    className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                  >
                    <option>Skincare • Serum Base</option>
                    <option>Cosmetics • Foundation</option>
                    <option>Haircare • Treatment</option>
                    <option>Custom Formulation R&amp;D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-bold text-[#1c1b1b]">Estimated Order Volume</label>
                  <input
                    type="text"
                    required
                    value={rfqVolume}
                    onChange={(e) => setRfqVolume(e.target.value)}
                    placeholder="e.g., 10,000 units"
                    className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#1c1b1b]">Message &amp; Custom Requirements</label>
                <textarea
                  rows={4}
                  required
                  value={rfqMessage}
                  onChange={(e) => setRfqMessage(e.target.value)}
                  placeholder="Detail your target launch date, active ingredient preferences, packaging specifications, or target price..."
                  className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                />
              </div>

              {/* Multi-file Dropzone */}
              <div className="space-y-2">
                <label className="block text-[12px] font-bold text-[#1c1b1b]">Technical Artwork &amp; Specs</label>
                <div
                  onClick={() => {
                    setUploadedFile('custom_formula_brief_v1.pdf');
                    showToast('File custom_formula_brief_v1.pdf attached!');
                  }}
                  className="border-2 border-dashed border-[#e8e8e8] bg-[#fcf9f8] hover:bg-[#f0edec] transition-colors rounded-xl p-5 text-center cursor-pointer flex flex-col items-center"
                >
                  <UploadCloud className="w-8 h-8 text-[#b90064] mb-1.5" />
                  <div className="text-[13px] font-bold text-[#1c1b1b]">Click to upload or drag &amp; drop artwork</div>
                  <div className="text-[11.5px] text-[#8c7077] mt-0.5">
                    Technical specs, packaging artwork, or formula brief (PDF, PNG, JPG up to 10MB)
                  </div>
                </div>

                {/* Uploaded File Progress Bar */}
                {uploadedFile && (
                  <div className="bg-[#fdf8f8] border border-[#e8e8e8] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#fde7f3] flex items-center justify-center text-[#b90064] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[12px] font-bold text-[#1c1b1b]">{uploadedFile}</span>
                        <span className="text-[10px] font-bold text-[#00875a]">100% Uploaded</span>
                      </div>
                      <div className="w-full bg-[#e8e8e8] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#00875a] h-1.5 rounded-full w-full"></div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-[#00875a] shrink-0" />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#f0edec]">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold border border-[#e8e8e8] text-[#594047] hover:bg-[#f0edec]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-[#b90064] text-white hover:bg-[#8e004b] flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
