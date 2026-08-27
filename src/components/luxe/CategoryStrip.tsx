import React from 'react';
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
  { label: 'Skincare', img: catSkincare },
  { label: 'Haircare', img: catHaircare },
  { label: 'Makeup', img: catMakeup },
  { label: 'Salon Equipment', img: catSalon },
  { label: 'Aesthetic Devices', img: catAesthetic },
  { label: 'Spa & Wellness', img: catSpa },
  { label: 'Packaging', img: catPackaging },
  { label: 'OEM/Private Label', img: catOem },
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
          className="luxe-card luxe-card-hover group overflow-hidden text-left"
        >
          <div className="relative aspect-square overflow-hidden bg-[#F6EEF9]">
            <img
              src={cat.img}
              alt={`${cat.label} products`}
              className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
            />
          </div>
          <div className="px-3 py-3 text-center">
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
