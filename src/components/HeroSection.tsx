import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, Check, ArrowRight, ShieldCheck, FileText, X } from 'lucide-react';

interface HeroSectionProps {
  onOpenRFQModal: () => void;
  onSearchSubmit: (params: any) => void;
  onTagClick: (tag: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRFQModal,
  onSearchSubmit,
  onTagClick
}) => {
  const [scope, setScope] = useState<'products' | 'suppliers' | 'oem'>('products');
  const [query, setQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filters state
  const [category, setCategory] = useState('All Categories');
  const [priceRange, setPriceRange] = useState('Any Price');
  const [moq, setMoq] = useState('Any MOQ');
  const [location, setLocation] = useState('Any Location');
  const [supplierType, setSupplierType] = useState('All Types');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit({
      scope,
      query,
      category,
      priceRange,
      moq,
      location,
      supplierType,
      verifiedOnly
    });
  };

  const handleClearFilters = () => {
    setCategory('All Categories');
    setPriceRange('Any Price');
    setMoq('Any MOQ');
    setLocation('Any Location');
    setSupplierType('All Types');
    setVerifiedOnly(true);
    setQuery('');
  };

  return (
    <section className="pt-10 pb-12">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Editorial Heading Container */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fde7f3] text-[#b90064] text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#b90064]" />
            B2B Sourcing Hub
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1c1b1b] leading-[1.15]">
            India's Premium B2B <br className="hidden sm:inline" />
            <span className="text-[#b90064]">Beauty Sourcing Network</span>
          </h1>

          <p className="text-base sm:text-lg text-[#594047] max-w-2xl mx-auto font-normal">
            Find verified beauty manufacturers, wholesalers, distributors and OEM partners across India.
          </p>
        </div>

        {/* Search & Filter Container */}
        <div className="mt-8 max-w-4xl mx-auto bg-white rounded-2xl border border-[#e8e8e8] p-4 sm:p-6 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            
            {/* Search Input and Scope Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              
              {/* Scope Dropdown */}
              <div className="sm:w-44 bg-[#f7f2f2] rounded-lg border border-transparent focus-within:border-[#b90064] flex items-center px-3 py-2.5">
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full bg-transparent text-[13px] font-semibold text-[#1c1b1b] focus:outline-none cursor-pointer"
                >
                  <option value="products">Products</option>
                  <option value="suppliers">Suppliers</option>
                  <option value="oem">OEM Formulation</option>
                </select>
              </div>

              {/* Main Query Input */}
              <div className="flex-1 relative flex items-center bg-[#f7f2f2] rounded-lg border border-transparent focus-within:border-[#b90064] transition-all px-3.5 py-2.5">
                <Search className="w-4 h-4 text-[#8c7077] shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search premium formulations, equipment, raw materials, supplier names..."
                  className="w-full bg-transparent text-[14px] text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-[#8c7077] hover:text-[#1c1b1b]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Primary Search Button */}
              <button
                type="submit"
                className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold px-7 py-3 rounded-lg text-[13px] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

            {/* Toggle Advanced Filters Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-[12px] font-semibold text-[#594047] hover:text-[#b90064] flex items-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#b90064]" />
                {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Sourcing Filters (MOQ, Price, City)'}
              </button>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[12px] font-medium text-[#594047]">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="accent-[#b90064] w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#b90064]" />
                    Verified Suppliers Only
                  </span>
                </label>
              </div>
            </div>

            {/* Expandable Advanced Filters Grid */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-[#f0edec] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in duration-200">
                
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] rounded-md px-2.5 py-1.5 text-[12px] text-[#1c1b1b] focus:outline-none focus:border-[#b90064]"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Skincare">Skincare</option>
                    <option value="Haircare">Haircare</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Salon Equipment">Salon Equipment</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Raw Materials">Raw Materials</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider">Price Tier</span>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] rounded-md px-2.5 py-1.5 text-[12px] text-[#1c1b1b] focus:outline-none focus:border-[#b90064]"
                  >
                    <option value="Any Price">Any Price Range</option>
                    <option value="Under ₹500">Under ₹500 / Unit</option>
                    <option value="₹500 - ₹2,000">₹500 — ₹2,000</option>
                    <option value="₹2,000 - ₹10,000">₹2,000 — ₹10,000</option>
                    <option value="Bulk Formulation">Bulk Formulation Pricing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider">MOQ</span>
                  <select
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] rounded-md px-2.5 py-1.5 text-[12px] text-[#1c1b1b] focus:outline-none focus:border-[#b90064]"
                  >
                    <option value="Any MOQ">Any MOQ</option>
                    <option value="Under 50 Units">Under 50 Units (Sample Ready)</option>
                    <option value="50 - 200 Units">50 — 200 Units</option>
                    <option value="200 - 1000 Units">200 — 1,000 Units</option>
                    <option value="1000+ Units">1,000+ Units (Direct Factory)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider">Location</span>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] rounded-md px-2.5 py-1.5 text-[12px] text-[#1c1b1b] focus:outline-none focus:border-[#b90064]"
                  >
                    <option value="Any Location">All India</option>
                    <option value="Mumbai">Mumbai &amp; MMR</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Ahmedabad">Ahmedabad / Gujarat</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider">Supplier Type</span>
                  <select
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value)}
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] rounded-md px-2.5 py-1.5 text-[12px] text-[#1c1b1b] focus:outline-none focus:border-[#b90064]"
                  >
                    <option value="All Types">All Supplier Types</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="OEM / Private Label">OEM / Private Label</option>
                    <option value="Wholesaler / Distributor">Wholesaler / Distributor</option>
                  </select>
                </div>

              </div>
            )}

          </form>

          {/* Popular Sourcing Searches Chips */}
          <div className="mt-4 pt-4 border-t border-[#f0edec] flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-[#8c7077]">Popular Sourcing:</span>
            {[
              'Private Label Vitamin C Serum',
              'Salon Hair Spa Machine',
              'Frosted 30ml Dropper Bottles',
              'Keratin Smoothing Treatment Base',
              'Hydraulic Salon Chair'
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  onTagClick(tag);
                }}
                className="text-[11px] font-medium bg-[#f7f2f2] hover:bg-[#fde7f3] text-[#594047] hover:text-[#b90064] px-2.5 py-1 rounded-full border border-[#e8e8e8] transition-all"
              >
                {tag}
              </button>
            ))}
          </div>

        </div>

        {/* Quick RFQ Action Callout Box */}
        <div className="mt-8 max-w-4xl mx-auto bg-gradient-to-r from-[#fde7f3] via-[#fdf8f8] to-[#fde7f3] border border-[#e0bec6] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#b90064] text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1c1b1b]">Looking for a custom formulation, bulk quote, or specific machine?</h2>
              <p className="text-[13px] text-[#594047]">Post your requirement and receive verified manufacturer quotes within 24 hours.</p>
            </div>
          </div>
          <button
            onClick={onOpenRFQModal}
            className="w-full sm:w-auto bg-[#1c1b1b] hover:bg-[#b90064] text-white text-[13px] font-bold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
          >
            <span>Post Requirement / Get Quotes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
