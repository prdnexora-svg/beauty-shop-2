import React, { useMemo, useRef, useState } from 'react';
import { Search, MapPin, ChevronDown, TrendingUp, Store, Tag } from 'lucide-react';
import heroSerum from '../../assets/images/luxe/hero-serum.jpg';
import heroBrushes from '../../assets/images/luxe/hero-brushes.jpg';
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

const TRENDING_TAGS = ['Vitamin C Serum', 'Lipstick Manufacturing', 'Glass Packaging', 'Low MOQ 100'];

interface LuxeHeroProps {
  onSearch: (query: string, location: string) => void;
  onTabChange: (scope: string, label: string) => void;
}

/**
 * Hero.
 *
 * Layout notes
 * ────────────
 * The three columns are placed explicitly (`lg:col-start-1/2/3` + `row-start-1`)
 * instead of relying on auto-placement, so DOM order can never reshuffle the
 * banner images into the centre column. The flanking cards are real grid tracks
 * (`minmax(0,…)`) and their captions sit in normal flow inside the card, so
 * nothing overlaps the centre content or bleeds past the card edge.
 *
 * Colour: the deep purple/gold wash is replaced by warm cream → soft
 * lavender-gray, with plum text. Contrast on the headline is ~15:1 and the
 * smallest gold micro-copy stays above WCAG AA (4.6:1).
 */
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

  /**
   * Flanking product card. The caption is a real flex row at the bottom of the
   * card (not an absolutely-positioned chip hanging off the frame), which is
   * what previously let it collide with the neighbouring column.
   *
   * `column` is a full, literal class string: Tailwind only generates the
   * utilities it can see verbatim in the source, so it can never be built by
   * string interpolation.
   */
  const flankCard = (
    src: string,
    alt: string,
    kicker: string,
    title: string,
    meta: string,
    column: 'lg:col-start-1' | 'lg:col-start-3',
  ) => (
    <figure className={`hidden w-full min-w-0 lg:row-start-1 lg:block ${column}`}>
      <div className="overflow-hidden rounded-[20px] border border-[#EBE1F2] bg-white shadow-[0_26px_60px_-34px_rgba(42,14,63,0.5)]">
        <div className="aspect-[3/4] w-full overflow-hidden bg-[#F3EDF7]">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <figcaption className="border-t border-[#F1E9F6] px-3.5 py-3 text-left">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#8A6A2F]">
            {kicker}
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-semibold text-[#2A0E3F]">
            {title}
          </span>
          <span className="mt-1 block truncate text-[11px] text-[#7A6A88]">{meta}</span>
        </figcaption>
      </div>
    </figure>
  );

  return (
    <section className="relative isolate overflow-hidden bg-[#FBF8F4]">
      {/* Softened backdrop: warm cream → lavender-gray, no saturated purple wash. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#FDFBF7_0%,#FAF6F1_42%,#F3EEF8_100%)]" />
        <div className="absolute inset-0 floral-pattern opacity-70" />
        {/* Low-opacity blooms for depth without overwhelming the text. */}
        <div className="absolute -left-28 -top-28 h-[420px] w-[420px] rounded-full bg-[#DCC9EC]/35 blur-[120px]" />
        <div className="absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full bg-[#EFE4F5]/70 blur-[120px]" />
        <div className="absolute -bottom-28 left-1/3 h-[380px] w-[380px] rounded-full bg-[#EBDCC4]/40 blur-[110px]" />
      </div>

      {/* Shares the 1280px container + gutter of the header and every section below. */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 pb-20 pt-[104px] md:px-6 md:pb-24 md:pt-[124px]">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,15rem)] lg:gap-8 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)_minmax(0,17.5rem)] xl:gap-12">
          {flankCard(
            heroSerum,
            'Luxury saffron & gold face serum dropper bottle',
            'OEM Formulation',
            'Saffron Gold Serum',
            'MOQ 100 pcs · GMP',
            'lg:col-start-1',
          )}

          {/* Centre — headline + search (explicitly placed in column 2) */}
          <div className="min-w-0 text-center lg:col-start-2 lg:row-start-1">
            <div className="mx-auto max-w-[46rem]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7DAF0] bg-white/80 px-3.5 py-1.5 text-[11.5px] font-semibold tracking-wide text-[#4A3559]">
                <span className="text-[#B08D45]" aria-hidden="true">
                  ✦
                </span>
                India&rsquo;s Premium B2B Beauty Marketplace
              </div>

              <h1
                className="mt-5 text-balance font-sans font-semibold tracking-[-0.02em] text-[#2A0E3F]"
                // Fluid type scales 32px → 44px; no breakpoint ladder, no mid-word wrap.
                style={{ fontSize: 'clamp(2rem, 1.42rem + 1.75vw, 2.75rem)', lineHeight: 1.2 }}
              >
                Find <span className="italic font-medium text-[#8A6A2F]">Verified</span> Beauty
                Suppliers, Products &amp; OEM Manufacturers
              </h1>

              <p
                className="mx-auto mt-4 max-w-[34rem] text-[#5B4A6E]"
                style={{ fontSize: 'clamp(0.95rem, 0.9rem + 0.28vw, 1.0625rem)', lineHeight: 1.65 }}
              >
                India&rsquo;s premium B2B marketplace for beauty, cosmetics &amp; wellness — sourced
                from audited manufacturers.
              </p>

              {/* Search: one row from md up; input / location / CTA all locked to 52px. */}
              <form
                onSubmit={submit}
                className="mt-8 flex flex-col gap-2 rounded-2xl border border-[#E9DFF0] bg-white p-2 shadow-[0_18px_44px_-30px_rgba(42,14,63,0.55)] md:flex-row md:items-stretch"
              >
                <div className="relative flex min-w-0 flex-1 items-center gap-2.5 px-3.5 md:border-r md:border-[#F1E9F6]">
                  <Search className="h-[18px] w-[18px] shrink-0 text-[#8A7A94]" aria-hidden="true" />
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
                    className="h-[52px] w-full min-w-0 border-none bg-transparent p-0 text-[14px] text-[#241531] outline-none placeholder:text-[#9A8BA6]"
                    role="combobox"
                    aria-expanded={showSuggestions && suggestions.length > 0}
                    aria-autocomplete="list"
                    aria-label="Search products, suppliers and brands"
                  />

                  {/* Search suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[#E8DEEF] bg-white py-1.5 text-left shadow-[0_24px_50px_-24px_rgba(42,14,63,0.4)]">
                      {suggestions.map((s, idx) => (
                        <button
                          key={`${s.type}-${s.label}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickSuggestion(s.label)}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-[#2A0E3F] transition-colors hover:bg-[#F7F2FA]"
                        >
                          {s.type === 'product' && (
                            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#6B2D8C]" />
                          )}
                          {s.type === 'category' && (
                            <Tag className="h-3.5 w-3.5 shrink-0 text-[#B08D45]" />
                          )}
                          {s.type === 'supplier' && (
                            <Store className="h-3.5 w-3.5 shrink-0 text-[#5B4A6E]" />
                          )}
                          <span className="truncate font-medium">{s.label}</span>
                          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#9A8BA6]">
                            {s.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location dropdown */}
                <div className="relative flex shrink-0 items-center md:w-[11.5rem]">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#B08D45]"
                    aria-hidden="true"
                  />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Filter by city"
                    className="h-[52px] w-full cursor-pointer appearance-none rounded-xl border border-[#EFE6F4] bg-[#FCFAFD] pl-9 pr-8 text-[13.5px] font-medium text-[#4A3559] outline-none transition-colors hover:border-[#D9B96A] focus:border-[#C9A961] md:border-transparent md:bg-transparent md:hover:bg-[#FAF6FB]"
                  >
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 h-4 w-4 text-[#9A8BA6]"
                    aria-hidden="true"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-shine h-[52px] shrink-0 rounded-xl bg-[#3D1E4E] px-7 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#54276E] hover:shadow-[0_12px_28px_-12px_rgba(61,30,78,0.65)] active:scale-[0.99]"
                >
                  <span className="relative z-10">Search</span>
                </button>
              </form>

              {/* Trending chips — real chips with a consistent gap on both axes. */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A7A94]">
                  Trending
                </span>
                {TRENDING_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSearch(t, location)}
                    className="rounded-full border border-[#E7DAF0] bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-[#4A2560] transition-colors hover:border-[#D9B96A] hover:bg-[#FDF9F1] hover:text-[#2A0E3F]"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Category pills */}
              <div className="mx-auto mt-8 grid max-w-[34rem] grid-cols-2 gap-2.5 sm:grid-cols-4">
                {LUXE_QUICK_TABS.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => onTabChange(tab.scope, tab.label)}
                    className="flex items-center justify-center gap-2 rounded-full border border-[#E7DAF0] bg-white/85 px-4 py-2.5 text-[12.5px] font-semibold text-[#3D1E4E] transition-all hover:-translate-y-px hover:border-[#D9B96A] hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(42,14,63,0.55)]"
                  >
                    <tab.icon className="h-4 w-4 shrink-0 text-[#B08D45]" />
                    {tab.label === 'OEM / Private Label' ? 'OEM' : tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {flankCard(
            heroBrushes,
            'Professional makeup brush set with gold ferrules',
            'Private Label',
            'Pro Brush Set',
            '12 pc · Gold ferrule',
            'lg:col-start-3',
          )}
        </div>
      </div>

      {/* Soft blend into page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-gradient-to-t from-[#FDFBF7] to-transparent" />
    </section>
  );
};
