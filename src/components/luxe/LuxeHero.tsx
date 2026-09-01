import React, { useMemo, useRef, useState } from 'react';
import { Search, MapPin, ChevronDown, TrendingUp, Store, Tag } from 'lucide-react';
import heroSerum from '../../assets/images/luxe/hero-serum.jpg';
import heroBrushes from '../../assets/images/luxe/hero-brushes.jpg';
import { Sparkles } from './Sparkles';
import { LUXE_QUICK_TABS } from './LuxeHeader';
import { CATEGORIES, TRENDING_PRODUCTS, VERIFIED_SUPPLIERS } from '../../data/mockData';

const CITIES = [
  'All India',
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Ahmedabad',
  'Pune',
  'Surat',
  'Hyderabad',
  'Chennai',
  'Jaipur',
  'Kolkata',
];

interface LuxeHeroProps {
  onSearch: (query: string, location: string) => void;
  onTabChange: (scope: string, label: string) => void;
}

export const LuxeHero: React.FC<LuxeHeroProps> = ({ onSearch, onTabChange }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('All India');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimer = useRef<number | null>(null);

  // Lightweight search suggestions across products, categories & suppliers
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const products = TRENDING_PRODUCTS
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({ type: 'product' as const, label: p.title }));
    const categories = CATEGORIES
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ type: 'category' as const, label: c.name }));
    const suppliers = VERIFIED_SUPPLIERS
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((s) => ({ type: 'supplier' as const, label: s.name }));
    return [...products, ...categories, ...suppliers].slice(0, 8);
  }, [query]);

  const pickSuggestion = (label: string) => {
    setQuery(label);
    setShowSuggestions(false);
    onSearch(label, location);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query.trim(), location);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-luxe-purple via-luxe-purple-light to-luxe-purple">
      {/* Subtle floral damask texture */}
      <div className="absolute inset-0 floral-pattern-gold opacity-50" />
      <Sparkles />

      <div className="relative z-10 max-w-[1360px] mx-auto px-4 md:px-8 pt-[112px] md:pt-[128px] pb-28 md:pb-32">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_280px] xl:grid-cols-[320px_minmax(0,1fr)_320px] gap-8 items-center">
          {/* Left — serum bottle */}
          <div className="hidden lg:block relative nl-float">
            <div className="relative rounded-[22px] overflow-hidden border border-white/35 shadow-[0_30px_70px_-20px_rgba(20,5,35,0.65)] -rotate-2">
              <img src={heroSerum} alt="Luxury saffron & gold face serum dropper bottle" className="w-full aspect-[3/4] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#240B33]/35 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap glass-card-dark rounded-full px-4 py-2 text-[11.5px] font-semibold text-white">
              ✦ Saffron Gold Serum · MOQ 100 pcs
            </div>
          </div>

          {/* Right — brush set */}
          <div className="hidden lg:block relative nl-float-delayed order-3 lg:order-none">
            <div className="relative rounded-[22px] overflow-hidden border border-white/35 shadow-[0_30px_70px_-20px_rgba(20,5,35,0.65)] rotate-2">
              <img src={heroBrushes} alt="Professional makeup brush set with gold ferrules" className="w-full aspect-[3/4] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#240B33]/35 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap glass-card-dark rounded-full px-4 py-2 text-[11.5px] font-semibold text-white">
              ✦ Pro Brush Set · 12 pc Gold Ferrule
            </div>
          </div>

          {/* Center — headline + search */}
          <div className="order-1 lg:order-none text-center max-w-[720px] mx-auto">
            <div className="glass-card-dark inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-wide text-white/95 mb-6">
              <span className="text-[#EFD9A0]">✦</span> India's Premium B2B Beauty Marketplace
            </div>

            <h1 className="font-display text-white text-[34px] leading-[1.16] md:text-[52px] md:leading-[1.12] font-semibold text-editorial-tight">
              Find <span className="italic text-[#EFD9A0]">Verified</span> Beauty Suppliers,{" "}
              <span className="text-gold-shimmer">Products &amp; OEM</span> Manufacturers
            </h1>

            <p className="mt-4 text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              India&rsquo;s premium B2B marketplace for beauty, cosmetics &amp; wellness
            </p>

            {/* Search bar */}
            <form
              onSubmit={submit}
              className="mt-8 glass-card rounded-2xl p-2 flex flex-col sm:flex-row items-stretch gap-2"
            >
              <div className="relative flex items-center flex-1 min-w-0 pl-3.5">
                <Search className="w-[18px] h-[18px] text-white/70 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    blurTimer.current = window.setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  placeholder="Search products, suppliers, brands..."
                  className="w-full bg-transparent outline-none px-3 py-3 text-[14px] text-white placeholder:text-white/60"
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-autocomplete="list"
                  aria-label="Search products, suppliers and brands"
                />

                {/* Search suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 bg-white border border-[#E8DEEF] rounded-2xl shadow-xl overflow-hidden py-1.5 text-left">
                    {suggestions.map((s, idx) => (
                      <button
                        key={`${s.type}-${s.label}-${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(s.label)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#2A0E3F] hover:bg-[#F5EEF8] transition-colors text-left"
                      >
                        {s.type === 'product' && <TrendingUp className="w-3.5 h-3.5 text-[#6B2D8C] shrink-0" />}
                        {s.type === 'category' && <Tag className="w-3.5 h-3.5 text-[#C9A961] shrink-0" />}
                        {s.type === 'supplier' && <Store className="w-3.5 h-3.5 text-[#5B4A6E] shrink-0" />}
                        <span className="truncate font-medium">{s.label}</span>
                        <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-[#8A7A94]">
                          {s.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:block w-px bg-white/25 my-2" />

              {/* Location dropdown */}
              <div className="relative sm:w-[168px] shrink-0">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full appearance-none bg-white/10 border border-white/30 rounded-xl pl-9 pr-8 py-3 text-[13.5px] font-medium text-white outline-none cursor-pointer hover:border-[#EFD9A0] transition-colors [&>option]:text-[#2A0E3F]"
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7A94] pointer-events-none" />
              </div>

              <button
                type="submit"
                className="btn-shine px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-luxe-gold to-luxe-gold-light text-luxe-purple text-[14px] font-bold transition-all duration-300 shadow-luxe hover:scale-105 hover:shadow-gold-glow"
              >
                <span className="relative z-10">Search</span>
              </button>
            </form>

            {/* Trending chips */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[12px]">
              {['Vitamin C Serum', 'Lipstick Manufacturing', 'Glass Packaging', 'Low MOQ 100'].map((t) => (
                <button
                  key={t}
                  onClick={() => onSearch(t, location)}
                  className="glass-button text-white/80 hover:text-white rounded-full px-3 py-1 text-[12px]"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-[560px] mx-auto">
              {LUXE_QUICK_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => onTabChange(tab.scope, tab.label)}
                  className="glass-button group flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white"
                >
                  <tab.icon className="w-4 h-4 text-[#EFD9A0]" />
                  {tab.label === 'OEM / Private Label' ? 'OEM' : tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Soft blend into page */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FDFBF7] to-transparent z-[5]" />
    </section>
  );
};
