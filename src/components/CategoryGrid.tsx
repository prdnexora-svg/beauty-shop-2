import React from 'react';
import { 
  Sparkles, 
  Scissors, 
  Palette, 
  Wind, 
  Droplets, 
  HandMetal, 
  FlaskConical, 
  Package, 
  Armchair, 
  Wrench, 
  UserCheck, 
  Factory,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { CategoryItem } from '../types';

interface CategoryGridProps {
  categories: CategoryItem[];
  onSelectCategory: (categoryName: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Scissors,
  Palette,
  Wind,
  Droplets,
  HandMetal,
  FlaskConical,
  Package,
  Armchair,
  Wrench,
  UserCheck,
  Factory
};

const defaultCategoryImages: Record<string, string> = {
  skincare: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  haircare: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
  cosmetics: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
  fragrances: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
  bodycare: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  personalcare: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
  rawmaterials: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
  packaging: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
  salonequip: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  tools: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=80',
  mensgrooming: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80',
  oem: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  return (
    <section id="explore" className="py-14 bg-[#fdf8f8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b90064]"></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#b90064]">B2B INDUSTRY DIRECTORY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1b1b] mt-1.5 tracking-tight">
              Explore Beauty Categories
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[13px] text-[#594047] max-w-md">
              Direct access to audited cosmetic laboratories, active extract suppliers, salon equipment, and packaging lines.
            </p>
          </div>
        </div>

        {/* 12-Segment Category Visual Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.iconName] || Sparkles;
            const isOEM = cat.isHighlighted;
            const imageUrl = cat.image || defaultCategoryImages[cat.id] || defaultCategoryImages.skincare;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`group relative text-left rounded-xl overflow-hidden border transition-all duration-300 h-48 sm:h-52 md:h-56 flex flex-col justify-between p-3.5 sm:p-4 shadow-2xs hover:shadow-md cursor-pointer ${
                  isOEM 
                    ? 'border-[#b90064] ring-2 ring-[#b90064]/20' 
                    : 'border-[#e8e8e8] hover:border-[#b90064]'
                }`}
              >
                {/* Background Photography with smooth hover zoom */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-[#241a1d]">
                  <img
                    src={imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  
                  {/* Top Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Bottom Contrast Gradient for crystal-clear typography */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                  {/* Subtle brand tint on hover */}
                  <div className="absolute inset-0 bg-[#b90064]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* Top Row: Icon pill & Verified / Count Badge */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                    isOEM 
                      ? 'bg-[#b90064] border-white/30 text-white shadow-xs' 
                      : 'bg-black/40 border-white/20 text-white group-hover:bg-[#b90064] group-hover:border-[#b90064]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {isOEM ? (
                    <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#b90064] text-white px-2 py-0.5 rounded shadow-xs">
                      R&amp;D HUB
                    </span>
                  ) : cat.itemCount ? (
                    <span className="text-[10px] font-medium text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
                      {cat.itemCount.split(' ')[0]}
                    </span>
                  ) : null}
                </div>

                {/* Bottom Row: Typography & Arrow */}
                <div className="relative z-10 w-full mt-auto">
                  {cat.subtitle && (
                    <span className="block text-[10.5px] font-medium text-white/75 mb-0.5 line-clamp-1 group-hover:text-white/90 transition-colors">
                      {cat.subtitle}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[14px] sm:text-[15px] font-bold text-white leading-tight group-hover:text-[#fde7f3] transition-colors tracking-tight">
                      {cat.name}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#b90064] flex items-center justify-center transition-all duration-300 shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

