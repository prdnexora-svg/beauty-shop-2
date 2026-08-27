import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';
import { LuxeLogo } from './LuxeHeader';

interface LuxeFooterProps {
  onNavigate: (screen: any, params?: any) => void;
  onOpenRFQModal: () => void;
}

const COLUMNS: { title: string; links: { label: string; action: 'screen' | 'rfq'; screen?: string }[] }[] = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Browse Products', action: 'screen', screen: 'plp' },
      { label: 'Verified Suppliers', action: 'screen', screen: 'supplier-directory' },
      { label: 'Brand Directory', action: 'screen', screen: 'brands' },
      { label: 'OEM / Private Label', action: 'screen', screen: 'oem-hub' },
      { label: 'Live Sourcing Requests', action: 'rfq' },
    ],
  },
  {
    title: 'Buyers',
    links: [
      { label: 'Post Requirement', action: 'rfq' },
      { label: 'Get Supplier Quotes', action: 'rfq' },
      { label: 'RFQ Tracking', action: 'screen', screen: 'buyer-dashboard' },
      { label: 'Sample Requests', action: 'screen', screen: 'buyer-dashboard' },
      { label: 'Buyer Dashboard', action: 'screen', screen: 'buyer-dashboard' },
    ],
  },
  {
    title: 'Suppliers',
    links: [
      { label: 'Join as Supplier', action: 'screen', screen: 'onboarding' },
      { label: 'Supplier Portal', action: 'screen', screen: 'supplier-portal' },
      { label: 'Verification Center', action: 'screen', screen: 'supplier-verification' },
      { label: 'Advertise with Us', action: 'screen', screen: 'supplier-portal' },
      { label: 'OEM Solutions', action: 'screen', screen: 'oem-hub' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', action: 'rfq' },
      { label: 'Contact Us', action: 'rfq' },
      { label: 'Trust & Safety', action: 'rfq' },
      { label: 'Blog & Resources', action: 'rfq' },
      { label: 'Report a Listing', action: 'rfq' },
    ],
  },
];

const SOCIALS = [Facebook, Instagram, Linkedin, Youtube];

export const LuxeFooter: React.FC<LuxeFooterProps> = ({ onNavigate, onOpenRFQModal }) => {
  const handle = (l: { action: 'screen' | 'rfq'; screen?: string }) =>
    l.action === 'screen' && l.screen ? onNavigate(l.screen) : onOpenRFQModal();

  return (
    <footer className="relative overflow-hidden bg-[#241033] text-white mt-4">
      {/* top gold hairline */}
      <div className="h-[3px] bg-gold-gradient" />
      <div className="absolute -top-24 right-1/4 w-[420px] h-[420px] rounded-full bg-[#6B3585]/25 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-[#C9A961]/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 pt-14 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_repeat(4,1fr)]">
          {/* Brand block */}
          <div>
            <LuxeLogo dark />
            <p className="mt-4 text-[13px] leading-relaxed text-white/60 max-w-[280px]">
              India's premium B2B beauty sourcing network — connecting professional buyers with
              verified manufacturers, wholesalers &amp; OEM private-label partners.
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map((Icon, i) => (
                <button
                  key={i}
                  aria-label="Social link"
                  className="w-9 h-9 rounded-full border border-white/15 hover:border-[#C9A961] hover:bg-white/5 flex items-center justify-center text-white/70 hover:text-[#EFD9A0] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="mt-6 inline-flex items-center gap-3 bg-white/[0.06] border border-[#C9A961]/40 rounded-xl px-4 py-3">
              <ShieldCheck className="w-8 h-8 text-[#EFD9A0]" />
              <span>
                <span className="block text-[13px] font-bold text-white">Trusted. Verified. Connected.</span>
                <span className="block text-[10.5px] text-white/50 mt-0.5">ISO 27001 secure platform · 100% GST-audited network</span>
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11.5px] font-bold tracking-[0.22em] uppercase text-[#EFD9A0] mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => handle(l)}
                      className="group inline-flex items-center gap-1 text-[13px] text-white/60 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 text-[#C9A961] opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/45">
            © 2026 Nexora Luxe Technologies Pvt. Ltd. All rights reserved. · Made in India 🇮🇳
          </p>
          <div className="flex items-center gap-2 text-[12px] text-white/45">
            <MapPin className="w-3.5 h-3.5 text-[#C9A961]" />
            <span>Mumbai · Delhi NCR · Bengaluru</span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-white/45">
            <button className="hover:text-white transition-colors">Privacy Policy</button>
            <button className="hover:text-white transition-colors">Terms of Use</button>
            <button className="hover:text-white transition-colors">Sitemap</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
