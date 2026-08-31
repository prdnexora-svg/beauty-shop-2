import React from 'react';
import { Check, Sparkles, Sliders, RefreshCw, CircleAlert } from 'lucide-react';
import {
  BENEFIT_OPTIONS,
  STRENGTH_OPTIONS,
  QUANTITY_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  FRAGRANCE_OPTIONS,
  buildFormulationSummaryLine,
  buildFormulationFacts,
  isFormulationValid,
  toggleBenefit,
  type SimpleFormulationState,
} from './formulationPreferences';

interface FormulationBuilderProps {
  /** current formulation state (controlled) */
  value: SimpleFormulationState;
  /** called on every change so parents can stay in sync */
  onChange: (next: SimpleFormulationState) => void;
  /** set true when a submit/continue was attempted with nothing selected */
  showValidationError?: boolean;
}

/**
 * Ultra-simple, zero-technical formulation builder.
 *
 * 1. Tap benefit cards (multi-select)          → no percentages, no codes
 * 2. Pick a strength: Mild | Regular | Extra Strong
 * 3. Three quick dropdowns: Quantity, Product Type, Fragrance
 *
 * A live summary card on the right updates instantly.
 */
export const FormulationBuilder: React.FC<FormulationBuilderProps> = ({
  value,
  onChange,
  showValidationError = false,
}) => {
  const benefitsEmpty = value.benefits.length === 0;
  const showError = showValidationError && benefitsEmpty;

  const sectionCard =
    'bg-[#F6F1FA] p-5 sm:p-7 rounded-3xl border border-[#E8DEEF]';

  return (
    <section className="space-y-5">
      {/* Section header — friendly, zero jargon */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#F5EEF8] text-[#6B2D8C] flex items-center justify-center shrink-0">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-[#2A0E3F] tracking-tight">
            Build Your Custom Product
          </h3>
          <p className="text-[12.5px] text-[#5B4A6E] font-medium">
            No chemistry knowledge needed — just tap what you want. Takes about 30 seconds. ⏱️
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* ============ LEFT: pickers ============ */}
        <div className="space-y-5">
          {/* ---- Step 1: Benefit cards ---- */}
          <div className={`${sectionCard} space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-[14.5px] font-extrabold text-[#2A0E3F]">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#6B2D8C] text-white text-[12px] mr-2 align-middle">
                  1
                </span>
                What should your product do?
              </h4>
              <span
                className={`text-[11.5px] font-extrabold px-2.5 py-1 rounded-full transition-colors ${
                  benefitsEmpty
                    ? showError
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-[#FFF4E0] text-[#8A5A00]'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {benefitsEmpty
                  ? showError
                    ? 'Pick at least 1 to continue'
                    : 'Pick at least 1'
                  : `${value.benefits.length} selected ✓`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFIT_OPTIONS.map((benefit) => {
                const selected = value.benefits.includes(benefit.id);
                return (
                  <button
                    key={benefit.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange(toggleBenefit(value, benefit.id))}
                    className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A961]/30 active:scale-[0.98] ${
                      selected
                        ? 'border-[#6B2D8C] bg-white shadow-md'
                        : showError
                          ? 'border-[#E8DEEF] bg-white/70 hover:border-[#6B2D8C]/50'
                          : 'border-[#E8DEEF] bg-white/70 hover:border-[#6B2D8C]/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl leading-none" aria-hidden="true">
                        {benefit.emoji}
                      </span>
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected
                            ? 'bg-[#6B2D8C] border-[#6B2D8C] text-white'
                            : 'border-[#E8DEEF] bg-white text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p
                      className={`mt-2.5 text-[14px] font-extrabold leading-snug transition-colors ${
                        selected ? 'text-[#6B2D8C]' : 'text-[#2A0E3F]'
                      }`}
                    >
                      {benefit.label}
                    </p>
                    <p className="text-[12px] text-[#5B4A6E] font-medium mt-1 leading-relaxed">
                      {benefit.blurb}
                    </p>
                    <p className="text-[11px] text-[#8B7FA3] font-semibold mt-1.5">
                      Key ingredient: {benefit.technicalName}
                    </p>
                  </button>
                );
              })}
            </div>

            {showError && (
              <p className="flex items-center gap-2 text-[12.5px] font-bold text-[#93000a]">
                <CircleAlert className="w-4 h-4 shrink-0" />
                Please choose at least one benefit — it takes just one tap. 💜
              </p>
            )}
          </div>

          {/* ---- Step 2: Strength toggle ---- */}
          <div className={`${sectionCard} space-y-4`}>
            <h4 className="text-[14.5px] font-extrabold text-[#2A0E3F]">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#6B2D8C] text-white text-[12px] mr-2 align-middle">
                2
              </span>
              How strong should it be?
            </h4>

            <div
              role="group"
              aria-label="Strength"
              className="grid grid-cols-3 gap-2 sm:gap-3 bg-white border border-[#E8DEEF] rounded-2xl p-1.5 sm:p-2"
            >
              {STRENGTH_OPTIONS.map((option) => {
                const selected = value.strength === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ ...value, strength: option.id })}
                    className={`px-2 py-3 rounded-xl text-center transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C9A961]/30 active:scale-[0.97] ${
                      selected
                        ? 'bg-[#6B2D8C] text-white shadow-md'
                        : 'text-[#5B4A6E] hover:bg-[#F5EEF8]'
                    }`}
                  >
                    <span className="block text-lg leading-none" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span className="block text-[13px] font-extrabold mt-1">{option.label}</span>
                    <span
                      className={`hidden sm:block text-[10.5px] font-semibold mt-0.5 leading-tight ${
                        selected ? 'text-white/80' : 'text-[#8B7FA3]'
                      }`}
                    >
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- Step 3: Batch details (3 quick dropdowns) ---- */}
          <div className={`${sectionCard} space-y-4`}>
            <h4 className="text-[14.5px] font-extrabold text-[#2A0E3F]">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#6B2D8C] text-white text-[12px] mr-2 align-middle">
                3
              </span>
              Your batch details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-extrabold text-[#2A0E3F] uppercase tracking-wider">
                  Quantity
                </label>
                <select
                  value={value.quantity}
                  onChange={(e) =>
                    onChange({ ...value, quantity: e.target.value as SimpleFormulationState['quantity'] })
                  }
                  aria-label="Quantity"
                  className="w-full bg-white border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-3.5 py-3 text-[14px] font-bold text-[#2A0E3F] outline-none cursor-pointer transition-all"
                >
                  {QUANTITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-extrabold text-[#2A0E3F] uppercase tracking-wider">
                  Product Type
                </label>
                <select
                  value={value.productType}
                  onChange={(e) =>
                    onChange({ ...value, productType: e.target.value as SimpleFormulationState['productType'] })
                  }
                  aria-label="Product Type"
                  className="w-full bg-white border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-3.5 py-3 text-[14px] font-bold text-[#2A0E3F] outline-none cursor-pointer transition-all"
                >
                  {PRODUCT_TYPE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.emoji} {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fragrance */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-extrabold text-[#2A0E3F] uppercase tracking-wider">
                  Fragrance
                </label>
                <select
                  value={value.fragrance}
                  onChange={(e) =>
                    onChange({ ...value, fragrance: e.target.value as SimpleFormulationState['fragrance'] })
                  }
                  aria-label="Fragrance"
                  className="w-full bg-white border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-3.5 py-3 text-[14px] font-bold text-[#2A0E3F] outline-none cursor-pointer transition-all"
                >
                  {FRAGRANCE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT: Live Summary Card ============ */}
        <aside className="lg:sticky lg:top-6">
          <div className="rounded-3xl overflow-hidden border border-[#6B2D8C]/25 shadow-lg bg-white">
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-[#6B2D8C] via-[#7E3A9E] to-[#9B5EC0] px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest">
                  Live Summary
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[10.5px] font-bold bg-white/15 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  updates instantly
                </span>
              </div>
              <p className="text-[15.5px] font-extrabold leading-snug mt-2.5">
                {buildFormulationSummaryLine(value)}
              </p>
            </div>

            {/* Benefit chips */}
            <div className="px-5 pt-4">
              <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#7E6C96] mb-2">
                Chosen benefits
              </p>
              {value.benefits.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.benefits.map((id) => {
                    const benefit = BENEFIT_OPTIONS.find((b) => b.id === id);
                    if (!benefit) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 bg-[#F5EEF8] text-[#6B2D8C] text-[12px] font-bold px-2.5 py-1.5 rounded-full border border-[#E8D5F2]"
                      >
                        <span aria-hidden="true">{benefit.emoji}</span>
                        {benefit.label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#8A5A00] bg-[#FFF4E0] border border-[#FFE1A8] rounded-xl px-3 py-2.5">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  Tap a card above to start building.
                </p>
              )}
            </div>

            {/* Facts checklist — instant visual validation */}
            <div className="p-5 space-y-2.5">
              {buildFormulationFacts(value).map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-center justify-between bg-[#FDFBF7] border border-[#F4F0E9] rounded-xl px-3.5 py-2.5"
                >
                  <span className="flex items-center gap-2 text-[12.5px] font-bold text-[#5B4A6E]">
                    <span aria-hidden="true">{fact.emoji}</span>
                    {fact.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[#2A0E3F]">
                    {fact.value}
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </div>
              ))}

              {/* Ready state */}
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-[12.5px] font-extrabold transition-colors ${
                  isFormulationValid(value)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#FDFBF7] text-[#8B7FA3] border border-[#F4F0E9]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isFormulationValid(value) ? 'bg-emerald-600 text-white' : 'bg-[#E8DEEF] text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </span>
                {isFormulationValid(value)
                  ? 'All set — ready to get quotes!'
                  : 'Pick 1+ benefit to get ready'}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default FormulationBuilder;
