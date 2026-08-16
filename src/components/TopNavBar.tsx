import React, { useState, useEffect, useRef } from 'react';
import { MapPin, PlusCircle, User, ShieldCheck, Search, Bookmark, BookmarkCheck } from 'lucide-react';

interface TopNavBarProps {
  currentScreen: 'explore' | 'search' | 'plp' | 'suppliers' | 'supplier-profile' | 'brands' | 'oem' | 'rfq' | 'workspace' | 'inbox' | 'supplier-portal' | 'packaging-studio';
  onNavigate: (screen: 'explore' | 'search' | 'plp' | 'suppliers' | 'supplier-profile' | 'brands' | 'oem' | 'rfq' | 'workspace' | 'inbox' | 'supplier-portal' | 'packaging-studio', params?: any) => void;
  onOpenRFQModal: () => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  savedSuppliersCount?: number;
  isSavedPulsing?: boolean;
  onScrollToSaved?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentScreen,
  onNavigate,
  onOpenRFQModal,
  selectedLocation,
  onLocationChange,
  onOpenAuthModal,
  savedSuppliersCount = 0,
  isSavedPulsing = false,
  onScrollToSaved,
}) => {
  const [isHeartbeating, setIsHeartbeating] = useState(false);
  const prevCountRef = useRef(savedSuppliersCount);

  // Trigger heartbeat pulse when savedSuppliersCount increases or isSavedPulsing is true
  useEffect(() => {
    if (isSavedPulsing || savedSuppliersCount > prevCountRef.current) {
      setIsHeartbeating(true);
      const timer = setTimeout(() => {
        setIsHeartbeating(false);
      }, 1400);
      prevCountRef.current = savedSuppliersCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = savedSuppliersCount;
  }, [savedSuppliersCount, isSavedPulsing]);
  return (
    <header className="sticky top-0 z-40 bg-[#fdf8f8]/95 backdrop-blur-md border-b border-[#e8e8e8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 h-20 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div
          onClick={() => onNavigate('explore')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#b90064] flex items-center justify-center shadow-sm text-white overflow-hidden p-1.5 transition-transform group-hover:scale-105">
            {/* Nexora stylized logo mark */}
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
              <path d="M25 20V80M25 20H35V80H25M25 35L70 75M70 20V80M70 20H80V80H70" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="75" cy="30" r="10" stroke="currentColor" strokeWidth="6"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-2xl tracking-tight text-[#b90064] font-sans">Nexora Luxe</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064]">B2B SOURCING</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => onNavigate('explore')}
            className={`text-[13px] font-semibold pb-1 transition-all ${
              currentScreen === 'explore'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => onNavigate('plp')}
            className={`text-[13px] font-semibold pb-1 transition-all ${
              currentScreen === 'plp'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => onNavigate('suppliers')}
            className={`text-[13px] font-semibold pb-1 transition-all ${
              currentScreen === 'suppliers'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => onNavigate('brands')}
            className={`text-[13px] font-semibold pb-1 transition-all ${
              currentScreen === 'brands'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            Brands
          </button>
          <button
            onClick={() => onNavigate('oem')}
            className={`text-[13px] font-semibold pb-1 transition-all ${
              currentScreen === 'oem'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            OEM Hub
          </button>
          <button
            onClick={() => onNavigate('inbox')}
            className={`text-[13px] font-semibold pb-1 transition-all flex items-center gap-1 ${
              currentScreen === 'inbox'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            <span>B2B Inbox</span>
            <span className="text-[9.5px] bg-[#e6007e] text-white px-1.5 py-0.2 rounded-full font-bold">Negotiate</span>
          </button>
          <button
            onClick={() => onNavigate('packaging-studio')}
            className={`text-[13px] font-semibold pb-1 transition-all ${
              currentScreen === 'packaging-studio'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            Bottle Studio
          </button>
          <button
            onClick={() => onNavigate('supplier-portal')}
            className={`text-[13px] font-semibold pb-1 transition-all flex items-center gap-1 ${
              currentScreen === 'supplier-portal'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            <span>Supplier Portal</span>
            <span className="text-[9.5px] bg-[#0050d6] text-white px-1.5 py-0.2 rounded-full font-bold">Admin</span>
          </button>
          <button
            onClick={() => onNavigate('workspace')}
            className={`text-[13px] font-semibold pb-1 transition-all flex items-center gap-1.5 ${
              currentScreen === 'workspace'
                ? 'text-[#b90064] border-b-2 border-[#b90064]'
                : 'text-[#594047] hover:text-[#b90064]'
            }`}
          >
            <span>Transaction Hub</span>
            <span className="text-[9.5px] bg-[#0050d6] text-white px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">PI/PO</span>
          </button>
          <button
            onClick={() => {
              onNavigate('explore');
              setTimeout(() => {
                const el = document.getElementById('sourcing-trends-dashboard');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-[13px] font-semibold text-[#594047] hover:text-[#b90064] pb-1 transition-colors flex items-center gap-1"
          >
            <span>Sourcing Trends</span>
            <span className="w-2 h-2 rounded-full bg-[#e6007e] animate-pulse"></span>
          </button>
          <button
            onClick={() => {
              if (onScrollToSaved) {
                onScrollToSaved();
              } else {
                onNavigate('explore');
                setTimeout(() => {
                  const el = document.getElementById('my-saved-suppliers');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className={`text-[13px] font-semibold pb-1 transition-all flex items-center gap-1.5 ${
              isHeartbeating ? 'text-[#b90064]' : 'text-[#594047] hover:text-[#b90064]'
            }`}
            title="View saved suppliers"
          >
            <span className="relative inline-flex items-center justify-center">
              <Bookmark
                className={`w-3.5 h-3.5 text-[#b90064] transition-transform ${
                  isHeartbeating ? 'animate-heartbeat fill-[#b90064]' : ''
                }`}
              />
              {isHeartbeating && (
                <span className="absolute inset-0 rounded-full bg-[#e6007e]/20 animate-ping pointer-events-none" />
              )}
            </span>
            <span>My Saved</span>
            {savedSuppliersCount > 0 && (
              <span
                className={`text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full transition-all duration-300 ${
                  isHeartbeating
                    ? 'bg-[#e6007e] scale-110 shadow-xs ring-2 ring-[#ffd9e2]'
                    : 'bg-[#b90064]'
                }`}
              >
                {savedSuppliersCount}
              </span>
            )}
          </button>
        </nav>


        {/* Trailing Actions */}
        <div className="flex items-center gap-4">
          
          {/* Location Selector */}
          <div className="hidden md:flex items-center gap-1.5 border-r border-[#e8e8e8] pr-4 text-[#594047]">
            <MapPin className="w-4 h-4 text-[#b90064]" />
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="bg-transparent text-[13px] font-medium text-[#594047] focus:outline-none cursor-pointer pr-2"
            >
              <option value="All">All Locations</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi NCR</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          {/* Login / Register */}
          <div className="hidden sm:flex items-center gap-2 text-[#594047]">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="text-[13px] font-semibold px-3 py-2 hover:text-[#b90064] transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => onOpenAuthModal('register')}
              className="text-[13px] font-semibold px-3 py-2 hover:text-[#b90064] transition-colors"
            >
              Register
            </button>
          </div>

          {/* Primary CTA: Post Requirement */}
          <button
            onClick={() => onNavigate('rfq')}
            className={`text-[13px] font-bold px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-98 cursor-pointer ${
              currentScreen === 'rfq'
                ? 'bg-[#8e004b] text-white ring-2 ring-[#ffd9e2]'
                : 'bg-[#b90064] hover:bg-[#8e004b] text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Requirement</span>
          </button>
        </div>

      </div>
    </header>
  );
};
