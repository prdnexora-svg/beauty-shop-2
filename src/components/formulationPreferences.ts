/**
 * Ultra-Simple Formulation Preferences — plain-language config & helpers.
 *
 * Design rule: NO raw chemical codes, NO percentages, NO pH levels,
 * NO viscosity metrics anywhere in the user-facing strings. A salon owner
 * should be able to configure a custom product in ~30 seconds.
 *
 * (A quiet `technicalName` is kept per benefit only for supplier-side
 *  hand-off — it maps the friendly benefit to the hero ingredient the
 *  lab will actually use. It is never rendered as a spec input.)
 */

export type StrengthLevel = 'mild' | 'regular' | 'extra';
export type QuantityChoice = '50' | '100' | '250+';
export type ProductTypeChoice = 'Cream' | 'Gel' | 'Serum';
export type FragranceChoice = 'No Fragrance' | 'Light Natural Floral' | 'Fresh Citrus';

export interface BenefitOption {
  /** stable id used in state */
  id: string;
  /** big friendly card title */
  label: string;
  /** friendly one-line explanation */
  blurb: string;
  /** hero ingredient the lab maps this to (supplier-side only) */
  technicalName: string;
  /** short word used inside the live summary sentence */
  summaryWord: string;
  emoji: string;
}

export interface StrengthOption {
  id: StrengthLevel;
  label: string;
  hint: string;
  emoji: string;
}

export interface QuantityOption {
  id: QuantityChoice;
  label: string;
  /** numeric bottles for the RFQ record */
  bottles: number;
  hint: string;
}

export interface ProductTypeOption {
  id: ProductTypeChoice;
  label: string;
  hint: string;
  emoji: string;
}

export interface FragranceOption {
  id: FragranceChoice;
  label: string;
  hint: string;
  emoji: string;
}

/* ------------------------------------------------------------------ */
/* A. Ingredients — visual benefit cards (multi-select)                */
/* ------------------------------------------------------------------ */

export const BENEFIT_OPTIONS: BenefitOption[] = [
  {
    id: 'hydration',
    label: 'Hydration Boost',
    blurb: 'Keeps skin plump, soft and moisturised all day',
    technicalName: 'Hyaluronic Acid',
    summaryWord: 'Hydration',
    emoji: '💧',
  },
  {
    id: 'brightening',
    label: 'Skin Brightening',
    blurb: 'Evens out dull skin and adds a healthy glow',
    technicalName: 'Vitamin C',
    summaryWord: 'Brightening',
    emoji: '✨',
  },
  {
    id: 'acne-control',
    label: 'Acne & Pore Control',
    blurb: 'Calms breakouts and tightens visible pores',
    technicalName: 'Salicylic Acid',
    summaryWord: 'Acne Control',
    emoji: '🛡️',
  },
  {
    id: 'glow-repair',
    label: 'Glow & Texture Repair',
    blurb: 'Smooths rough patches and refines skin tone',
    technicalName: 'Niacinamide',
    summaryWord: 'Glow Repair',
    emoji: '🌸',
  },
];

/* ------------------------------------------------------------------ */
/* Strength — 3 simple options (replaces % inputs)                     */
/* ------------------------------------------------------------------ */

export const STRENGTH_OPTIONS: StrengthOption[] = [
  { id: 'mild', label: 'Mild', hint: 'Gentle — great for beginners', emoji: '🌿' },
  { id: 'regular', label: 'Regular', hint: 'Balanced everyday results', emoji: '⭐' },
  { id: 'extra', label: 'Extra Strong', hint: 'Maximum visible impact', emoji: '🔥' },
];

/* ------------------------------------------------------------------ */
/* B. Batch details — 3 quick dropdowns                                */
/* ------------------------------------------------------------------ */

export const QUANTITY_OPTIONS: QuantityOption[] = [
  { id: '50', label: '50 bottles', bottles: 50, hint: 'Trial batch' },
  { id: '100', label: '100 bottles', bottles: 100, hint: 'Most popular' },
  { id: '250+', label: '250+ bottles', bottles: 250, hint: 'Best value' },
];

export const PRODUCT_TYPE_OPTIONS: ProductTypeOption[] = [
  { id: 'Serum', label: 'Serum', hint: 'Light drops, fastest absorbing', emoji: '💧' },
  { id: 'Gel', label: 'Gel', hint: 'Cool, weightless feel', emoji: '🫧' },
  { id: 'Cream', label: 'Cream', hint: 'Rich and nourishing', emoji: '🧴' },
];

