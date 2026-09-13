import React from 'react';
import { Languages, ShoppingBag, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  SKINCARE_DISPLAY_STYLES,
  SKINCARE_SUBCATEGORIES,
  getSkincareDisplayLabel,
  STYLE_DEFINITIONS,
  SkincareDisplayStyleId,
} from '../data/skincareSubcategoryStyles';
import { useSkincareDisplayStyle } from '../hooks/useSkincareDisplayStyle';

const ICONS: Record<SkincareDisplayStyleId, React.ElementType> = {
  hindiEnglishMix: Languages,
  pureEnglish: ShoppingBag,
  simpleHinglish: MessageCircle,
};

export const SkincareTaxonomyShowcase: React.FC = () => {
  const { styleId, setStyleId } = useSkincareDisplayStyle();

  return (
    <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-16 md:py-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5EEF8] border border-[#E8DEEF] text-[11px] font-bold tracking-wider uppercase text-[#6B2D8C] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Skincare Taxonomy — 3 Display Styles
        </div>
        <h2 className="text-[28px] md:text-[36px] font-extrabold tracking-tight text-[#2A0E3F] leading-tight">
          Choose how buyers see <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#6B2D8C] to-[#C9A961]">Skincare</span> subcategories
        </h2>
        <p className="mt-3 text-[14px] text-[#5B4A6E] max-w-2xl mx-auto font-medium">
          Same underlying products, three buyer-friendly languages. Switch style to match your audience — Tier 2/3 buyers love Hindi+English mix, B2B buyers prefer clean English.
        </p>
      </div>

      {/* Style Selector */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 bg-[#F5EEF8] rounded-full border border-[#E8DEEF] gap-1.5">
          {SKINCARE_DISPLAY_STYLES.map((style) => {
            const Icon = ICONS[style.id];
            const active = styleId === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setStyleId(style.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active ? 'bg-[#2A0E3F] text-white shadow-md' : 'text-[#6B2D8C] hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {style.label}
                {active && <CheckCircle2 className="w-4 h-4 text-[#C9A961]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Style Live Preview */}
      <div className="bg-white border border-[#E8DEEF] rounded-3xl p-6 md:p-8 shadow-sm mb-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <h3 className="text-[16px] font-extrabold text-[#2A0E3F] flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2A0E3F] to-[#6B2D8C] flex items-center justify-center text-white text-[14px]">✨</span>
            Live Preview — {SKINCARE_DISPLAY_STYLES.find((s) => s.id === styleId)?.label}
          </h3>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F5EEF8] text-[#6B2D8C] border border-[#E8DEEF]">
            {SKINCARE_SUBCATEGORIES.length} subcategories • {styleId}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SKINCARE_SUBCATEGORIES.map((item) => (
            <div key={item.id} className="group p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8DEEF] hover:border-[#C9A961] hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] font-black px-2 py-1 rounded-full bg-[#2A0E3F] text-[#F3E5AB] uppercase tracking-wider">{item.id}</span>
                <span className="w-6 h-6 rounded-full bg-white border border-[#E8DEEF] flex items-center justify-center text-[12px]">🧴</span>
              </div>
              <p className="text-[14px] font-extrabold text-[#2A0E3F] leading-snug group-hover:text-[#6B2D8C]">{getSkincareDisplayLabel(item, styleId)}</p>
              <p className="text-[11px] text-[#8B7FA3] mt-1.5 font-medium">{item.description}</p>
              {styleId === 'hindiEnglishMix' && (
                <p className="mt-2 text-[10px] font-bold px-2 py-1 rounded-full bg-[#F5EEF8] text-[#6B2D8C] border border-[#E8DEEF] inline-block">{item.hindiTranslation}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All 3 Styles Side-by-Side as Requested */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(Object.keys(STYLE_DEFINITIONS) as SkincareDisplayStyleId[]).map((sid) => {
          const def = STYLE_DEFINITIONS[sid];
          const meta = SKINCARE_DISPLAY_STYLES.find((s) => s.id === sid)!;
          const Icon = ICONS[sid];
          const isActive = styleId === sid;
          return (
            <div key={sid} className={`rounded-3xl border-2 p-6 transition-all ${isActive ? 'border-[#2A0E3F] bg-[#2A0E3F] text-white shadow-xl scale-[1.02]' : 'border-[#E8DEEF] bg-white hover:border-[#C9A961] hover:shadow-md'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/15' : 'bg-[#F5EEF8]'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#6B2D8C]'}`} />
                </span>
                <div>
                  <h4 className={`text-[14px] font-extrabold leading-tight ${isActive ? 'text-white' : 'text-[#2A0E3F]'}`}>{def.title}</h4>
                  <p className={`text-[11px] font-medium ${isActive ? 'text-white/70' : 'text-[#8B7FA3]'}`}>{meta.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {def.subcategories.map((sub, idx) => (
                  <div key={idx} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${isActive ? 'bg-white/10 border border-white/10' : 'bg-[#FDFBF7] border border-[#E8DEEF]'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isActive ? 'bg-white text-[#2A0E3F]' : 'bg-[#2A0E3F] text-white'}`}>{idx + 1}</span>
                    <span className={`text-[13px] font-bold leading-snug ${isActive ? 'text-white' : 'text-[#2A0E3F]'}`}>{sub}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStyleId(sid)}
                className={`w-full mt-5 py-2.5 rounded-xl text-[12px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${isActive ? 'bg-white text-[#2A0E3F]' : 'bg-[#2A0E3F] text-white hover:bg-[#4A2560]'}`}
              >
                {isActive ? '✓ Currently Active' : `Use ${meta.shortLabel}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Technical Note */}
      <div className="mt-10 bg-gradient-to-r from-[#F5EEF8] to-[#FDFBF7] border border-[#E8DEEF] rounded-2xl p-5 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#2A0E3F] flex items-center justify-center shrink-0">
          <span className="text-[#F3E5AB] text-[14px] font-bold">i</span>
        </div>
        <div className="text-[12.5px] text-[#5B4A6E] font-medium leading-relaxed">
          <strong className="text-[#2A0E3F]">Implementation:</strong> Canonical storage uses Pure English B2B labels (<code className="px-1.5 py-0.5 bg-white border border-[#E8DEEF] rounded text-[11px]">Face Serums & Actives</code> etc). Display layer translates via <code className="px-1.5 py-0.5 bg-white border border-[#E8DEEF] rounded text-[11px]">useSkincareDisplayStyle()</code> hook reading <code className="px-1.5 py-0.5 bg-white border border-[#E8DEEF] rounded text-[11px]">localStorage</code>. Search matches Hindi, Hinglish & keywords. Supabase migration <code className="px-1.5 py-0.5 bg-white border border-[#E8DEEF] rounded text-[11px]">0012_skincare_subcategory_styles.sql</code> adds all variants.
        </div>
      </div>
    </section>
  );
};

export default SkincareTaxonomyShowcase;
