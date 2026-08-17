import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface FilterPanelProps {
  categories: { name: string; subcategories: string[] }[];
  selectedCategories: string[];
  toggleCategory: (cat: string) => void;
  availableSubcategories: string[];
  selectedSubcategories: string[];
  toggleSubcategory: (sub: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  setLocationQuery: (q: string) => void;
  selectedDistance: string;
  setSelectedDistance: (dist: string) => void;
  selectedSupplierTypes: string[];
  toggleSupplierType: (type: string) => void;
  selectedMoqTier: string;
  setSelectedMoqTier: (tier: any) => void;
  isGstOnly: boolean;
  setIsGstOnly: (val: boolean) => void;
  isNexoraVerifiedOnly: boolean;
  setIsNexoraVerifiedOnly: (val: boolean) => void;
  isBusinessVerifiedOnly: boolean;
  setIsBusinessVerifiedOnly: (val: boolean) => void;
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
  selectedLocation,
  setSelectedLocation,
  setLocationQuery,
  selectedDistance,
  setSelectedDistance,
  selectedSupplierTypes,
  toggleSupplierType,
  selectedMoqTier,
  setSelectedMoqTier,
  isGstOnly,
  setIsGstOnly,
  isNexoraVerifiedOnly,
  setIsNexoraVerifiedOnly,
  isBusinessVerifiedOnly,
  setIsBusinessVerifiedOnly,
  maxPrice,
  setMaxPrice,
  onClearAll
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1c1b1b]">Filters</h2>
        <button 
          onClick={onClearAll}
          className="text-[12px] font-bold text-[#b90064] hover:underline"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Category</h3>
        <div className="flex flex-col gap-2.5">
          {categories.map((item) => (
            <label key={item.name} className="flex items-center justify-between cursor-pointer group select-none">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(item.name)}
                  onChange={() => toggleCategory(item.name)}
                  className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                />
                <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                  {item.name}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategory Filter (Conditional) */}
      {availableSubcategories.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Subcategory</h3>
          <div className="flex flex-col gap-2.5">
            {availableSubcategories.map((sub) => (
              <label key={sub} className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={selectedSubcategories.includes(sub)}
                  onChange={() => toggleSubcategory(sub)}
                  className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                />
                <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                  {sub}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Location Filter */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Location</h3>
        <div className="flex flex-col gap-2">
          {[
            { id: 'All', label: 'All India' },
            { id: 'Mumbai', label: 'Mumbai' },
            { id: 'Delhi', label: 'Delhi' },
            { id: 'Bengaluru', label: 'Bengaluru' },
            { id: 'Ahmedabad', label: 'Ahmedabad' },
            { id: 'Surat', label: 'Surat' },
            { id: 'Hyderabad', label: 'Hyderabad' },
            { id: 'Chennai', label: 'Chennai' },
            { id: 'Pune', label: 'Pune' }
          ].map((loc) => (
            <label key={loc.id} className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="radio"
                name="location-filter"
                checked={selectedLocation === loc.id}
                onChange={() => {
                  setSelectedLocation(loc.id);
                  setLocationQuery(loc.label);
                }}
                className="border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
              />
              <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                {loc.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Distance Filter */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Service Region</h3>
        <div className="flex flex-col gap-2">
          {[
            { id: 'Local', label: 'Local' },
            { id: 'Within 100 km', label: 'Within 100 km' },
            { id: 'Within 250 km', label: 'Within 250 km' },
            { id: 'Within 500 km', label: 'Within 500 km' },
            { id: 'Pan India', label: 'Pan India' }
          ].map((dist) => (
            <label key={dist.id} className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="radio"
                name="distance-filter"
                checked={selectedDistance === dist.id}
                onChange={() => setSelectedDistance(dist.id)}
                className="border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
              />
              <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                {dist.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Supplier Type */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Supplier Type</h3>
        <div className="flex flex-col gap-2.5">
          {['Manufacturer', 'Wholesaler', 'Distributor', 'OEM / Private Label'].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={selectedSupplierTypes.includes(type)}
                onChange={() => toggleSupplierType(type)}
                className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
              />
              <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Verification */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Verification</h3>
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isNexoraVerifiedOnly}
              onChange={(e) => setIsNexoraVerifiedOnly(e.target.checked)}
              className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
            />
            <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
              Nexora Verified
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isGstOnly}
              onChange={(e) => setIsGstOnly(e.target.checked)}
              className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
            />
            <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
              GST Verified
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={isBusinessVerifiedOnly}
              onChange={(e) => setIsBusinessVerifiedOnly(e.target.checked)}
              className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
            />
            <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
              Business Verified
            </span>
          </label>
        </div>
      </div>

      {/* MOQ Filter */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">MOQ Range</h3>
        <div className="flex flex-col gap-2.5">
          {[
            { id: 'all', label: 'All MOQs' },
            { id: 'lt_100', label: '< 100 units' },
            { id: '100_500', label: '100 - 500 units' },
            { id: 'gt_500', label: '500+ units' }
          ].map((tier) => (
            <label key={tier.id} className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="radio"
                name="moq-filter"
                checked={selectedMoqTier === tier.id}
                onChange={() => setSelectedMoqTier(tier.id as any)}
                className="border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
              />
              <span className="text-[13px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                {tier.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Slider */}
      <div className="flex flex-col gap-3 border-t border-[#e8e8e8] pt-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#594047]">Max Price</h3>
          <span className="text-[12px] font-bold text-[#b90064]">₹{maxPrice >= 5000 ? '5,000+' : maxPrice}</span>
        </div>
        <input
          type="range"
          min="50"
          max="5000"
          step="50"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#b90064] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] font-medium text-[#8c7077]">
          <span>₹50</span>
          <span>₹5,000+</span>
        </div>
      </div>
    </div>
  );
};
