import React from 'react';
import { ShieldCheck, Zap, Sparkles, CheckCircle2, TrendingUp, Clock, FileText } from 'lucide-react';

interface FloatingStatusCardsProps {
  position?: 'left' | 'right' | 'hero-flank';
}

export const FloatingStatusCards: React.FC<FloatingStatusCardsProps> = ({ position = 'hero-flank' }) => {
  return (
    <>
      {/* Floating Card 1: Verified AI Match Status (Top Left / Floating) */}
      <div className="relative group transition-all duration-500 hover:scale-105 nl-float pointer-events-auto">
        <div className="glass-card-dark rounded-2xl p-3 md:p-3.5 border border-white/40 shadow-[0_15px_35px_rgba(42,14,63,0.4)] backdrop-blur-md flex items-center gap-3 bg-[#2A0E3F]/75 max-w-[240px]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6B2D8C] to-[#C9A961] flex items-center justify-center shrink-0 shadow-sm relative">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#2A0E3F] animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#2A0E3F]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-[#EFD9A0] uppercase tracking-wider">
                AI Matchmaker
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live
              </span>
            </div>
            <div className="text-[12px] font-bold text-white truncate mt-0.5">
              99.4% Supplier Match
            </div>
            <div className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-[#EFD9A0]" />
              <span>Responds in &lt; 2 hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Card 2: Instant RFQ Broadcast (Top Right / Floating) */}
      <div className="relative group transition-all duration-500 hover:scale-105 nl-float-delayed pointer-events-auto">
        <div className="glass-card-dark rounded-2xl p-3 md:p-3.5 border border-[#C9A961]/50 shadow-[0_15px_35px_rgba(42,14,63,0.4)] backdrop-blur-md flex items-center gap-3 bg-[#3D1E4E]/80 max-w-[240px]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C9A961] to-[#E8C547] flex items-center justify-center shrink-0 shadow-sm text-[#2A0E3F]">
            <Zap className="w-5 h-5 fill-current animate-bounce" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#EFD9A0] uppercase tracking-wider">
                Instant RFQ Broadcast
              </span>
            </div>
            <div className="text-[12px] font-bold text-white truncate mt-0.5">
              48 OEM Labs Online
            </div>
            <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp API Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Card 3: Bulk Pricing Tiers Ticker (Bottom Floating) */}
      <div className="relative group transition-all duration-500 hover:scale-105 nl-float pointer-events-auto">
        <div className="glass-card-dark rounded-2xl p-3 md:p-3.5 border border-white/35 shadow-[0_15px_35px_rgba(42,14,63,0.4)] backdrop-blur-md flex items-center gap-3 bg-[#2A0E3F]/75 max-w-[240px]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8236A0] to-[#6B2D8C] flex items-center justify-center shrink-0 shadow-sm">
            <TrendingUp className="w-5 h-5 text-[#EFD9A0]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-[#EFD9A0] uppercase tracking-wider">
              Bulk Price Tiers
            </span>
            <div className="text-[12px] font-bold text-white truncate mt-0.5">
              ₹340 / unit (Low MOQ 100)
            </div>
            <div className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-[#EFD9A0]" />
              <span>Direct Factory Rates</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
