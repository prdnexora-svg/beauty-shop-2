import React, { useState } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  Award,
  Factory,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  MessageSquare,
  FileText,
  Phone,
  Layers,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface FacilityFormulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName?: string;
  supplierLocation?: string;
  certifications?: string[];
  onOpenRFQModal?: () => void;
  onOpenChat?: (supplier: { id: string; name: string; location: string; isVerified: boolean }) => void;
}

const DEMO_FACILITY_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1200&q=80',
    title: 'Class 100,000 ISO Cleanroom Formulation Facility',
    category: 'Manufacturing Plant',
    description: 'HEPA-filtered climate controlled cleanroom environment equipped with automated vacuum emulsifiers and triple-stage reverse osmosis water purification.'
  },
  {
    url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
    title: 'Cosmeceutical R&D Analytical Testing Laboratory',
    category: 'R&D Laboratory',
    description: 'In-house HPLC, rheology, viscosity, and microbial stability testing suite managed by senior cosmetic chemists.'
  },
  {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
    title: 'High-Speed Automated Bottle & Dropper Filling Line',
    category: 'Packaging Automation',
    description: 'Fully automatic servo-driven liquid filling and capping machinery supporting glass droppers, airless pumps, and aluminum tubes.'
  },
  {
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    title: 'Bulk Batch Synthesis & High-Shear Emulsification Units',
    category: 'Bulk Production',
    description: 'Stainless steel 316L jackets tanks with variable speed homogenizers capable of 500 kg to 3,000 kg single-batch output.'
  }
];

const FORMULATION_SPECS = [
  { label: 'Standard Formulations Available', value: '450+ Tested Products' },
  { label: 'R&D Formulation Lead Time', value: '5-7 Business Days' },
  { label: 'Batch Capacity', value: '100 kg to 5,000 kg / batch' },
  { label: 'Quality Certifications', value: 'GMP (WHO-cGMP), ISO 22716, US-FDA' },
  { label: 'Stability & Accelerated Testing', value: 'Included (45°C / 75% RH 3 Months)' },
  { label: 'Packaging Compatibility', value: 'Airless, Glass, Bio-Plastics, Aluminum' }
];

