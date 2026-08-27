import React from 'react';
import { SlidersHorizontal, X, Check, ShieldCheck, Award, MapPin, Building2, Calendar, Package } from 'lucide-react';

export interface FilterPanelProps {
  categories: { name: string; subcategories: string[] }[];
  selectedCategories: string[];
  toggleCategory: (cat: string) => void;
  availableSubcategories: string[];
  selectedSubcategories: string[];
  toggleSubcategory: (sub: string) => void;
  // Multi-select Locations
  selectedLocations: string[];
  toggleLocation: (loc: string) => void;
  // Multi-select Certifications
  selectedCertifications: string[];
  toggleCertification: (cert: string) => void;
  // Multi-select MOQ Tiers
  selectedMoqTiers: string[];
  toggleMoqTier: (tier: string) => void;
  // Multi-select Established Years
  selectedEstablishedYears: string[];
  toggleEstablishedYear: (yearRange: string) => void;
  // Supplier Types
  selectedSupplierTypes: string[];
  toggleSupplierType: (type: string) => void;
  // Trust & Verification
  isGstOnly: boolean;
  setIsGstOnly: (val: boolean) => void;
  isNexoraVerifiedOnly: boolean;
  setIsNexoraVerifiedOnly: (val: boolean) => void;
  isBusinessVerifiedOnly: boolean;
  setIsBusinessVerifiedOnly: (val: boolean) => void;
  isExportReadyOnly: boolean;
  setIsExportReadyOnly: (val: boolean) => void;
  // Price Filter
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  onClearAll: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  selectedCategories,
  toggleCategory,
  availableSubcategories,
  selectedSubcategories,
  toggleSubcategory,
  selectedLocations,
  toggleLocation,
  selectedCertifications,
  toggleCertification,
  selectedMoqTiers,
  toggleMoqTier,
  selectedEstablishedYears,
  toggleEstablishedYear,
  selectedSupplierTypes,
  toggleSupplierType,
  isGstOnly,
  setIsGstOnly,
  isNexoraVerifiedOnly,
  setIsNexoraVerifiedOnly,
  isBusinessVerifiedOnly,
  setIsBusinessVerifiedOnly,
  isExportReadyOnly,
  setIsExportReadyOnly,
  maxPrice,
  setMaxPrice,
  onClearAll
}) => {
  const CERTIFICATION_OPTIONS = [
    { id: 'GMP', label: 'WHO-GMP Compliant', desc: 'Good Manufacturing Practice' },
    { id: 'ISO', label: 'ISO 9001 / ISO 22716', desc: 'Quality Management' },
    { id: 'Halal', label: 'Halal Certified', desc: 'Compliant Formulation' },
    { id: 'Organic', label: 'Organic / ECOCERT', desc: 'USDA / ECOCERT Certified' },
    { id: 'FDA', label: 'US-FDA Registered', desc: 'Drug Master File / Lab' },
    { id: 'Cruelty-Free', label: 'Cruelty-Free / Vegan', desc: 'Ethical Testing' }
  ];

  const LOCATION_OPTIONS = [
    { id: 'Maharashtra', label: 'Maharashtra (Mumbai, Pune)' },
    { id: 'Delhi NCR', label: 'Delhi NCR (Delhi, Gurugram)' },
    { id: 'Gujarat', label: 'Gujarat (Ahmedabad, Surat)' },
    { id: 'Karnataka', label: 'Karnataka (Bengaluru)' },
    { id: 'Tamil Nadu', label: 'Tamil Nadu (Chennai)' },
    { id: 'Telangana', label: 'Telangana (Hyderabad)' },
    { id: 'Pan India', label: 'Pan India / Other Hubs' }
  ];

  const MOQ_OPTIONS = [
    { id: 'lt_50', label: 'Low MOQ (< 50 units)' },
    { id: '50_200', label: '50 - 200 units' },
    { id: '200_500', label: '200 - 500 units' },
    { id: 'gt_500', label: '500+ units (Bulk Runs)' }
  ];

  const ESTABLISHED_OPTIONS = [
    { id: '15_plus', label: '15+ Years (Legacy & High Reliability)' },
    { id: '10_15', label: '10 - 15 Years (Established)' },
    { id: '5_10', label: '5 - 10 Years (Growth Stage)' },
    { id: 'lt_5', label: '< 5 Years (Emerging / Rapid Tech)' }
  ];

  return (
    <div className="flex flex-col gap-5 bg-white border border-[#E8DEEF] rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#6B2D8C]" />
          <h2 className="text-[15px] font-extrabold text-[#2A0E3F]">Filter Sourcing</h2>
        </div>
        <button 
          onClick={onClearAll}
          className="text-[11px] font-bold text-[#6B2D8C] hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Category</h3>
          {selectedCategories.length > 0 && (
            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
              {selectedCategories.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {categories.map((item) => {
            const isChecked = selectedCategories.includes(item.name);
            return (
              <label key={item.name} className="flex items-center justify-between cursor-pointer group select-none">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(item.name)}
                    className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
                  />
                  <span className={`text-[13px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
                    {item.name}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Subcategory Filter (Conditional) */}
      {availableSubcategories.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Subcategory</h3>
            {selectedSubcategories.length > 0 && (
              <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
                {selectedSubcategories.length}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {availableSubcategories.map((sub) => {
              const isChecked = selectedSubcategories.includes(sub);
              return (
                <label key={sub} className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSubcategory(sub)}
                    className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
                  />
                  <span className={`text-[12px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
                    {sub}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications (Multi-Select) */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#6B2D8C]" />
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Certifications</h3>
          </div>
          {selectedCertifications.length > 0 && (
            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
              {selectedCertifications.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {CERTIFICATION_OPTIONS.map((cert) => {
            const isChecked = selectedCertifications.includes(cert.id);
            return (
              <label key={cert.id} className="flex items-start gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCertification(cert.id)}
                  className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 mt-0.5 cursor-pointer accent-[#6B2D8C]"
                />
                <div className="flex flex-col">
                  <span className={`text-[12px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors leading-tight`}>
                    {cert.label}
                  </span>
                  <span className="text-[10px] text-[#7E6C96]">{cert.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Location / Region Filter (Multi-Select) */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#6B2D8C]" />
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Location / Region</h3>
          </div>
          {selectedLocations.length > 0 && (
            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
              {selectedLocations.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {LOCATION_OPTIONS.map((loc) => {
            const isChecked = selectedLocations.includes(loc.id);
            return (
              <label key={loc.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleLocation(loc.id)}
                  className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
                />
                <span className={`text-[12px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
                  {loc.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Minimum Order Quantity (MOQ) Filter (Multi-Select) */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#6B2D8C]" />
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Min. Order Quantity (MOQ)</h3>
          </div>
          {selectedMoqTiers.length > 0 && (
            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
              {selectedMoqTiers.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {MOQ_OPTIONS.map((tier) => {
            const isChecked = selectedMoqTiers.includes(tier.id);
            return (
              <label key={tier.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMoqTier(tier.id)}
                  className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
                />
                <span className={`text-[12px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
                  {tier.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Established Year / Experience Filter (Multi-Select) */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#6B2D8C]" />
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Established Year</h3>
          </div>
          {selectedEstablishedYears.length > 0 && (
            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
              {selectedEstablishedYears.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {ESTABLISHED_OPTIONS.map((yr) => {
            const isChecked = selectedEstablishedYears.includes(yr.id);
            return (
              <label key={yr.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleEstablishedYear(yr.id)}
                  className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
                />
                <span className={`text-[12px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
                  {yr.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Supplier Type */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#6B2D8C]" />
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Supplier Business Type</h3>
          </div>
          {selectedSupplierTypes.length > 0 && (
            <span className="text-[10px] bg-[#F5EEF8] text-[#6B2D8C] font-bold px-1.5 py-0.5 rounded-full">
              {selectedSupplierTypes.length}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {['Manufacturer', 'OEM / Private Label', 'Wholesaler', 'Distributor'].map((type) => {
            const isChecked = selectedSupplierTypes.includes(type);
            return (
              <label key={type} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSupplierType(type)}
                  className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
                />
                <span className={`text-[12px] ${isChecked ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
                  {type}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Verification & Trust */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6B2D8C]" />
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Trust &amp; Verification</h3>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isNexoraVerifiedOnly}
              onChange={(e) => setIsNexoraVerifiedOnly(e.target.checked)}
              className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
            />
            <span className={`text-[12px] ${isNexoraVerifiedOnly ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
              Nexora Verified
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isGstOnly}
              onChange={(e) => setIsGstOnly(e.target.checked)}
              className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
            />
            <span className={`text-[12px] ${isGstOnly ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
              GST Registered &amp; Verified
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isBusinessVerifiedOnly}
              onChange={(e) => setIsBusinessVerifiedOnly(e.target.checked)}
              className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
            />
            <span className={`text-[12px] ${isBusinessVerifiedOnly ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
              Business On-Site Audited
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isExportReadyOnly}
              onChange={(e) => setIsExportReadyOnly(e.target.checked)}
              className="rounded border-[#7E6C96] text-[#6B2D8C] focus:ring-[#C9A961]/30 w-4 h-4 cursor-pointer accent-[#6B2D8C]"
            />
            <span className={`text-[12px] ${isExportReadyOnly ? 'font-bold text-[#6B2D8C]' : 'text-[#2A0E3F]'} group-hover:text-[#6B2D8C] transition-colors`}>
              Export Ready (AEO / Port Dock)
            </span>
          </label>
        </div>
      </div>

      {/* Price Slider */}
      <div className="flex flex-col gap-2.5 border-t border-[#F4F0E9] pt-3.5 mb-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#5B4A6E]">Max Unit Price</h3>
          <span className="text-[12px] font-bold text-[#6B2D8C]">₹{maxPrice >= 5000 ? '5,000+' : maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min="50"
          max="5000"
          step="50"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#6B2D8C] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-medium text-[#7E6C96]">
          <span>₹50</span>
          <span>₹5,000+</span>
        </div>
      </div>
    </div>
  );
};
