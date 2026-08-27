import React from 'react';

/* Deterministic bokeh sparkles — gold & white dots that gently twinkle. */
const SPARKS = [
  { top: '8%', left: '6%', s: 5, d: '0s', gold: true },
  { top: '22%', left: '13%', s: 3, d: '0.6s', gold: false },
  { top: '64%', left: '5%', s: 4, d: '1.2s', gold: true },
  { top: '80%', left: '14%', s: 6, d: '0.3s', gold: false },
  { top: '12%', left: '30%', s: 3, d: '1.8s', gold: true },
  { top: '86%', left: '38%', s: 4, d: '2.4s', gold: true },
  { top: '6%', left: '52%', s: 4, d: '0.9s', gold: false },
  { top: '18%', left: '70%', s: 5, d: '1.5s', gold: true },
  { top: '70%', left: '66%', s: 3, d: '2.1s', gold: false },
  { top: '88%', left: '78%', s: 5, d: '0.4s', gold: true },
  { top: '10%', left: '88%', s: 4, d: '1.1s', gold: false },
  { top: '34%', left: '94%', s: 6, d: '2.7s', gold: true },
  { top: '55%', left: '90%', s: 3, d: '0.7s', gold: false },
  { top: '42%', left: '3%', s: 3, d: '2.9s', gold: false },
  { top: '92%', left: '56%', s: 3, d: '1.4s', gold: true },
  { top: '48%', left: '46%', s: 2.5, d: '2.2s', gold: true },
];

/* Pulsing `.sparkle` dots — radial gold glints that bloom in and out.
   Positions are fixed constants instead of Math.random() so the field
   never re-shuffles when the hero re-renders (e.g. while typing). */
const SPARKLE_DOTS = [
  { top: '18%', left: '22%', s: 8, d: '0.2s', dur: '2.4s' },
  { top: '30%', left: '82%', s: 10, d: '1.1s', dur: '2.8s' },
  { top: '58%', left: '10%', s: 7, d: '0.7s', dur: '2.2s' },
  { top: '72%', left: '58%', s: 9, d: '1.6s', dur: '2.6s' },
  { top: '12%', left: '60%', s: 6, d: '2.0s', dur: '2.3s' },
  { top: '84%', left: '88%', s: 8, d: '0.5s', dur: '2.9s' },
  { top: '44%', left: '38%', s: 6, d: '1.9s', dur: '2.5s' },
  { top: '8%', left: '42%', s: 9, d: '0.9s', dur: '2.7s' },
  { top: '25%', left: '6%', s: 7, d: '1.4s', dur: '2.1s' },
  { top: '40%', left: '92%', s: 8, d: '0.4s', dur: '2.6s' },
  { top: '66%', left: '30%', s: 10, d: '1.8s', dur: '2.4s' },
  { top: '78%', left: '74%', s: 7, d: '0.1s', dur: '2.2s' },
  { top: '52%', left: '70%', s: 6, d: '2.3s', dur: '2.8s' },
  { top: '90%', left: '20%', s: 8, d: '1.2s', dur: '2.5s' },
];

export const Sparkles: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity }} aria-hidden="true">
    {/* Large soft bokeh orbs */}
    <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#B0579E]/25 blur-[110px]" />
    <div className="absolute top-1/3 -right-28 w-[460px] h-[460px] rounded-full bg-[#E39BC6]/25 blur-[120px]" />
    <div className="absolute -bottom-32 left-1/3 w-[380px] h-[380px] rounded-full bg-[#C9A961]/14 blur-[100px]" />
    {/* Pulsing gold sparkles */}
    {SPARKLE_DOTS.map((sp, i) => (
      <span
        key={`sparkle-${i}`}
        className="sparkle"
        style={{
          top: sp.top,
          left: sp.left,
          width: sp.s,
          height: sp.s,
          animationDelay: sp.d,
          animationDuration: sp.dur,
        }}
      />
    ))}
    {SPARKS.map((sp, i) => (
      <span
        key={i}
        className="absolute rounded-full nl-twinkle"
        style={{
          top: sp.top,
          left: sp.left,
          width: sp.s,
          height: sp.s,
          animationDelay: sp.d,
          background: sp.gold ? '#EFD9A0' : '#FFFFFF',
          boxShadow: sp.gold ? '0 0 10px 2px rgba(233,210,154,0.75)' : '0 0 8px 2px rgba(255,255,255,0.6)',
        }}
      />
    ))}
  </div>
);
