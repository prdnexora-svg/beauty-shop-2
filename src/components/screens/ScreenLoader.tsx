// ============================================================================
// NEXORA LUXE — SUSPENSE FALLBACK
//
// Shown while a lazily-loaded screen chunk downloads. Shared by every Suspense
// boundary so the loading experience is identical across the app.
// ============================================================================

import React from 'react';

export const ScreenLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <main className="flex-1 w-full flex flex-col items-center justify-center gap-3 py-24" role="status" aria-live="polite">
    <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin" />
    <p className="text-[11px] font-bold uppercase tracking-widest text-[#7E6C96]">{label}</p>
  </main>
);

export default ScreenLoader;
