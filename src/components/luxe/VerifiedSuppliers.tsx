import React from 'react';
import { MapPin, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
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
          className="luxe-card luxe-card-hover p-6 flex flex-col sm:flex-row sm:items-center gap-5"
        >
          {/* Monogram */}
          <div className="shrink-0 relative">
            <div className="w-[70px] h-[70px] rounded-full bg-royal-gradient ring-2 ring-[#C9A961]/70 ring-offset-2 ring-offset-white flex items-center justify-center shadow-lg">
              <span className="font-display text-[22px] font-bold text-[#EFD9A0] tracking-wide">{s.monogram}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-[2.5px] border-white flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15.5px] font-bold text-[#2A0E3F]">{s.name}</h3>
              <span className="text-[12px] font-semibold text-[#B08D45]">
                ★ {s.rating} <span className="text-[#9C8CA8] font-normal">({s.reviews})</span>
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#6E5A7E]">
              <MapPin className="w-3.5 h-3.5 text-[#C9A961]" /> {s.city}
              <span className="text-[#D8C9DF]">·</span> {s.type}
            </p>

            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified Supplier
              </span>
              <span className="inline-flex items-center gap-1 bg-[#F5EFF8] text-[#5B3B72] border border-[#E4D6E9] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-[#C9A961]" /> Responds {s.responseTime}
              </span>
            </div>

            <p className="mt-2 text-[11.5px] text-[#9C8CA8]">
              {s.years} yrs experience · {s.products}+ listed products · Pan-India & export
            </p>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => onViewProfile(s.id)}
              className="flex-1 text-[12.5px] font-semibold text-[#3D1E4E] border border-[#3D1E4E]/25 hover:border-[#3D1E4E] hover:bg-[#F7F2FA] rounded-full px-4 py-2 transition-colors whitespace-nowrap"
            >
              View Profile
            </button>
            <button
              onClick={() => onSendEnquiry(s.name)}
              className="flex-1 text-[12.5px] font-semibold text-white bg-royal-gradient hover:brightness-110 rounded-full px-4 py-2 shadow-[0_8px_18px_-8px_rgba(61,30,78,0.55)] transition-all whitespace-nowrap"
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
