import React from 'react';
import { BadgeCheck, ArrowRight, Flame } from 'lucide-react';
import trendSerum from '../../assets/images/luxe/hero-serum.jpg';
import trendCream from '../../assets/images/luxe/cat-skincare.jpg';
import trendShampoo from '../../assets/images/luxe/cat-haircare.jpg';
import trendLipstick from '../../assets/images/luxe/cat-makeup.jpg';
import { SectionHeading } from './SectionHeading';

export interface LuxeTrendingProduct {
  id: string;
  title: string;
  supplier: string;
  supplierId: string;
  image: string;
  moq: string;
  price: string;
  badge: string;
  badgeTone: 'gold' | 'purple' | 'green';
}

export const LUXE_TRENDING: LuxeTrendingProduct[] = [
  {
    id: 'product_vitc_101',
    title: 'Vitamin C Brightening Face Serum 30 ml — Amber Glass',
    supplier: 'Aura Beauty Labs',
    supplierId: 'sup-1',
    image: trendSerum,
    moq: 'MOQ 100 pcs',
    price: '₹120 — ₹150 / pc',
    badge: 'Bestseller',
    badgeTone: 'gold',
  },
  {
    id: 'product_barrier_102',
    title: 'Kumkumadi Night Repair Cream 50 g — Ayurvedic Formula',
    supplier: 'Dermaglow India',
    supplierId: 'sup-2',
    image: trendCream,
    moq: 'MOQ 200 pcs',
    price: '₹180 — ₹220 / pc',
    badge: 'Low MOQ',
    badgeTone: 'green',
  },
  {
    id: 'product_scalp_105',
    title: 'Argan Oil Repair Shampoo 200 ml — Sulphate-Free',
    supplier: 'BioTech Derma Labs',
    supplierId: 'sup-4',
    image: trendShampoo,
    moq: 'MOQ 500 pcs',
    price: '₹85 — ₹110 / pc',
    badge: 'Bulk Deal',
    badgeTone: 'purple',
  },
  {
    id: 'product_matte_104',
    title: 'Matte Liquid Lipstick — 12 Shades, Transfer-Proof',
    supplier: 'Prime Beauty Distribution',
    supplierId: 'sup-8',
    image: trendLipstick,
    moq: 'MOQ 300 pcs',
    price: '₹95 — ₹140 / pc',
    badge: 'Trending',
    badgeTone: 'gold',
  },
];

const BADGE_STYLES: Record<string, string> = {
  gold: 'bg-[#FBF3DF] text-[#8A6A2F] border-[#E2C98C]',
  purple: 'bg-[#F5EFF8] text-[#5B3B72] border-[#DCC8E6]',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

interface TrendingProductsProps {
  onViewDetails: (id: string) => void;
  onSendEnquiry: (title: string, supplier: string) => void;
  onViewAll: () => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({
  onViewDetails,
  onSendEnquiry,
  onViewAll,
}) => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20">
    <SectionHeading
      eyebrow="High-Demand Catalogue"
      title={
        <>
          Trending <span className="italic text-gold-gradient">B2B Products</span>
        </>
      }
      sub="Bulk-ready bestsellers with transparent MOQs and wholesale price slabs, refreshed weekly."
      action={
        <button
          onClick={onViewAll}
          className="hidden md:inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#3D1E4E] hover:text-[#54276E] border border-[#3D1E4E]/15 hover:border-[#C9A961] rounded-full px-5 py-2.5 transition-colors"
        >
          View all products <ArrowRight className="w-4 h-4 text-[#C9A961]" />
        </button>
      }
      align="left"
    />

    <div className="grid md:grid-cols-2 gap-5">
      {LUXE_TRENDING.map((p) => (
        <article
          key={p.id}
          className="luxe-card luxe-card-hover overflow-hidden flex flex-col sm:flex-row cursor-pointer"
          onClick={() => onViewDetails(p.id)}
        >
          {/* Photo */}
          <div className="relative sm:w-[188px] shrink-0 aspect-square sm:aspect-auto sm:min-h-[196px] overflow-hidden bg-[#F6EEF9]">
            <img
              src={p.image}
              alt={p.title}
              className="absolute inset-0 w-full h-full object-cover hover:scale-[1.05] transition-transform duration-500"
            />
            <span
              className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border backdrop-blur-sm ${BADGE_STYLES[p.badgeTone]}`}
            >
              <Flame className="w-3 h-3" /> {p.badge}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 p-5 flex flex-col">
            <h3 className="text-[14.5px] font-bold text-[#2A0E3F] leading-snug line-clamp-2">{p.title}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#6E5A7E]">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
              {p.supplier}
              <span className="text-[#D8C9DF]">·</span>
              <span className="text-[#9C8CA8]">Verified</span>
            </p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-semibold text-[#5B3B72] bg-[#F5EFF8] border border-[#E4D6E9] rounded-md px-2 py-1">
                {p.moq}
              </span>
              <span className="text-[14px] font-extrabold text-[#3D1E4E]">
                {p.price}
              </span>
            </div>

            <div className="mt-auto pt-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(p.id);
                }}
                className="flex-1 text-[12.5px] font-semibold text-[#3D1E4E] border border-[#3D1E4E]/25 hover:border-[#3D1E4E] hover:bg-[#F7F2FA] rounded-full px-4 py-2 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendEnquiry(p.title, p.supplier);
                }}
                className="flex-1 text-[12.5px] font-semibold text-white bg-royal-gradient hover:brightness-110 rounded-full px-4 py-2 shadow-[0_8px_18px_-8px_rgba(61,30,78,0.55)] transition-all"
              >
                Send Enquiry
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>

    <div className="mt-6 text-center md:hidden">
      <button
        onClick={onViewAll}
        className="text-[13.5px] font-semibold text-[#3D1E4E] border border-[#3D1E4E]/15 rounded-full px-5 py-2.5"
      >
        View all products →
      </button>
    </div>
  </section>
);