export const FRAGRANCE_OPTIONS: FragranceOption[] = [
  { id: 'No Fragrance', label: 'No Fragrance', hint: 'Unscented & sensitive-skin safe', emoji: '🚫' },
  { id: 'Light Natural Floral', label: 'Light Natural Floral', hint: 'Soft rose & jasmine notes', emoji: '🌸' },
  { id: 'Fresh Citrus', label: 'Fresh Citrus', hint: 'Uplifting orange & lemon notes', emoji: '🍋' },
];

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export interface SimpleFormulationState {
  /** selected benefit ids (multi-select cards) */
  benefits: string[];
  strength: StrengthLevel;
  quantity: QuantityChoice;
  productType: ProductTypeChoice;
  fragrance: FragranceChoice;
}

export const DEFAULT_FORMULATION: SimpleFormulationState = {
  benefits: ['hydration', 'brightening'],
  strength: 'regular',
  quantity: '100',
  productType: 'Serum',
  fragrance: 'No Fragrance',
};

/* ------------------------------------------------------------------ */
/* Helpers (pure — unit tested)                                        */
/* ------------------------------------------------------------------ */

export const MAX_BENEFITS = 4;

export function getBenefit(id: string): BenefitOption | undefined {
  return BENEFIT_OPTIONS.find((b) => b.id === id);
}

export function toggleBenefit(
  state: SimpleFormulationState,
  benefitId: string
): SimpleFormulationState {
  const selected = state.benefits.includes(benefitId);
  const benefits = selected
    ? state.benefits.filter((id) => id !== benefitId)
    : [...state.benefits, benefitId].slice(0, MAX_BENEFITS);
  return { ...state, benefits };
}

/** A formulation is ready the moment at least one benefit card is picked. */
export function isFormulationValid(state: SimpleFormulationState): boolean {
  return state.benefits.length > 0;
}

export function getBottleCount(state: SimpleFormulationState): number {
  const opt = QUANTITY_OPTIONS.find((q) => q.id === state.quantity);
  return opt ? opt.bottles : 100;
}

function joinBenefitWords(words: string[]): string {
  if (words.length === 0) return '…';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(' & ')} & ${words[words.length - 1]}`;
}

/**
 * The one-sentence live summary shown on the summary card, e.g.
 * "Your Custom Product: 100 Serum Bottles with Brightening & Hydration"
 */
export function buildFormulationSummaryLine(state: SimpleFormulationState): string {
  const qty = QUANTITY_OPTIONS.find((q) => q.id === state.quantity)?.label.replace(' bottles', '') ?? '100';
  const words = state.benefits
    .map((id) => getBenefit(id)?.summaryWord)
    .filter((w): w is string => Boolean(w));
  return `Your Custom Product: ${qty} ${state.productType} Bottles with ${joinBenefitWords(words)}`;
}

/** Friendly chunked facts for the summary card checklist. */
export interface FormulationFact {
  emoji: string;
  label: string;
  value: string;
}

export function buildFormulationFacts(state: SimpleFormulationState): FormulationFact[] {
  const strength = STRENGTH_OPTIONS.find((s) => s.id === state.strength);
  const fragrance = FRAGRANCE_OPTIONS.find((f) => f.id === state.fragrance);
  const quantity = QUANTITY_OPTIONS.find((q) => q.id === state.quantity);
  return [
    { emoji: '🧪', label: 'Product Type', value: state.productType },
    { emoji: '📦', label: 'Quantity', value: quantity?.label ?? state.quantity },
    { emoji: '💪', label: 'Strength', value: strength?.label ?? state.strength },
    { emoji: '🌿', label: 'Fragrance', value: fragrance?.label ?? state.fragrance },
  ];
}

/**
 * Plain-language brief handed to suppliers in the RFQ record.
 * Deliberately contains zero technical jargon.
 */
export function buildFormulationBrief(state: SimpleFormulationState): string {
  const benefits = state.benefits
    .map((id) => getBenefit(id))
    .filter((b): b is BenefitOption => Boolean(b));

  const benefitText = benefits.length
    ? benefits.map((b) => `${b.emoji} ${b.label} (${b.technicalName})`).join(', ')
    : 'No benefits selected yet';

  const strength = STRENGTH_OPTIONS.find((s) => s.id === state.strength)?.label ?? state.strength;
  const quantity = QUANTITY_OPTIONS.find((q) => q.id === state.quantity)?.label ?? state.quantity;
  const fragrance = FRAGRANCE_OPTIONS.find((f) => f.id === state.fragrance)?.label ?? state.fragrance;

  return [
    `CUSTOM PRODUCT BRIEF (simple mode)`,
    `Benefits: ${benefitText}`,
    `Strength: ${strength}`,
    `Batch: ${quantity}`,
    `Product Type: ${state.productType}`,
    `Fragrance: ${fragrance}`,
  ].join('\n');
}
