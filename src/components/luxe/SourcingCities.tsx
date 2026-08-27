import React from 'react';
import { SectionHeading } from './SectionHeading';

/* Simplified landmark line icons — purple strokes with gold accents */
const LANDMARKS: Record<string, React.ReactNode> = {
  Mumbai: (
    <>
      {/* Gateway of India */}
      <path d="M8.2 20v-7.2a3.8 3.8 0 0 1 7.6 0V20" />
      <path d="M5.2 20V8.6M18.8 20V8.6" />
      <path d="M4.2 8.6h2M17.8 8.6h2" className="stroke-[#C9A961]" />
      <circle cx="12" cy="5.6" r="1.1" className="stroke-[#C9A961]" />
      <path d="M3.4 20h17.2" />
    </>
  ),
  'Delhi NCR': (
    <>
      {/* India Gate */}
      <path d="M6.4 20V8.4h3.2v3.4h4.8V8.4h3.2V20" />
      <path d="M6.4 12.6h11.2" className="stroke-[#C9A961]" />
      <path d="M4.4 20h15.2" />
      <path d="M5.4 8.4h13.2" />
      <path d="M12 8.4V5.6" className="stroke-[#C9A961]" />
      <circle cx="12" cy="4.6" r="1" className="stroke-[#C9A961]" />
    </>
  ),
  Bengaluru: (
    <>
      {/* Garden city skyline */}
      <path d="M5.4 20V11h4.2v9" />
      <path d="M13.4 20V6.4h4.8V20" />
      <path d="M15.2 9.2h1.2M15.2 12h1.2M15.2 14.8h1.2" className="stroke-[#C9A961]" />
      <path d="M7 14h1M7 16.8h1" />
      <path d="M3.4 20h17.2" />
      <path d="M8.6 7.2c.9-2 3-2.6 4.1-2.4-.3 1.5-1.8 2.9-4.1 2.4z" className="stroke-[#C9A961]" />
    </>
  ),
  Ahmedabad: (
    <>
      {/* Sidi Saiyyed lattice arch */}
      <path d="M7.6 20v-8a4.4 4.4 0 0 1 8.8 0v8" />
      <path d="M10.4 19.6v-6.4M13.6 19.6v-6.4" className="stroke-[#C9A961]" />
      <path d="M12 13.6l1.3 1.7-1.3 1.7-1.3-1.7z" className="stroke-[#C9A961]" />
      <path d="M5.6 20V9.4M18.4 20V9.4" />
      <path d="M3.6 20h16.8" />
    </>
  ),
  Pune: (
    <>
      {/* Shaniwar Wada gate */}
      <path d="M6 20v-8.4h12V20" />
      <path d="M6 11.6V10M9 11.6V10M12 11.6V10M15 11.6V10M18 11.6V10" className="stroke-[#C9A961]" />
      <path d="M9.6 20v-4.4a2.4 2.4 0 0 1 4.8 0V20" />
      <path d="M12 10V5.8h3.4l-1 1.2 1 1.2H12" className="stroke-[#C9A961]" />
      <path d="M4 20h16" />
    </>
  ),
  Surat: (
    <>
      {/* Diamond city */}
      <path d="M12 4.4l6 5.2L12 20 6 9.6z" />
      <path d="M6 9.6h12" className="stroke-[#C9A961]" />
      <path d="M9.2 9.6L12 4.4l2.8 5.2M9.2 9.6L12 20l2.8-10.4" className="stroke-[#C9A961]" />
    </>
  ),
  Hyderabad: (
    <>
      {/* Charminar */}
      <path d="M8.2 20v-9.4h7.6V20" />
      <path d="M7 10.6l1.6-2.8h6.8l1.6 2.8" />
      <path d="M12 7.8V5.8" className="stroke-[#C9A961]" />
      <path d="M5.4 20V9.8M18.6 20V9.8" />
      <path d="M4.6 9.8h1.6M17.8 9.8h1.6" className="stroke-[#C9A961]" />
      <path d="M10.6 20v-4.6a1.4 1.4 0 0 1 2.8 0V20" />
      <path d="M3.8 20h16.4" />
    </>
  ),
  Chennai: (
    <>
      {/* Shore temple tiers */}
      <path d="M7.4 20v-2.6h9.2V20" />
      <path d="M9.2 17.4v-2.4h5.6v2.4" />
      <path d="M10.8 15v-2h2.4v2" />
      <path d="M10.6 13l1.4-2.2L13.4 13z" className="stroke-[#C9A961]" />
      <path d="M5.8 20h12.4" />
    </>
  ),
};

const CITIES = [
  { name: 'Mumbai', count: '5,400+ suppliers' },
  { name: 'Delhi NCR', count: '4,800+ suppliers' },
  { name: 'Bengaluru', count: '3,200+ suppliers' },
  { name: 'Ahmedabad', count: '2,900+ suppliers' },
  { name: 'Pune', count: '2,600+ suppliers' },
  { name: 'Surat', count: '2,100+ suppliers' },
  { name: 'Hyderabad', count: '1,900+ suppliers' },
  { name: 'Chennai', count: '1,700+ suppliers' },
];

export const SourcingCities: React.FC<{ onCityClick: (city: string) => void }> = ({ onCityClick }) => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20">
    <SectionHeading
      eyebrow="Pan-India Network"
      title={
        <>
          Top <span className="italic text-gold-gradient">Sourcing Cities</span>
        </>
      }
      sub="Follow the trade — discover manufacturing hubs where India's beauty supply chain lives."
    />

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
      {CITIES.map((c) => (
        <button
          key={c.name}
          onClick={() => onCityClick(c.name)}
          className="luxe-card luxe-card-hover group px-5 py-4 flex items-center gap-4 text-left"
        >
          <span className="w-12 h-12 shrink-0 rounded-full bg-[#F5EFF8] border border-[#E4D6E9] group-hover:border-[#C9A961] flex items-center justify-center transition-colors">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3D1E4E"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[26px] h-[26px]"
            >
              {LANDMARKS[c.name]}
            </svg>
          </span>
          <span>
            <span className="block text-[14px] font-bold text-[#2A0E3F] group-hover:text-[#54276E]">{c.name}</span>
            <span className="block text-[11.5px] text-[#9C8CA8] mt-0.5">{c.count}</span>
          </span>
        </button>
      ))}
    </div>
  </section>
);