export const FacilityFormulationModal: React.FC<FacilityFormulationModalProps> = ({
  isOpen,
  onClose,
  supplierName = 'Nexora Verified OEM Manufacturing Plant',
  supplierLocation = 'Baddi Industrial Zone, Himachal Pradesh',
  certifications = ['WHO-GMP', 'ISO 9001:2015', 'US-FDA Registered', 'AYUSH Certified'],
  onOpenRFQModal,
  onOpenChat
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'photos' | 'certs' | 'formulations'>('photos');
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  const currentPhoto = DEMO_FACILITY_PHOTOS[activePhotoIdx];

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev < DEMO_FACILITY_PHOTOS.length - 1 ? prev + 1 : 0));
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : DEMO_FACILITY_PHOTOS.length - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-[#E8DEEF] w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#2A0E3F] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C9A961] border border-white/20">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">{supplierName}</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Audited Facility
                </span>
              </div>
              <p className="text-xs text-[#D9C3E8] flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-[#C9A961]" />
                <span>{supplierLocation}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Lightbox Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-[#E8DEEF] bg-[#FDFBF7] px-6 gap-6 text-xs font-bold text-[#5B4A6E] shrink-0">
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'border-[#6B2D8C] text-[#6B2D8C] font-extrabold'
                : 'border-transparent hover:text-[#2A0E3F]'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Facility &amp; Cleanroom Photos ({DEMO_FACILITY_PHOTOS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('formulations')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'formulations'
                ? 'border-[#6B2D8C] text-[#6B2D8C] font-extrabold'
                : 'border-transparent hover:text-[#2A0E3F]'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Formulation &amp; R&amp;D Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('certs')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'certs'
                ? 'border-[#6B2D8C] text-[#6B2D8C] font-extrabold'
                : 'border-transparent hover:text-[#2A0E3F]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>GMP &amp; ISO Certifications ({certifications.length})</span>
          </button>
        </div>

        {/* Main Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Primary Photo Viewer with Controls */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 aspect-video group shadow-md border border-zinc-800">
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.title}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />

                {/* Image Overlay Header */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                    {currentPhoto.category} ({activePhotoIdx + 1} / {DEMO_FACILITY_PHOTOS.length})
                  </span>
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                    title={isZoomed ? 'Zoom Out' : 'Zoom In'}
                  >
                    {isZoomed ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Left / Right Arrow Controls */}
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-xs transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-xs transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Caption Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white">
                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C9A961]" />
                    {currentPhoto.title}
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
                    {currentPhoto.description}
                  </p>
                </div>
              </div>

              {/* Thumbnails Strip */}
              <div className="grid grid-cols-4 gap-3">
                {DEMO_FACILITY_PHOTOS.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActivePhotoIdx(idx);
                      setIsZoomed(false);
                    }}
                    className={`rounded-xl overflow-hidden border-2 aspect-video transition-all cursor-pointer relative ${
                      activePhotoIdx === idx
                        ? 'border-[#6B2D8C] ring-2 ring-[#6B2D8C]/20 shadow-md scale-[1.02]'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                    {activePhotoIdx === idx && (
                      <div className="absolute inset-0 bg-[#6B2D8C]/15 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white bg-[#6B2D8C] rounded-full p-0.5 shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'formulations' && (
            <div className="space-y-6">
              <div className="bg-[#FDFBF7] p-5 rounded-xl border border-[#E8DEEF]">
                <h4 className="text-sm font-extrabold text-[#2A0E3F] mb-3 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#6B2D8C]" />
                  Custom Formulation &amp; R&amp;D Technical Capabilities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {FORMULATION_SPECS.map((spec, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-[#E8DEEF]">
                      <span className="text-gray-400 block text-[10.5px] font-bold uppercase tracking-wider">
                        {spec.label}
                      </span>
                      <span className="font-extrabold text-[#2A0E3F] text-xs mt-0.5 block">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="font-extrabold text-purple-900 block mb-1">Peptides &amp; Actives</span>
                  <p className="text-purple-700 text-[11px]">
                    Stabilized Vitamin C (THD Ascorbate, MAP), Niacinamide 10%, Hyaluronic Acid (Multi-molecular).
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="font-extrabold text-emerald-900 block mb-1">Clean Beauty Standard</span>
                  <p className="text-emerald-700 text-[11px]">
                    Paraben-free, Sulfate-free, Mineral Oil-free, Vegan &amp; Cruelty-Free certified formulations.
                  </p>
                </div>
                <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E8DEEF]">
                  <span className="font-extrabold text-[#2A0E3F] block mb-1">Microbial Challenge Test</span>
                  <p className="text-[#5B4A6E] text-[11px]">
                    PET (Preservative Efficacy Testing) compliant with USP &lt;51&gt; and European Pharmacopoeia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certs' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950">
                    Third-Party Audited &amp; Verified Manufacturing Unit
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    All compliance certificates have been verified by Nexora Quality Audit team against official state licensing databases.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#E8DEEF] bg-white flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F5EEF8] border border-[#D9C3E8] flex items-center justify-center text-[#6B2D8C]">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-[#2A0E3F] text-xs">{cert}</h5>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Active &amp; Verified
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      CERT-{202600 + idx}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-[#FDFBF7] border-t border-[#E8DEEF] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#5B4A6E] font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C9A961]" />
            Request sample kit directly or start an RFQ with plant specs pre-attached
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onOpenChat && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChat({
                    id: 'sup-facility-1',
                    name: supplierName,
                    location: supplierLocation,
                    isVerified: true
                  });
                }}
                className="px-4 py-2.5 rounded-xl border border-[#6B2D8C] text-[#6B2D8C] font-extrabold text-xs hover:bg-[#F5EEF8] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with R&amp;D Head</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenRFQModal?.();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Request Custom Formulation Quote</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
