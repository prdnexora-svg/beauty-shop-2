import React from 'react';
import { ArrowRight, FileText, MailOpen, Handshake } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    n: '1',
    icon: FileText,
    title: 'Post Requirement',
    desc: 'Tell us the product, quantity and city — it takes under 2 minutes and is completely free.',
  },
  {
    n: '2',
    icon: MailOpen,
    title: 'Get Multiple Quotes',
    desc: 'Verified suppliers respond with bulk pricing, MOQs and samples — compare side-by-side.',
  },
  {
    n: '3',
    icon: Handshake,
    title: 'Connect Directly',
    desc: 'Chat, call and negotiate with decision-makers. No commissions, no middlemen.',
  },
];

export const HowItWorks: React.FC<{ onPost: () => void }> = ({ onPost }) => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-20 md:pb-24">
    <SectionHeading
      eyebrow="Simple by Design"
      title={
        <>
          How <span className="italic text-gold-gradient">Nexora Luxe</span> Works
        </>
      }
      sub="From requirement to handshake in three effortless steps."
    />

    <div className="relative grid md:grid-cols-3 gap-6">
      {/* connector line */}
      <div className="hidden md:block absolute top-[52px] left-[22%] right-[22%] h-px bg-[linear-gradient(90deg,#E4D6E9,#C9A961,#E4D6E9)]" />

      {STEPS.map((s) => (
        <div key={s.n} className="relative text-center luxe-card luxe-card-hover px-7 py-9">
          <div className="relative mx-auto w-[72px] h-[72px]">
            <span className="absolute inset-0 rounded-full bg-royal-gradient shadow-[0_14px_30px_-10px_rgba(61,30,78,0.6)] flex items-center justify-center ring-4 ring-white">
              <s.icon className="w-7 h-7 text-[#EFD9A0]" />
            </span>
            <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gold-gradient text-[#2A0E3F] text-[13px] font-extrabold flex items-center justify-center shadow-md">
              {s.n}
            </span>
          </div>
          <h3 className="mt-5 text-[16.5px] font-bold text-[#2A0E3F]">{s.title}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6E5A7E] max-w-[280px] mx-auto">{s.desc}</p>
        </div>
      ))}
    </div>

    <div className="mt-9 text-center">
      <button
        onClick={onPost}
        className="inline-flex items-center gap-2 bg-royal-gradient hover:brightness-110 text-white text-[14.5px] font-semibold px-9 py-3.5 rounded-full shadow-[0_14px_30px_-10px_rgba(61,30,78,0.5)] transition-all hover:-translate-y-px"
      >
        Post Your First Requirement <ArrowRight className="w-4 h-4 text-[#EFD9A0]" />
      </button>
    </div>
  </section>
);
