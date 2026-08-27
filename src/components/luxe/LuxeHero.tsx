import React, { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import heroSerum from '../../assets/images/luxe/hero-serum.jpg';
import heroBrushes from '../../assets/images/luxe/hero-brushes.jpg';
import { Sparkles } from './Sparkles';
import { LUXE_QUICK_TABS } from './LuxeHeader';

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim(), location);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Gradient canvas — Deep Royal Purple → Violet → Luxe Gold */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #3D1E4E 0%, #6B2D8C 50%, #C9A961 100%)',
        }}
      />
      {/* Contrast veil so headline & search stay readable over the gold corner */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 62% 58% at 50% 44%, rgba(42,14,63,0.52) 0%, rgba(42,14,63,0.28) 52%, transparent 100%)',
        }}
      />
      {/* Subtle floral damask texture */}
      <div className="absolute inset-0 floral-pattern-gold opacity-60" />
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
              Find <span className="italic text-gold-shimmer">Verified</span> Beauty Suppliers, Products &amp; OEM Manufacturers
            </h1>

            <p className="mt-4 text-white/75 text-[14.5px] md:text-[16px] max-w-[560px] mx-auto leading-relaxed">
              Source from 25,000+ GST-verified manufacturers, wholesalers &amp; private-label
              specialists across India — with MOQs and quotes that fit your business.
            </p>

            {/* Search bar */}
            <form
              onSubmit={submit}
              className="mt-8 bg-white rounded-2xl p-2 flex flex-col sm:flex-row items-stretch gap-2 shadow-luxe-lg"
            >
              <div className="flex items-center flex-1 min-w-0 pl-3.5">
                <Search className="w-[18px] h-[18px] text-[#8A7A94] shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products, suppliers, brands or services"
                  className="w-full bg-transparent outline-none px-3 py-3 text-[14px] text-[#2A0E3F] placeholder:text-[#9C8CA8]"
                />
              </div>

              <div className="hidden sm:block w-px bg-[#EDE3F0] my-2" />

              {/* Location dropdown */}
              <div className="relative sm:w-[168px] shrink-0">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full appearance-none bg-[#FAF6FB] border border-[#EDE3F0] rounded-xl pl-9 pr-8 py-3 text-[13.5px] font-medium text-[#2A0E3F] outline-none cursor-pointer hover:border-[#D9B96A] transition-colors"
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7A94] pointer-events-none" />
              </div>

              <button
                type="submit"
                className="btn-shine bg-gold-gradient hover:brightness-105 text-[#2A0E3F] text-[14px] font-bold px-8 py-3 rounded-xl transition-all shadow-[0_10px_24px_-8px_rgba(201,169,97,0.65)] hover:-translate-y-px"
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
