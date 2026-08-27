import React, { useState } from 'react';
import { BadgeCheck, ClipboardList, MessagesSquare, ArrowRight, Phone } from 'lucide-react';

interface BuySmartCardProps {
  onGetQuotes: (requirement: string, quantity: string, contact: string) => void;
  onPostDetailed: () => void;
}

const POINTS = [
  { icon: BadgeCheck, title: 'Verified Suppliers', desc: 'Every manufacturer is GST & business verified' },
  { icon: ClipboardList, title: 'Multiple Quotes', desc: 'Compare bulk prices, MOQs & terms side-by-side' },
  { icon: MessagesSquare, title: 'Direct Communication', desc: 'Talk to decision-makers — no middlemen' },
];

export const BuySmartCard: React.FC<BuySmartCardProps> = ({ onGetQuotes, onPostDetailed }) => {
  const [requirement, setRequirement] = useState('');
  const [quantity, setQuantity] = useState('');
  const [contact, setContact] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onGetQuotes(requirement, quantity, contact);
  };

  return (
    <div className="relative z-20 max-w-[1280px] mx-auto px-4 md:px-6 -mt-16 md:-mt-20">
      <div className="bg-white rounded-2xl border border-[#EFE4F2] shadow-[0_28px_70px_-24px_rgba(42,14,63,0.28)] overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_1.15fr]">
          {/* Left — value props */}
          <div className="p-7 md:p-10 bg-[linear-gradient(160deg,#FBF7FC_0%,#F6EEF9_100%)] border-b lg:border-b-0 lg:border-r border-[#EFE4F2]">
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#B08D45] uppercase mb-2">Smart Sourcing</p>
            <h2 className="font-display text-[26px] md:text-[32px] font-semibold text-[#2A0E3F] leading-tight">
              Buy Smart. <span className="italic text-gold-gradient">Source Better.</span>
            </h2>

            <ul className="mt-7 space-y-5">
              {POINTS.map((p) => (
                <li key={p.title} className="flex items-start gap-4">
                  <span className="w-11 h-11 shrink-0 rounded-full bg-royal-gradient shadow-[0_8px_18px_-6px_rgba(61,30,78,0.5)] flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-[#EFD9A0]" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-[#2A0E3F]">{p.title}</span>
                    <span className="block text-[13px] text-[#6E5A7E] mt-0.5">{p.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — quick quote form */}
          <form onSubmit={submit} className="p-7 md:p-10">
            <h3 className="text-[16px] font-bold text-[#2A0E3F]">Tell us what you need — get quotes free</h3>

            <div className="mt-5 grid sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-[#6E5A7E] mb-1.5">Product / Requirement</label>
                <input
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="e.g. Vitamin C face serum 30ml, private label"
                  className="w-full border border-[#E4D6E9] rounded-xl px-4 py-3 text-[13.5px] text-[#2A0E3F] placeholder:text-[#B0A0BC] outline-none focus:border-[#3D1E4E] focus:ring-2 focus:ring-[#3D1E4E]/10 transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6E5A7E] mb-1.5">Quantity</label>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500 pcs"
                  className="w-full border border-[#E4D6E9] rounded-xl px-4 py-3 text-[13.5px] text-[#2A0E3F] placeholder:text-[#B0A0BC] outline-none focus:border-[#3D1E4E] focus:ring-2 focus:ring-[#3D1E4E]/10 transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#6E5A7E] mb-1.5">City / Mobile</label>
                <div className="flex items-center border border-[#E4D6E9] rounded-xl overflow-hidden focus-within:border-[#3D1E4E] focus-within:ring-2 focus-within:ring-[#3D1E4E]/10 transition">
                  <span className="pl-3.5 pr-2 py-3 text-[13.5px] font-semibold text-[#3D1E4E] bg-[#F7F2FA] border-r border-[#E4D6E9] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#C9A961]" /> +91
                  </span>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full px-3 py-3 text-[13.5px] text-[#2A0E3F] placeholder:text-[#B0A0BC] outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-royal-gradient hover:brightness-110 text-white text-[14.5px] font-semibold py-3.5 rounded-xl transition-all shadow-[0_14px_30px_-10px_rgba(61,30,78,0.55)] hover:-translate-y-px"
            >
              Get Supplier Quotes <ArrowRight className="w-[18px] h-[18px] text-[#EFD9A0]" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onPostDetailed}
                className="text-[13px] font-semibold text-[#3D1E4E] underline decoration-[#C9A961] decoration-2 underline-offset-4 hover:text-[#54276E] transition-colors"
              >
                Post Detailed Requirement
              </button>
              <span className="text-[#C9A961]">→</span>
            </div>
            <p className="mt-2 text-center text-[11.5px] text-[#9C8CA8]">
              Free to post · First quotes within 24 hours · 100% privacy protected
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
