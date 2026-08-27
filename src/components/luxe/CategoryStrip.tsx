import React from 'react';
import { Droplets, Waves, Brush, Scissors, Zap, Flower2, Package, FlaskConical } from 'lucide-react';
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

export const CategoryStrip: React.FC<{ onCategoryClick: (label: string) => void }> = ({ onCategoryClick }) => (
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

    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onCategoryClick(cat.label)}
          className="luxe-card luxe-card-hover group overflow-visible text-left"
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
  </section>
);
