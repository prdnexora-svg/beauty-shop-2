import React from 'react';
import { ArrowRight, UserPlus, Package, Megaphone } from 'lucide-react';
import supplierWoman from '../../assets/images/luxe/supplier-woman.jpg';

const STEPS = [
  { icon: UserPlus, label: 'Create Business Profile' },
  { icon: Package, label: 'List Your Products' },
  { icon: Megaphone, label: 'Get Buyer Leads & RFQs' },
];

export const SupplierCta: React.FC<{
  onJoin: () => void;
  onLogin: () => void;
}> = ({ onJoin, onLogin }) => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20">
    <div className="relative rounded-[24px] bg-[linear-gradient(135deg,#FBF5E9_0%,#F7EDDA_55%,#F3E6CC_100%)] border border-[#EDDDBC] overflow-hidden">
      {/* subtle decor */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#C9A961]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-[#8A4B9E]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid lg:grid-cols-[340px_1fr] gap-8 lg:gap-12 items-center p-7 md:p-12">
        {/* Portrait */}
        <div className="relative mx-auto w-full max-w-[340px]">
          <div className="rounded-2xl overflow-hidden border-4 border-white shadow-[0_24px_60px_-20px_rgba(42,14,63,0.35)]">
            <img
              src={supplierWoman}
              alt="Successful Indian beauty businesswoman"
              className="w-full h-[360px] object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#2A0E3F] text-white text-[11.5px] font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5">
            <span className="text-[#EFD9A0]">★</span> 2,400+ suppliers growing with us
          </div>
        </div>

        {/* Copy + actions */}
        <div className="text-center lg:text-left">
          <p className="text-[11px] font-bold tracking-[0.24em] uppercase text-[#B08D45] mb-2.5">For Suppliers &amp; Manufacturers</p>
          <h2 className="font-display text-[26px] md:text-[34px] font-semibold text-[#2A0E3F] leading-tight">
            Grow Your Beauty Business on <span className="italic text-gold-gradient">Nexora Luxe</span>
          </h2>
          <p className="mt-3 text-[14px] text-[#6E5A7E] leading-relaxed max-w-[520px] mx-auto lg:mx-0">
            Reach thousands of salons, retailers and brand owners actively sourcing every day.
            List your catalogue, respond to live RFQs and win repeat bulk orders.
          </p>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {STEPS.map((s) => (
              <div
                key={s.label}
                className="flex sm:flex-col items-center gap-3 sm:gap-2.5 bg-white/70 backdrop-blur-sm border border-[#EDDDBC] rounded-xl px-4 py-4"
              >
                <span className="w-10 h-10 rounded-full bg-royal-gradient flex items-center justify-center shrink-0 shadow-md">
                  <s.icon className="w-[18px] h-[18px] text-[#EFD9A0]" />
                </span>
                <span className="text-[12.5px] font-semibold text-[#2A0E3F] leading-snug">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onJoin}
              className="inline-flex items-center gap-2 bg-royal-gradient hover:brightness-110 text-white text-[14.5px] font-semibold px-8 py-3.5 rounded-full shadow-[0_14px_30px_-10px_rgba(61,30,78,0.5)] transition-all hover:-translate-y-px"
            >
              Join as Supplier <ArrowRight className="w-4 h-4 text-[#EFD9A0]" />
            </button>
            <button
              onClick={onLogin}
              className="text-[13.5px] font-semibold text-[#3D1E4E] underline decoration-[#C9A961] decoration-2 underline-offset-4 hover:text-[#54276E] transition-colors"
            >
              Already registered? Supplier Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
