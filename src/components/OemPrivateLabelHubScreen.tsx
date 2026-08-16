import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Award,
  Clock,
  Package,
  ArrowRight,
  ArrowLeft,
  Video,
  Play,
  RotateCcw,
  Check,
  Plus,
  Send,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Sliders,
  TrendingUp,
  FlaskConical,
  Palette,
  Leaf,
  Layers,
  FileCheck2,
  Download,
  Info,
  X
} from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/mockData';
import { VerifiedSupplier } from '../types';

interface OemPrivateLabelHubScreenProps {
  onOpenRFQModal: () => void;
  onOpenEnquiryModal: (item: any) => void;
  onOpenFacilityTour?: (supplier?: VerifiedSupplier) => void;
  onNavigateToSuppliers?: () => void;
}

export const OemPrivateLabelHubScreen: React.FC<OemPrivateLabelHubScreenProps> = ({
  onOpenRFQModal,
  onOpenEnquiryModal,
  onOpenFacilityTour,
  onNavigateToSuppliers
}) => {
  // Step Wizard State (Steps 1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBase, setSelectedBase] = useState<string>('Skincare Bases');
  const [selectedActives, setSelectedActives] = useState<string[]>(['Hyaluronic Acid (Multi-Molecular)', 'Niacinamide 10%']);
  const [selectedPackaging, setSelectedPackaging] = useState<string>('Glass Dropper Bottle (Frosted 30ml)');

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHubs, setSelectedHubs] = useState<string[]>(['India', 'South Korea']);
  const [selectedCerts, setSelectedCerts] = useState<string[]>(['ISO 22716', 'GMP Certified']);
  const [moqValue, setMoqValue] = useState<number>(1000);
  const [leadTimeValue, setLeadTimeValue] = useState<number>(6);

  // Comparison Tray
  const [selectedOemIds, setSelectedOemIds] = useState<string[]>(['sup-1']);

  // Modals
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [sampleTargetOem, setSampleTargetOem] = useState<any | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleHub = (hub: string) => {
    setSelectedHubs((prev) =>
      prev.includes(hub) ? prev.filter((h) => h !== hub) : [...prev, hub]
    );
  };

  const handleToggleCert = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleToggleActive = (activeName: string) => {
    setSelectedActives((prev) =>
      prev.includes(activeName)
        ? prev.filter((a) => a !== activeName)
        : [...prev, activeName]
    );
  };

  const handleToggleOemSelection = (oemId: string) => {
    setSelectedOemIds((prev) => {
      if (prev.includes(oemId)) {
        return prev.filter((id) => id !== oemId);
      }
      if (prev.length >= 3) {
        showToast('Maximum 3 OEMs can be selected for comparison');
        return prev;
      }
      return [...prev, oemId];
    });
  };

  const handleOpenSampleModal = (oem?: any) => {
    setSampleTargetOem(oem || VERIFIED_SUPPLIERS[0]);
    setIsSampleModalOpen(true);
  };

  const handleSampleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSampleModalOpen(false);
    showToast(`R&D Sample Kit ordered from ${sampleTargetOem?.name || 'Aura Beauty Labs'}! Dispatch tracking sent to email.`);
  };

  // Demand Feed Ticker Data
  const demandFeed = [
    { brand: 'New York Beauty Lab', item: '5,000 Units • Hyaluronic Acid 2% Serum Base', status: 'RFP Active', region: 'USA' },
    { brand: 'London Retail Group', item: '10,000 Units • Botanical Gel Cleanser OEM', status: 'Bidding Open', region: 'UK' },
    { brand: 'LA Clean Startup', item: '2,000 Units • Vegan Overnight Lip Sleeping Mask', status: 'Sample Phase', region: 'USA' },
    { brand: 'Mumbai Luxury Care', item: '15,000 Units • Vitamin C Radiance Cream', status: 'RFQ Open', region: 'India' },
  ];

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] pb-24 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#1c1b1b] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#00875a]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8 space-y-12">
        
        {/* Section 1: Hero Section */}
        <section className="relative rounded-3xl overflow-hidden min-h-[380px] flex items-center bg-[#fcf9f8] text-[#1c1b1b] shadow-xs border border-[#e8e8e8]">
          <div className="absolute inset-0 z-0 flex justify-end">
            <img
              src="https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1200&q=80"
              alt="Pristine Cosmetics R&D Laboratory"
              className="w-full md:w-3/5 h-full object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#fcf9f8] via-[#fcf9f8]/90 md:via-[#fcf9f8]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 p-8 md:p-12 max-w-2xl space-y-5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1c1b1b] tracking-tight leading-tight">
              Custom Formulation &amp; Contract Manufacturing Hub
            </h1>

            <p className="text-[14.5px] text-[#594047] leading-relaxed font-medium">
              Partner with certified OEMs and premier R&amp;D labs to bring your luxury beauty concepts to life with precision and scale.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onOpenRFQModal}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13.5px] px-6 py-3 rounded-xl transition-all shadow-xs active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <span>Submit RFQ</span>
              </button>

              <button
                onClick={() => onNavigateToSuppliers ? onNavigateToSuppliers() : null}
                className="bg-white hover:bg-[#f1edec] border border-[#e8e8e8] text-[#1c1b1b] font-bold text-[13.5px] px-6 py-3 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <span>Browse White Label</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Recent Sourcing Demand */}
        <section className="bg-[#f7f2f2] rounded-xl p-4 border border-[#e8e8e8]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4.5 h-4.5 text-[#b90064]" />
            <h3 className="text-[15px] font-bold text-[#1c1b1b]">
              Recent Sourcing Demand
            </h3>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-1 hide-scrollbar">
            {[
              { brand: 'New York Brand', item: '5k Hyaluronic Serums', status: 'Active' },
              { brand: 'London Retailer', item: '10k Clean Cleansers', status: 'Active' },
              { brand: 'LA Startup', item: '2k Vegan Lip Masks', status: 'Active' },
              { brand: 'Mumbai Beauty', item: '15k Vitamin C Creams', status: 'Active' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="min-w-[280px] bg-white rounded-lg p-3 border border-[#e8e8e8] shadow-2xs flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] font-bold text-[#b90064] mb-0.5">
                    {item.brand}
                  </p>
                  <p className="text-[13px] font-medium text-[#1c1b1b]">
                    {item.item}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#594047] bg-[#f0edec] px-2.5 py-1 rounded-md">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Interactive R&D Builder */}
        <section className="bg-white rounded-2xl border border-[#e8e8e8] p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1c1b1b]">Interactive R&amp;D Builder</h2>
            <span className="text-[12px] font-medium text-[#594047] bg-[#f1edec] px-3 py-1 rounded-full">
              Step {currentStep} of 4
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="flex gap-4 mb-8">
            {[
              { num: 1, title: '1. Base', desc: 'Select Formula' },
              { num: 2, title: '2. Actives', desc: 'Add Ingredients' },
              { num: 3, title: '3. Packaging', desc: 'Choose Vessel' },
              { num: 4, title: '4. Sample', desc: 'Request Kit' }
            ].map((st) => (
              <div
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer ${
                  currentStep === st.num
                    ? 'border-[#b90064]'
                    : 'border-[#e8e8e8] opacity-60'
                }`}
              >
                <span
                  className={`text-[13px] font-bold block mb-0.5 ${
                    currentStep === st.num ? 'text-[#b90064]' : 'text-[#1c1b1b]'
                  }`}
                >
                  {st.title}
                </span>
                <span className="text-[11px] text-[#594047] font-medium">{st.desc}</span>
              </div>
            ))}
          </div>

          {/* Step 1 Content */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                onClick={() => setSelectedBase('Skincare Bases')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedBase === 'Skincare Bases'
                    ? 'border-[#b90064] bg-[#fde7f3]'
                    : 'border-[#e8e8e8] bg-white hover:bg-[#fcf9f8]'
                }`}
              >
                <div className="h-28 bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-[#e8e8e8]">
                  <img
                    alt="Skincare Serum"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80"
                  />
                </div>
                <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-0.5">Skincare Bases</h3>
                <p className="text-[12px] font-medium text-[#594047]">Serums, Creams</p>
              </div>

              <div
                onClick={() => setSelectedBase('Haircare Systems')}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedBase === 'Haircare Systems'
                    ? 'border-2 border-[#b90064] bg-[#fde7f3]'
                    : 'border-[#e8e8e8] bg-white hover:bg-[#fcf9f8]'
                }`}
              >
                <div className="h-28 bg-[#f1edec] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <img
                    alt="Haircare Product"
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=500&q=80"
                  />
                </div>
                <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-0.5">Haircare Systems</h3>
                <p className="text-[12px] font-medium text-[#594047]">Masks, Shampoos</p>
              </div>

              <div
                onClick={() => setSelectedBase('Color Cosmetics')}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedBase === 'Color Cosmetics'
                    ? 'border-2 border-[#b90064] bg-[#fde7f3]'
                    : 'border-[#e8e8e8] bg-[#fcf9f8] hover:bg-[#f1edec]'
                }`}
              >
                <div className="h-28 bg-[#f1edec] rounded-lg mb-3 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-[#8c7077]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-0.5">Color Cosmetics</h3>
                <p className="text-[12px] font-medium text-[#594047]">Foundations, Lips</p>
              </div>

              <div
                onClick={() => setSelectedBase('Clean Beauty')}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedBase === 'Clean Beauty'
                    ? 'border-2 border-[#b90064] bg-[#fde7f3]'
                    : 'border-[#e8e8e8] bg-[#fcf9f8] hover:bg-[#f1edec]'
                }`}
              >
                <div className="h-28 bg-[#f1edec] rounded-lg mb-3 flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-[#8c7077]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1c1b1b] mb-0.5">Clean Beauty</h3>
                <p className="text-[12px] font-medium text-[#594047]">Vegan, Organic</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-[13px] font-medium text-[#594047]">
                Select key active ingredients for your <span className="font-bold text-[#b90064]">{selectedBase}</span> formula:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  'Hyaluronic Acid (Multi-Molecular)',
                  'Niacinamide 10% (Vitamin B3)',
                  'Bakuchiol Phytinol (Retinol Alt)',
                  'Tri-Peptide Complex (Anti-Aging)',
                  'Ceramides AP/NP (Barrier Repair)',
                  'Centella Asiatica (Cica Extract)',
                  'Stabilized Vitamin C 15% (EAA)',
                  'Salicylic Acid 2% (BHA Exfoliant)'
                ].map((active) => {
                  const isSelected = selectedActives.includes(active);
                  return (
                    <button
                      key={active}
                      onClick={() => handleToggleActive(active)}
                      className={`p-3 rounded-xl border text-left text-[12px] font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-[#b90064] bg-[#fde7f3] text-[#b90064] shadow-2xs'
                          : 'border-[#e8e8e8] bg-[#fcf9f8] text-[#1c1b1b] hover:border-[#b90064]'
                      }`}
                    >
                      <span className="truncate">{active}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#b90064] shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#8c7077] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {[
                { title: 'Glass Dropper Bottle (Frosted 30ml)', moq: '500 units', lead: '10 Days' },
                { title: 'Airless Vacuum Pump Bottle (50ml)', moq: '1,000 units', lead: '14 Days' },
                { title: 'Sustainable Post-Consumer PCR Tube', moq: '2,500 units', lead: '21 Days' }
              ].map((vessel, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPackaging(vessel.title)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    selectedPackaging === vessel.title
                      ? 'border-2 border-[#b90064] bg-[#fde7f3]/40 shadow-xs'
                      : 'border-[#e8e8e8] bg-[#fcf9f8] hover:border-[#b90064]'
                  }`}
                >
                  <Package className="w-6 h-6 text-[#b90064] mb-3" />
                  <h4 className="text-[14px] font-bold text-[#1c1b1b]">{vessel.title}</h4>
                  <div className="mt-2 text-[11.5px] text-[#594047] space-y-0.5 font-medium">
                    <p>Sample MOQ: {vessel.moq}</p>
                    <p>Dispatch Lead: {vessel.lead}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-[#fcf9f8] rounded-2xl p-6 border border-[#e8e8e8] space-y-4 animate-in fade-in duration-300">
              <h4 className="text-[16px] font-bold text-[#1c1b1b]">
                Review Your R&amp;D Formulation Brief
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#e8e8e8]">
                <div>
                  <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block">Selected Base</span>
                  <span className="text-[13px] font-bold text-[#b90064]">{selectedBase}</span>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block">Active Actives</span>
                  <span className="text-[13px] font-bold text-[#1c1b1b]">{selectedActives.join(', ') || 'Custom blend'}</span>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block">Packaging Vessel</span>
                  <span className="text-[13px] font-bold text-[#1c1b1b]">{selectedPackaging}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => handleOpenSampleModal()}
                  className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Request Sample Formulation Kit ($150)</span>
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-[#f0edec] flex justify-between items-center">
            <button
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl text-[12.5px] font-bold border border-[#e8e8e8] text-[#594047] disabled:opacity-40 hover:bg-[#f0edec] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="px-5 py-2 rounded-xl text-[12.5px] font-bold bg-[#b90064] text-white hover:bg-[#8e004b] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>{currentStep === 4 ? 'Complete R&D Brief' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Section 4: Main OEM Marketplace & Sidebar Filters */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sticky Filter Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-28 bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0edec]">
              <h3 className="text-[15px] font-bold text-[#1c1b1b] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#b90064]" />
                <span>Filter OEM Partners</span>
              </h3>
              <button
                onClick={() => {
                  setSelectedHubs([]);
                  setSelectedCerts([]);
                  setMoqValue(1000);
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-[#b90064] hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Global Hubs */}
            <div>
              <h4 className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider mb-3">
                Global Manufacturing Hubs
              </h4>
              <div className="space-y-2">
                {['India', 'South Korea', 'Italy', 'USA', 'France'].map((hub) => (
                  <label key={hub} className="flex items-center gap-2.5 cursor-pointer text-[13px] font-medium text-[#1c1b1b]">
                    <input
                      type="checkbox"
                      checked={selectedHubs.includes(hub)}
                      onChange={() => handleToggleHub(hub)}
                      className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer"
                    />
                    <span>{hub}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#f0edec]" />

            {/* Certifications */}
            <div>
              <h4 className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider mb-3">
                Accreditations
              </h4>
              <div className="space-y-2">
                {['ISO 22716', 'GMP Certified', 'US FDA Registered', 'EcoCert'].map((cert) => (
                  <label key={cert} className="flex items-center gap-2.5 cursor-pointer text-[13px] font-medium text-[#1c1b1b]">
                    <input
                      type="checkbox"
                      checked={selectedCerts.includes(cert)}
                      onChange={() => handleToggleCert(cert)}
                      className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer"
                    />
                    <span>{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#f0edec]" />

            {/* Minimum Order Quantity (MOQ) Slider */}
            <div>
              <div className="flex justify-between text-[12px] font-bold mb-2">
                <span className="text-[#8c7077]">Max MOQ:</span>
                <span className="text-[#b90064]">{moqValue.toLocaleString()} units</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="500"
                value={moqValue}
                onChange={(e) => setMoqValue(Number(e.target.value))}
                className="w-full h-2 bg-[#f0edec] rounded-lg appearance-none cursor-pointer accent-[#b90064]"
              />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* Header & Technical Compliance Hub Link */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#e8e8e8] shadow-2xs">
              <div>
                <h2 className="text-xl font-bold text-[#1c1b1b]">
                  Verified OEM Manufacturing Partners
                </h2>
                <p className="text-[12.5px] text-[#594047] font-medium">
                  Showing certified manufacturers matching your sourcing criteria
                </p>
              </div>

              <button
                onClick={onOpenRFQModal}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Technical Compliance Hub</span>
              </button>
            </div>

            {/* OEM Cards List */}
            <div className="space-y-6">
              {VERIFIED_SUPPLIERS.map((oem) => {
                const isSelectedForCompare = selectedOemIds.includes(oem.id);
                return (
                  <div
                    key={oem.id}
                    className="bg-white border border-[#e8e8e8] hover:border-[#b90064] rounded-2xl p-6 transition-all shadow-2xs hover:shadow-md relative flex flex-col md:flex-row gap-6"
                  >
                    {/* Checkbox for compare */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white border border-[#e8e8e8] rounded-md p-1 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={isSelectedForCompare}
                        onChange={() => handleToggleOemSelection(oem.id)}
                        className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {/* Left Thumbnail & Video Gallery */}
                    <div className="w-full md:w-64 shrink-0 space-y-2">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden relative border border-[#e8e8e8] bg-[#f0edec] group">
                        <img
                          src={oem.portfolioProducts?.[0]?.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80'}
                          alt={oem.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 bg-[#b90064] text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                          {oem.verificationBadge}
                        </span>

                        <button
                          onClick={() => onOpenFacilityTour && onOpenFacilityTour(oem)}
                          className="absolute bottom-2 left-2 bg-black/80 hover:bg-[#b90064] text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Watch Factory Video (1:45)</span>
                        </button>
                      </div>

                      {/* 4 Thumbnails */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="aspect-square rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f0edec]">
                          <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=80" alt="R&D Lab" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f0edec]">
                          <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=200&q=80" alt="Cleanroom" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f0edec]">
                          <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80" alt="Serum Sample" className="w-full h-full object-cover" />
                        </div>
                        <div className="aspect-square rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f0edec]">
                          <img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80" alt="Packaging" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Right OEM Specifications & Actions */}
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start mb-2 pl-6 md:pl-0">
                          <div>
                            <h3 className="text-xl font-bold text-[#1c1b1b] flex items-center gap-2">
                              <span>{oem.name}</span>
                              <ShieldCheck className="w-4 h-4 text-[#00875a]" />
                            </h3>
                            <p className="text-[12.5px] text-[#8c7077] font-medium">
                              {oem.city}, {oem.state} • {oem.type}
                            </p>
                          </div>

                          <span className="text-[10px] font-bold bg-[#e6f4ea] text-[#00875a] px-2.5 py-1 rounded-full border border-[#00875a]/20">
                            High Capacity Facility
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {oem.categories.map((c, i) => (
                            <span key={i} className="text-[10.5px] font-semibold bg-[#fcf9f8] text-[#594047] border border-[#e8e8e8] px-2.5 py-0.5 rounded">
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
                          <div>
                            <span className="text-[10px] font-bold text-[#8c7077] uppercase block">MOQ</span>
                            <span className="font-bold text-[#1c1b1b]">{oem.moq}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#8c7077] uppercase block">Lead Time</span>
                            <span className="font-bold text-[#1c1b1b]">4–6 Weeks</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#8c7077] uppercase block">Monthly Output</span>
                            <span className="font-bold text-[#1c1b1b]">1.2M Units</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#8c7077] uppercase block">Next Slot</span>
                            <span className="font-bold text-[#b90064]">Oct 15, 2026</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Cost & CTAs */}
                      <div className="pt-3 border-t border-[#f0edec] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <p className="text-[12.5px] font-medium text-[#8c7077]">
                          Est. Unit Cost: <span className="text-[15px] font-extrabold text-[#1c1b1b]">$2.50 – $4.00 / unit</span>
                        </p>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            onClick={() => handleOpenSampleModal(oem)}
                            className="flex-1 sm:flex-none border border-[#e8e8e8] hover:border-[#b90064] text-[#b90064] hover:bg-[#fde7f3] text-[12.5px] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Request Sample Kit
                          </button>

                          <button
                            onClick={() => onOpenEnquiryModal(oem)}
                            className="flex-1 sm:flex-none bg-[#b90064] hover:bg-[#8e004b] text-white text-[12.5px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            Request Quote
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Skeleton State Example matching mockup */}
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 flex flex-col md:flex-row gap-6 animate-pulse opacity-60">
                <div className="w-full md:w-64 h-48 bg-[#f1edec] rounded-xl shrink-0"></div>
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-48 h-6 bg-[#f1edec] rounded-md"></div>
                    <div className="w-32 h-4 bg-[#f1edec] rounded-md"></div>
                    <div className="flex gap-2">
                      <div className="w-20 h-6 bg-[#f1edec] rounded-full"></div>
                      <div className="w-20 h-6 bg-[#f1edec] rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="w-full h-10 bg-[#f1edec] rounded-xl"></div>
                      <div className="w-full h-10 bg-[#f1edec] rounded-xl"></div>
                      <div className="w-full h-10 bg-[#f1edec] rounded-xl"></div>
                      <div className="w-full h-10 bg-[#f1edec] rounded-xl"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-3 border-t border-[#f0edec]">
                    <div className="w-32 h-10 bg-[#f1edec] rounded-xl"></div>
                    <div className="w-32 h-10 bg-[#f1edec] rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Floating Bulk RFQ Comparison Tray */}
      {selectedOemIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1c1b1b] text-white p-4 shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom-5">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 px-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#b90064] text-white font-extrabold flex items-center justify-center text-[12px]">
                {selectedOemIds.length}
              </span>
              <div>
                <p className="text-[13px] font-bold leading-tight">
                  {selectedOemIds.length} OEM Manufacturer{selectedOemIds.length > 1 ? 's' : ''} Selected
                </p>
                <p className="text-[11px] text-white/70">Select up to 3 for side-by-side spec comparison or broadcast RFQ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedOemIds([])}
                className="text-[12px] font-bold text-white/70 hover:text-white px-3 py-1.5"
              >
                Clear
              </button>

              <button
                onClick={onOpenRFQModal}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] px-5 py-2 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <span>Broadcast Bulk RFQ ({selectedOemIds.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Kit Request Modal */}
      {isSampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#e8e8e8]">
            <div className="p-5 border-b border-[#f0edec] bg-[#fcf9f8] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[17px] text-[#1c1b1b]">
                  Order R&amp;D Sample Formulation Kit
                </h3>
                <p className="text-[12px] text-[#8c7077]">
                  Supplier: {sampleTargetOem?.name || 'Aura Beauty Labs'}
                </p>
              </div>
              <button
                onClick={() => setIsSampleModalOpen(false)}
                className="p-1.5 text-[#8c7077] hover:text-[#1c1b1b] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSampleSubmit} className="p-6 space-y-4">
              <div className="bg-[#fde7f3] border border-[#b90064]/20 p-3.5 rounded-xl text-[12px] text-[#b90064] font-medium leading-relaxed">
                ✨ $150 kit fee is 100% credited back toward your first full commercial production order.
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">Target Formula Specs</label>
                <input
                  type="text"
                  defaultValue={`${selectedBase} with ${selectedActives.join(', ')}`}
                  required
                  className="w-full rounded-xl border border-[#e8e8e8] bg-[#fcf9f8] p-2.5 text-[13px] font-medium"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter business delivery address for sample dispatch"
                  className="w-full rounded-xl border border-[#e8e8e8] bg-[#fcf9f8] p-2.5 text-[13px] font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSampleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-[12.5px] font-bold border border-[#e8e8e8] text-[#594047]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-[12.5px] font-bold bg-[#b90064] text-white hover:bg-[#8e004b] transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Sample Order ($150)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
