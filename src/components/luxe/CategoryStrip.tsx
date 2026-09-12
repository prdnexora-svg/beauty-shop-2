import React, { useState, useEffect, useRef } from 'react';
import { Droplets, Waves, Brush, Scissors, Zap, Flower2, Package, FlaskConical, ChevronRight, ChevronLeft } from 'lucide-react';
import catSkincare from '../../assets/images/luxe/cat-skincare.jpg';
import catHaircare from '../../assets/images/luxe/cat-haircare.jpg';
import catMakeup from '../../assets/images/luxe/cat-makeup.jpg';
import catSalon from '../../assets/images/luxe/cat-salon.jpg';
import catAesthetic from '../../assets/images/luxe/cat-aesthetic.jpg';
import catSpa from '../../assets/images/luxe/cat-spa.jpg';
import catPackaging from '../../assets/images/luxe/cat-packaging.jpg';
import catOem from '../../assets/images/luxe/cat-oem.jpg';
import { SectionHeading } from './SectionHeading';

const CATEGORIES = [
  { label: 'Skincare', img: catSkincare, Icon: Droplets },
  { label: 'Haircare', img: catHaircare, Icon: Waves },
  { label: 'Makeup', img: catMakeup, Icon: Brush },
  { label: 'Salon Equipment', img: catSalon, Icon: Scissors },
  { label: 'Aesthetic Devices', img: catAesthetic, Icon: Zap },
  { label: 'Spa & Wellness', img: catSpa, Icon: Flower2 },
  { label: 'Packaging', img: catPackaging, Icon: Package },
  { label: 'OEM/Private Label', img: catOem, Icon: FlaskConical },
];

export const CategoryStrip: React.FC<{ onCategoryClick: (label: string) => void }> = ({ onCategoryClick }) => {
  const [hiddenCount, setHiddenCount] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const updateOverflowState = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const { scrollLeft, clientWidth, scrollWidth } = container;

    setCanScrollLeft(scrollLeft > 15);

    // If container fits all items comfortably without scroll
    if (scrollWidth <= clientWidth + 10) {
      setHiddenCount(0);
      return;
    }

    // Count items whose right edge is beyond visible container width
    let count = 0;
    const visibleRightBoundary = scrollLeft + clientWidth - 20;

    itemRefs.current.forEach((item) => {
      if (item) {
        const itemRight = item.offsetLeft + item.offsetWidth;
        if (itemRight > visibleRightBoundary) {
          count++;
        }
      }
    });

    setHiddenCount(count);
  };

  useEffect(() => {
    updateOverflowState();
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => updateOverflowState();
    container.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateOverflowState());
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20">
      <SectionHeading
        eyebrow="Explore the Marketplace"
        title={
          <>
            Shop by <span className="italic text-gold-gradient">Category</span>
          </>
        }
        sub="Eight curated verticals covering the complete beauty value chain — from actives to salon interiors."
      />

      <div className="relative group/strip">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={handleScrollLeft}
            aria-label="Scroll category strip left"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#2A0E3F]/90 text-[#F3E5AB] border border-[#C9A961]/50 shadow-md backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-[#F3E5AB]" />
          </button>
        )}

        {/* Dynamic '+N more' Counter Edge Pill */}
        {hiddenCount > 0 && (
          <button
            onClick={handleScrollRight}
            aria-label={`Scroll to view ${hiddenCount} more categories`}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#2A0E3F] via-[#3D1E4E] to-[#54276E] text-[#F3E5AB] border border-[#C9A961]/70 shadow-xl hover:shadow-2xl font-extrabold text-xs backdrop-blur-md hover:scale-105 active:scale-95 transition-all animate-fade-in"
          >
            <span className="bg-[#C9A961]/25 px-1.5 py-0.5 rounded-full text-[10.5px] font-black text-[#F3E5AB] border border-[#C9A961]/40">
              +{hiddenCount}
            </span>
            <span className="text-[11.5px] font-bold tracking-tight">more</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#F3E5AB] animate-pulse" />
          </button>
        )}

        {/* Categories Container: Horizontal Scroll on Mobile/Tablet, Grid on Desktop */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar scroll-smooth gap-3.5 pb-3 pt-1 sm:grid sm:grid-cols-4 xl:grid-cols-8 sm:overflow-visible"
        >
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.label}
              ref={(el) => { itemRefs.current[idx] = el; }}
              onClick={() => onCategoryClick(cat.label)}
              className="luxe-card luxe-card-hover group overflow-visible text-left flex-shrink-0 w-[140px] sm:w-auto"
            >
              <div className="relative aspect-square overflow-hidden rounded-t-[11px] bg-[#F6EEF9]">
                <img
                  src={cat.img}
                  alt={`${cat.label} products`}
                  className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                />
              </div>
              {/* Icon medallion — lavender circle that turns gold on hover */}
              <div className="relative z-10 -mt-6 flex justify-center">
                <span className="w-11 h-11 rounded-full bg-[#E8D5F2] ring-4 ring-white border border-[#E5D4ED] flex items-center justify-center transition-all duration-300 group-hover:bg-gold-gradient group-hover:border-[#C9A961] group-hover:shadow-gold-glow">
                  <cat.Icon className="w-[19px] h-[19px] text-[#3D1E4E] transition-colors duration-300 group-hover:text-[#2A0E3F]" strokeWidth={1.7} />
                </span>
              </div>
              <div className="px-3 pb-3.5 pt-2 text-center">
                <p className="text-[12.5px] font-semibold text-[#2A0E3F] group-hover:text-[#54276E] leading-snug">
                  {cat.label}
                </p>
                <span className="mt-1 inline-block w-5 h-[2px] bg-gold-gradient rounded-full group-hover:w-8 transition-all duration-300" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

