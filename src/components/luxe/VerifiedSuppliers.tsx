import React from 'react';
import { MapPin, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export interface LuxeSupplier {
  id: string;
  name: string;
  monogram: string;
  city: string;
  type: string;
  years: number;
  products: number;
  responseTime: string;
  rating: number;
  reviews: number;
}

export const LUXE_SUPPLIERS: LuxeSupplier[] = [
  {
    id: 'sup-1',
    name: 'Aura Beauty Labs',
    monogram: 'AB',
    city: 'Mumbai, Maharashtra',
    type: 'Manufacturer & OEM',
    years: 12,
    products: 340,
    responseTime: '≈ 2 hrs',
    rating: 4.9,
    reviews: 287,
  },
  {
    id: 'sup-2',
    name: 'Dermaglow India',
    monogram: 'DI',
    city: 'Delhi NCR',
    type: 'Cosmetic Manufacturer',
    years: 9,
    products: 265,
    responseTime: '≈ 3 hrs',
    rating: 4.8,
    reviews: 341,
  },
  {
    id: 'sup-8',
    name: 'Prime Beauty Distribution',
    monogram: 'PB',
    city: 'Bengaluru, Karnataka',
    type: 'Wholesaler & Distributor',
    years: 7,
    products: 520,
    responseTime: '≈ 1 hr',
    rating: 4.9,
    reviews: 198,
  },
  {
    id: 'sup-4',
    name: 'BioTech Derma Labs',
    monogram: 'BD',
    city: 'Ahmedabad, Gujarat',
    type: 'ISO-Certified Manufacturer',
    years: 15,
    products: 410,
    responseTime: '≈ 4 hrs',
    rating: 4.7,
    reviews: 456,
  },
];

interface VerifiedSuppliersProps {
  onViewProfile: (id: string) => void;
  onSendEnquiry: (name: string) => void;
  onViewAll: () => void;
}

export const VerifiedSuppliers: React.FC<VerifiedSuppliersProps> = ({
  onViewProfile,
  onSendEnquiry,
  onViewAll,
}) => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20">
    <SectionHeading
      eyebrow="Trusted Network"
      title={
        <>
          Featured <span className="italic text-gold-gradient">Verified Suppliers</span>
        </>
      }
      sub="Hand-audited manufacturers and distributors with documented GST, GMP & export credentials."
      action={
        <button
          onClick={onViewAll}
          className="hidden md:inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#3D1E4E] hover:text-[#54276E] border border-[#3D1E4E]/15 hover:border-[#C9A961] rounded-full px-5 py-2.5 transition-colors"
        >
          View all suppliers <ArrowRight className="w-4 h-4 text-[#C9A961]" />
        </button>
      }
      align="left"
    />

    <div className="grid md:grid-cols-2 gap-5">
      {LUXE_SUPPLIERS.map((s) => (
        <article
          key={s.id}
          onClick={() => onViewProfile(s.id)}
          className="glass-card rounded-2xl p-5 cursor-pointer group"
        >
          <div className="flex items-start gap-3 mb-3">
            {/* Monogram */}
            <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-luxe-lavender to-luxe-purple/20 flex items-center justify-center font-serif text-xl font-bold text-luxe-purple group-hover:from-luxe-gold/30 group-hover:to-luxe-gold/10 transition-all">
              {s.monogram}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-luxe-purple group-hover:text-luxe-gold transition-colors truncate">
                {s.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-luxe-purple/60 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{s.city}</span>
              </div>
              <div className="text-[11px] text-luxe-purple/50 mt-1">
                <span className="text-luxe-gold font-semibold">★ {s.rating}</span> ({s.reviews}) · {s.type}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-luxe-lavender text-luxe-purple text-xs">
              <Clock className="w-3 h-3" />
              Responds {s.responseTime}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-luxe-gold/10 text-luxe-gold text-xs font-semibold">
              {s.years} yrs · {s.products}+ products
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(s.id);
              }}
              className="flex-1 py-2 text-sm font-medium rounded-lg border-2 border-luxe-purple/20 text-luxe-purple hover:border-luxe-gold hover:bg-luxe-gold/5 transition-all"
            >
              View Profile
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendEnquiry(s.name);
              }}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-luxe-purple text-white hover:bg-luxe-purple-light shadow-luxe hover:shadow-luxe-lg transition-all"
            >
              Send Enquiry
            </button>
          </div>
        </article>
      ))}
    </div>

    <div className="mt-6 text-center md:hidden">
      <button
        onClick={onViewAll}
        className="text-[13.5px] font-semibold text-[#3D1E4E] border border-[#3D1E4E]/15 rounded-full px-5 py-2.5"
      >
        View all suppliers →
      </button>
    </div>
  </section>
);
