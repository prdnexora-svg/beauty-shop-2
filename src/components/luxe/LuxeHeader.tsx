import React, { useState } from 'react';
import { MessageCircle, User, Plus, Menu, X, ShoppingBag, Building2, Gem, FlaskConical } from 'lucide-react';
import { BuyerProfileData } from '../EditProfileModal';
import { LuxeLogo } from './LuxeLogo';
import { navItemsFor, canPostRequirement, toViewer, accountScreenFor } from '../../lib/roleAccess';

interface LuxeHeaderProps {
  currentScreen: any;
  onNavigate: (screen: any, params?: any) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  userProfile?: BuyerProfileData;
  onOpenChat?: () => void;
}

export const LuxeHeader: React.FC<LuxeHeaderProps> = ({
  onNavigate,
  onOpenAuthModal,
  isLoggedIn,
  userRole,
  userProfile,
  onOpenChat,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Role-filtered navigation from the shared access policy.
  const viewer = toViewer(isLoggedIn, userRole);
  const navItems = navItemsFor(viewer).filter((i) => i.screen !== 'explore');
  const showRfqCta = canPostRequirement(viewer);

  const go = (screen: any) => {
    setMobileOpen(false);
    onNavigate(screen);
  };

  const initial = userProfile?.fullName?.[0]?.toUpperCase() || 'G';

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Gold hairline */}
      <div className="h-[3px] bg-gold-gradient" />
      <div className="bg-white/95 backdrop-blur-xl border-b border-[#E5D4ED] shadow-[0_4px_24px_-12px_rgba(42,14,63,0.18)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-[68px] flex items-center gap-4">
          {/* Logo */}
          <LuxeLogo compact onClick={() => go('explore')} className="shrink-0" />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.screen)}
                className="relative px-3.5 py-2 text-[13.5px] font-semibold text-[#4B3A5A] hover:text-[#3D1E4E] transition-colors group"
              >
                {item.label}
                <span className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] bg-gold-gradient rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right cluster */}
          <div className="flex items-center gap-2.5">
            {/* Chat with red notification dot */}
            <button
              onClick={onOpenChat}
              aria-label="Messages"
              className="relative w-10 h-10 rounded-full border border-[#EFE4F2] bg-white hover:bg-[#F7F2FA] hover:border-[#D9B96A] flex items-center justify-center text-[#3D1E4E] transition-all shadow-sm"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="absolute -top-0.5 -right-0.5 flex">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-[9px] h-[9px] rounded-full bg-[#E23A3A] border-2 border-white" />
              </span>
            </button>

            {/* Profile */}
            <button
              onClick={() => (isLoggedIn ? onNavigate(accountScreenFor(viewer)) : onOpenAuthModal('login'))}
              aria-label="Account"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border text-[13px] font-bold ${
                isLoggedIn
                  ? 'bg-royal-gradient text-white border-transparent'
                  : 'bg-white border-[#EFE4F2] text-[#3D1E4E] hover:bg-[#F7F2FA] hover:border-[#D9B96A]'
              }`}
            >
              {isLoggedIn ? initial : <User className="w-[18px] h-[18px]" />}
            </button>

            {/* Post Requirement pill — buyers only; suppliers answer RFQs. */}
            {showRfqCta && (
            <button
              onClick={() => onNavigate('post-rfq')}
              className="btn-shine hidden sm:inline-flex items-center gap-1.5 bg-royal-gradient hover:brightness-110 text-white text-[13px] font-semibold pl-4 pr-5 py-2.5 rounded-full ring-1 ring-[#C9A961]/70 hover:ring-[#C9A961] shadow-[0_8px_20px_-6px_rgba(61,30,78,0.5)] hover:shadow-[0_10px_26px_-6px_rgba(61,30,78,0.55)] transition-all hover:-translate-y-px"
            >
              <Plus className="relative z-10 w-4 h-4 text-[#E9D29A]" />
              <span className="relative z-10">Post Requirement</span>
            </button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="lg:hidden w-10 h-10 rounded-full border border-[#EFE4F2] bg-white flex items-center justify-center text-[#3D1E4E]"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#F0E6F3] bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.screen)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium text-[#3D1E4E] hover:bg-[#F7F2FA]"
              >
                {item.label}
              </button>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {showRfqCta && (
              <button
                onClick={() => go('post-rfq')}
                className="inline-flex items-center justify-center gap-1.5 bg-royal-gradient text-white text-[13px] font-semibold px-4 py-2.5 rounded-full"
              >
                <Plus className="w-4 h-4 text-[#E9D29A]" /> Post Requirement
              </button>
              )}
              <button
                onClick={() => go(isLoggedIn ? accountScreenFor(viewer) : 'explore')}
                className="inline-flex items-center justify-center gap-1.5 border border-[#3D1E4E]/20 text-[#3D1E4E] text-[13px] font-semibold px-4 py-2.5 rounded-full"
              >
                <ShoppingBag className="w-4 h-4" /> Home
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export const LUXE_QUICK_TABS = [
  { label: 'Products', icon: ShoppingBag, scope: 'products' },
  { label: 'Suppliers', icon: Building2, scope: 'suppliers' },
  { label: 'Brands', icon: Gem, scope: 'brands' },
  { label: 'OEM / Private Label', icon: FlaskConical, scope: 'oem' },
];
