import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

interface FooterProps {
  onOpenRFQModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenRFQModal, onOpenAuthModal }) => {
  return (
    <footer className="bg-[#1c1b1b] text-white border-t border-[#313030] pt-16 pb-12">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#313030]">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#b90064] flex items-center justify-center text-white overflow-hidden p-1.5 shadow-sm">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                  <path d="M25 20V80M25 20H35V80H25M25 35L70 75M70 20V80M70 20H80V80H70" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="75" cy="30" r="10" stroke="currentColor" strokeWidth="6"/>
                </svg>
              </div>
              <span className="font-bold text-2xl tracking-tight text-white font-sans">Nexora Luxe</span>
            </div>

            <p className="text-[13px] text-[#ddd9d8] max-w-sm leading-relaxed">
              India's premier B2B marketplace bridging professional buyers with verified beauty manufacturers, wholesalers, distributors, and contract OEM formulators.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[12px] text-[#ffd9e2]">
              <ShieldCheck className="w-4 h-4 text-[#e6007e]" />
              <span>100% Verified Indian Beauty Manufacturer Network</span>
            </div>
          </div>

          {/* Sourcing Categories */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#ffd9e2]">Sourcing Hub</h4>
            <ul className="space-y-2 text-[13px] text-[#ddd9d8]">
              <li><a href="#explore" className="hover:text-[#e6007e] transition-colors">Skincare Formulations</a></li>
              <li><a href="#explore" className="hover:text-[#e6007e] transition-colors">Hair Care &amp; Treatments</a></li>
              <li><a href="#explore" className="hover:text-[#e6007e] transition-colors">Salon Equipment &amp; Spa</a></li>
              <li><a href="#explore" className="hover:text-[#e6007e] transition-colors">Cosmetics &amp; Pigments</a></li>
              <li><a href="#explore" className="hover:text-[#e6007e] transition-colors">Cosmetic Packaging &amp; Bottles</a></li>
            </ul>
          </div>

          {/* Business Tools */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#ffd9e2]">For Businesses</h4>
            <ul className="space-y-2 text-[13px] text-[#ddd9d8]">
              <li>
                <button onClick={onOpenRFQModal} className="hover:text-[#e6007e] transition-colors text-left">
                  Post Requirement (RFQ)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuthModal('register')} className="hover:text-[#e6007e] transition-colors text-left">
                  Supplier Registration
                </button>
              </li>
              <li><a href="#suppliers" className="hover:text-[#e6007e] transition-colors">Supplier Directory</a></li>
              <li><a href="#oem" className="hover:text-[#e6007e] transition-colors">OEM / Private Label</a></li>
              <li><a href="#deals" className="hover:text-[#e6007e] transition-colors">Bulk Sourcing Deals</a></li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#ffd9e2]">B2B Helpdesk</h4>
            <ul className="space-y-2 text-[13px] text-[#ddd9d8]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#e6007e]" />
                <span>support@nexoraluxe.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#e6007e]" />
                <span>+91 (022) 6900-5544</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#e6007e]" />
                <span>BKC, Mumbai • CP, New Delhi</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#8c7077]">
          <div>
            &copy; {new Date().getFullYear()} Nexora Luxe Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Sourcing</a>
            <a href="#" className="hover:text-white transition-colors">Verification Standards</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
