import React from 'react';
import { Languages, Sparkles, ShoppingBag, MessageCircle } from 'lucide-react';
import {
  SkincareDisplayStyleId,
  SKINCARE_DISPLAY_STYLES,
  SKINCARE_SUBCATEGORIES,
  getSkincareDisplayLabel,
  STYLE_DEFINITIONS,
} from '../data/skincareSubcategoryStyles';
import { useSkincareDisplayStyle } from '../hooks/useSkincareDisplayStyle';

interface Props {
  compact?: boolean;
  onStyleChange?: (style: SkincareDisplayStyleId) => void;
  showPreview?: boolean;
}

const STYLE_ICONS: Record<SkincareDisplayStyleId, React.ElementType> = {
  hindiEnglishMix: Languages,
  pureEnglish: ShoppingBag,
  simpleHinglish: MessageCircle,
};

const STYLE_COLORS: Record<SkincareDisplayStyleId, string> = {
  hindiEnglishMix: 'from-[#6B2D8C] to-[#8B4AA8] border-[#6B2D8C]',
  pureEnglish: 'from-[#2A0E3F] to-[#54276E] border-[#2A0E3F]',
  simpleHinglish: 'from-[#C9A961] to-[#D4B878] border-[#C9A961]',
};

export const SkincareSubcategoryStyleSwitcher: React.FC<Props> = ({
  compact = false,
  onStyleChange,
  showPreview = true,
}) => {
  const { styleId, setStyleId } = useSkincareDisplayStyle();

  const handleChange = (next: SkincareDisplayStyleId) => {
    setStyleId(next);
    onStyleChange?.(next);
    // Dispatch custom event for other components listening
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skincare-style-change', { detail: next }));
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-[#F5EEF8] rounded-full border border-[#E8DEEF]">
        {SKINCARE_DISPLAY_STYLES.map((style) => {
          const Icon = STYLE_ICONS[style.id];
          const isActive = styleId === style.id;
          return (
            <button
              key={style.id}
              onClick={() => handleChange(style.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2A0E3F] text-white shadow-md'
                  : 'text-[#6B2D8C] hover:bg-white'
              }`}
              title={style.label}
            >
              <Icon className="w-3.5 h-3.5" />
              {style.shortLabel}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A0E3F] to-[#6B2D8C] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#F3E5AB]" />
        </div>
        <div>
          <h3 className="text-[15px] font-extrabold text-[#2A0E3F]">Skincare Display Style</h3>
          <p className="text-[12px] text-[#8B7FA3] font-medium">Choose how subcategories appear across the marketplace</p>
        </div>
      </div>

      {/* Style Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SKINCARE_DISPLAY_STYLES.map((style) => {
          const Icon = STYLE_ICONS[style.id];
          const isActive = styleId === style.id;
          return (
            <button
              key={style.id}
              onClick={() => handleChange(style.id)}
              className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-br ${STYLE_COLORS[style.id]} text-white shadow-lg scale-[1.02]`
                  : 'bg-white border-[#E8DEEF] hover:border-[#C9A961] hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-[#F5EEF8]'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#6B2D8C]'}`} />
                </span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full tracking-wider uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-[#F5EEF8] text-[#6B2D8C]'}`}>
                  {style.badge}
                </span>
              </div>
              <h4 className={`text-[13px] font-extrabold leading-tight ${isActive ? 'text-white' : 'text-[#2A0E3F]'}`}>{style.label}</h4>
              <p className={`text-[11px] mt-1.5 leading-snug font-medium ${isActive ? 'text-white/80' : 'text-[#8B7FA3]'}`}>{style.description}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#2A0E3F] text-[#F3E5AB]'}`}>{style.languageHint}</span>
                {isActive && <span className="text-[11px] font-bold">✓ Active</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-[#FDFBF7] border border-[#E8DEEF] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-extrabold tracking-wider uppercase text-[#5B4A6E]">Live Preview — {SKINCARE_DISPLAY_STYLES.find((s) => s.id === styleId)?.label}</h4>
            <span className="text-[10px] font-bold bg-[#F5EEF8] text-[#6B2D8C] px-2 py-1 rounded-full">{SKINCARE_SUBCATEGORIES.length} subcategories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKINCARE_SUBCATEGORIES.map((item) => (
              <span
                key={item.id}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E8DEEF] text-[12px] font-bold text-[#2A0E3F] shadow-sm hover:border-[#C9A961] transition-colors"
                title={`${item.canonicalEnglish} → ${getSkincareDisplayLabel(item, styleId)}`}
              >
                {getSkincareDisplayLabel(item, styleId)}
              </span>
            ))}
          </div>

          {/* Raw lists as requested */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-3 border-t border-[#E8DEEF]/60">
            {(Object.keys(STYLE_DEFINITIONS) as SkincareDisplayStyleId[]).map((sid) => {
              const def = STYLE_DEFINITIONS[sid];
              const isCurrent = sid === styleId;
              return (
                <div key={sid} className={`p-3 rounded-xl border ${isCurrent ? 'bg-[#2A0E3F] border-[#2A0E3F] text-white' : 'bg-white border-[#E8DEEF]'}`}>
                  <p className={`text-[11px] font-extrabold uppercase tracking-wider ${isCurrent ? 'text-[#F3E5AB]' : 'text-[#6B2D8C]'}`}>{def.title}</p>
                  <ul className="mt-2 space-y-1">
                    {def.subcategories.map((sc, i) => (
                      <li key={i} className={`text-[11.5px] font-medium flex gap-1.5 ${isCurrent ? 'text-white/90' : 'text-[#2A0E3F]'}`}>
                        <span className={`${isCurrent ? 'text-[#C9A961]' : 'text-[#C9A961]'} font-bold`}>•</span> {sc}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkincareSubcategoryStyleSwitcher;
