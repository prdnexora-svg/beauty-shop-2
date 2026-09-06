import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface HeroSectionProps {
  onSearch?: (query: string, locationOrCategory: string) => void;
  onTabChange?: (tab: string) => void;
}

const TRENDING_TAGS = [
  'Hyaluronic Acid',
  'Glass Packaging',
  'Vegan Formulations',
  'Peptide Serum',
  'GMP Certified',
  'Low MOQ <100',
];

const CATEGORIES = [
  'All Categories',
  'Skincare',
  'Color Cosmetics',
  'Haircare',
  'Salon Equipment',
  'OEM / Private Label',
];

/**
 * Editorial hero.
 *
 * Layout note: the two flanking product cards used to be `absolute` and
 * overlapped the search panel on narrow desktops. They are now real grid
 * columns (`xl:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,13rem)]`),
 * so the browser guarantees they can never collide with the centre content —
 * below `xl` they simply drop out of the flow.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Categories');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query, category);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    onSearch?.(tag, category);
  };

  const flankCard = (
    src: string,
    alt: string,
    kicker: string,
    title: string,
    align: 'left' | 'right',
  ) => (
    <div className={`hidden xl:block ${align === 'left' ? 'justify-self-end' : 'justify-self-start'}`}>
      <figure className="relative w-full max-w-[13rem] aspect-[3/4] rounded-2xl overflow-hidden border border-white/70 shadow-[0_18px_40px_-24px_rgba(42,14,63,0.45)] bg-white/50">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A0E3F]/45 via-transparent to-transparent" />
        <figcaption className="absolute bottom-2.5 inset-x-2.5 bg-white/92 backdrop-blur-md rounded-lg py-1.5 px-2 border border-white/60 text-center">
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#6B2D8C]">
            {kicker}
          </span>
          <span className="block text-[11px] font-semibold text-[#2A0E3F] truncate">{title}</span>
        </figcaption>
      </figure>
    </div>
  );

  return (
    <section className="relative isolate overflow-hidden mb-12 bg-gradient-to-b from-[#FFFDF9] via-[#FAF5F7] to-[#FDFBF7]">
      {/* Backdrop: softened so headline contrast stays high on every viewport. */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <img
          className="w-full h-full object-cover object-center opacity-70"
          alt=""
          aria-hidden="true"
          src="/src/assets/images/luxury_hero_bg_1786976539255.jpg"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FFFDF8]/88 via-[#F6F0F9]/72 to-[#FCF0F4]/85" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FDFBF7] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FFFDF9]/70 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,13rem)] xl:gap-10">
          {flankCard(
            '/src/assets/images/hero_left_serum_1786976976626.jpg',
            'Luxury cosmetic serum bottle and botanical accent',
            'OEM Formulation',
            'Bio-Peptide Serums',
            'left',
          )}

          {/* Centre column */}
          <div className="min-w-0 mx-auto w-full max-w-3xl text-center">
            <div className="rounded-3xl border border-white/80 bg-white/82 backdrop-blur-md px-5 py-8 sm:px-8 sm:py-10 md:px-10 shadow-[0_28px_70px_-42px_rgba(42,14,63,0.55)]">
              <h1
                className="font-serif font-bold text-[#2A0E3F] tracking-tight text-balance mx-auto max-w-2xl"
                // Fluid type: no manual breakpoint ladder, no mid-word wrapping.
                style={{ fontSize: 'clamp(1.65rem, 1.05rem + 2.1vw, 2.75rem)', lineHeight: 1.18 }}
              >
                Source Premium Beauty &amp; Personal Care Manufacturers
              </h1>
              <p
                className="mt-3 md:mt-4 mx-auto max-w-xl text-[#4E3D63] leading-relaxed"
                style={{ fontSize: 'clamp(0.86rem, 0.78rem + 0.3vw, 1rem)' }}
              >
                Connect with verified global suppliers for OEM, private label, and ready-to-ship
                luxury cosmetics.
              </p>

              {/* Search: one row on md+, each control locked to the same 48px height. */}
              <form
                onSubmit={handleSubmit}
                className="mt-6 sm:mt-7 flex flex-col md:flex-row md:items-stretch gap-2 rounded-2xl border border-[#E5D8EE] bg-white p-2 shadow-[0_10px_30px_-20px_rgba(42,14,63,0.5)]"
              >
                <div className="flex-1 min-w-0 flex items-center gap-2.5 h-12 px-3 rounded-xl md:rounded-none border-b md:border-b-0 md:border-r border-[#EFE6F4]">
                  <Search className="w-[18px] h-[18px] text-[#8B7FA3] shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search products, suppliers, or ingredients"
                    placeholder="Search products, suppliers, or ingredients..."
                    className="w-full min-w-0 bg-transparent border-none outline-none p-0 text-[14px] text-[#241531] placeholder-[#8B7FA3]"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="shrink-0 p-1 rounded-full text-[#8B7FA3] hover:text-[#6B2D8C] hover:bg-[#F5EEF8] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 h-12 px-3 md:w-[13.5rem] shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-[#8B7FA3] shrink-0" aria-hidden="true" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filter by category"
                    className="w-full min-w-0 bg-transparent border-none outline-none text-[14px] font-medium text-[#4E3D63] cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="h-12 shrink-0 rounded-xl bg-[#2A0E3F] hover:bg-[#53103B] active:scale-[0.99] px-7 text-[14px] font-semibold text-white transition-all cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Trending chips: real chips with consistent gap, not underlined text. */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7FA3]">
                  Trending
                </span>
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="rounded-full border border-[#EADDF2] bg-white/80 px-3 py-1.5 text-[12px] font-medium text-[#4A2560] hover:border-[#C9A961] hover:text-[#2A0E3F] hover:bg-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {flankCard(
            '/src/assets/images/hero_right_cream_1786976999531.jpg',
            'Luxury cosmetic cream jar and beauty tool',
            'Private Label',
            'Barrier Cream Jars',
            'right',
          )}
        </div>
      </div>
    </section>
  );
};
