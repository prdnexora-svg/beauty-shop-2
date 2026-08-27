import React from 'react';

/**
 * GoldDivider — an ornamental hairline with a diamond & sparkles motif,
 * used between home sections for a luxe editorial rhythm.
 */
export const GoldDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`max-w-[1280px] mx-auto px-4 md:px-6 ${className}`} aria-hidden="true">
    <div className="relative flex items-center justify-center">
      <div className="gold-divider flex-1" />
      <span className="mx-4 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#C9A961]/70" />
        <span
          className="w-2 h-2 bg-gold-gradient rotate-45 rounded-[2px] shadow-[0_0_10px_rgba(201,169,97,0.5)]"
        />
        <span className="w-1 h-1 rounded-full bg-[#C9A961]/70" />
      </span>
      <div className="gold-divider flex-1" />
    </div>
  </div>
);
