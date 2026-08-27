import React from 'react';
import { Sparkle } from 'lucide-react';

interface LuxeLogoProps {
  /** White text variant for dark surfaces (footer, hero) */
  dark?: boolean;
  /** Slightly smaller sizing for the header bar */
  compact?: boolean;
  /** Optional SPA navigation — prevents the default anchor reload when set */
  onClick?: () => void;
  className?: string;
}

/**
 * NEXORA LUXE logo — gradient monogram tile with a pulsing gold pip,
 * Playfair "NEXORA" and gold "L U X E". Hover: springy scale + gold
 * drop-shadow (`.logo-luxe`), NEXORA glows gold (`.logo-nexora`),
 * LUXE letter-spacing expands (`.logo-luxe-text`).
 */
export const LuxeLogo: React.FC<LuxeLogoProps> = ({ dark, compact, onClick, className = '' }) => (
  <a
    href="/"
    onClick={(e) => {
      if (onClick) {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label="Nexora Luxe home"
    className={`logo-luxe flex items-center gap-2 select-none ${className}`}
  >
    {/* Icon */}
    <div className="relative shrink-0">
      <div
        className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl bg-gradient-to-br from-luxe-purple to-luxe-purple-light flex items-center justify-center shadow-luxe`}
      >
        <Sparkle className={`${compact ? 'w-[18px] h-[18px]' : 'w-5 h-5'} text-luxe-gold`} fill="#C9A961" />
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-luxe-gold rounded-full animate-pulse opacity-70" />
    </div>

    {/* Text */}
    <div className="flex flex-col leading-none">
      <span
        className={`logo-nexora font-serif ${compact ? 'text-[21px]' : 'text-2xl'} font-bold ${
          dark ? 'text-white' : 'text-luxe-purple'
        } transition-all duration-400`}
      >
        NEXORA
      </span>
      <span className="logo-luxe-text text-[10px] tracking-[3px] text-luxe-gold font-light transition-all duration-400 mt-0.5">
        L U X E
      </span>
    </div>
  </a>
);

export default LuxeLogo;
