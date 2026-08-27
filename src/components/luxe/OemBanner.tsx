import React from 'react';
import { ArrowRight, FlaskConical, ShieldCheck, Package } from 'lucide-react';
import oemFlowers from '../../assets/images/luxe/oem-flowers.jpg';
import oemPerfume from '../../assets/images/luxe/oem-perfume.jpg';
import { Sparkles } from './Sparkles';

const FEATURES = [
  { icon: FlaskConical, label: 'Custom Formulation' },
  { icon: ShieldCheck, label: 'Regulatory Support' },
  { icon: Package, label: 'Premium Packaging' },
];

export const OemBanner: React.FC<{
  onExplore: () => void;
  onPostRequirement: () => void;
}> = ({ onExplore }) => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-16 md:pt-20">
    <div className="relative rounded-[24px] overflow-hidden shadow-[0_36px_90px_-30px_rgba(36,11,51,0.7)]">
      {/* Gradient base — royal purple flowing into luxe gold */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(120deg, #2A0E3F 0%, #3D1E4E 38%, #6B2D8C 72%, #C9A961 128%)',
        }}
      />
      <div className="absolute inset-0 floral-pattern-gold opacity-50" />
      <Sparkles opacity={0.7} />

      {/* Floral decor — left */}
      <div className="absolute inset-y-0 left-0 w-[240px] md:w-[330px] pointer-events-none hidden sm:block">
        <img
          src={oemFlowers}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-left opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2A0E3F]/35 to-[#2A0E3F]" />
      </div>

      {/* Perfume — right */}
      <div className="absolute inset-y-0 right-0 w-[280px] md:w-[400px] pointer-events-none hidden sm:block">
        <img
          src={oemPerfume}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-right opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#2A0E3F]/30 to-[#2A0E3F]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[640px] mx-auto text-center px-6 py-16 md:py-20">
        <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-[#EFD9A0] mb-4">
          OEM &amp; Private Label
        </p>
        <h2 className="font-display text-white text-[28px] md:text-[40px] font-semibold leading-tight">
          Build Your Brand with <span className="italic text-[#EFD9A0]">Nexora Luxe</span>
        </h2>
        <p className="mt-3.5 text-white/75 text-[14px] md:text-[15px] tracking-wide">
          Private Label <span className="text-[#EFD9A0] px-1">•</span> Custom Formulation{' '}
          <span className="text-[#EFD9A0] px-1">•</span> Premium Packaging
        </p>

        <button
          onClick={onExplore}
          className="btn-shine mt-7 inline-flex items-center gap-2 bg-gold-gradient hover:brightness-110 text-[#2A0E3F] text-[14px] font-bold px-8 py-3.5 rounded-full shadow-gold-glow transition-all hover:-translate-y-px"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            Explore OEM Solutions <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.label}>
              {i > 0 && <span className="hidden sm:block w-10 h-px bg-white/20 mx-1" />}
              <span className="glass-card flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5">
                <span className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-[#2A0E3F]" />
                </span>
                <span className="text-[12.5px] font-semibold text-white/90 whitespace-nowrap">{f.label}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  </section>
);
