/**
 * Nexora Luxe — Skincare Subcategory Display Styles
 *
 * Implements the three requested UI variants for Skincare subcategories:
 *
 * 1. hindiEnglishMix — Hindi + English (Easy UI Mix) with bilingual parentheses
 * 2. pureEnglish — Pure Short English (Clean B2B Look)
 * 3. simpleHinglish — Simple Hinglish (Direct & Everyday Language)
 *
 * The canonical underlying taxonomy now includes 9 items to cover all variants.
 * Each style re-labels the same concepts for different buyer personas.
 */

export type SkincareDisplayStyleId = 'hindiEnglishMix' | 'pureEnglish' | 'simpleHinglish';

export interface SkincareSubcategoryStyleOption {
  id: SkincareDisplayStyleId;
  label: string;              // UI selector label
  shortLabel: string;         // pill label
  description: string;        // helper text
  badge: string;              // e.g. "B2B", "Easy", "Direct"
  languageHint: string;       // e.g. "EN + HI"
}

export interface SkincareSubcategoryItem {
  id: string;                 // stable slug for mapping
  canonicalEnglish: string;   // canonical underlying name (stored in DB)
  hindiEnglishMix: string;    // Style 1: "Serums & Treatments (Serums aur Special Care)"
  pureEnglish: string;        // Style 2: "Face Serums & Actives"
  simpleHinglish: string;     // Style 3: "Serum & Drops"
  hindiTranslation?: string;  // just the Hindi part for separate rendering
  keywords: string[];         // for search
  description?: string;       // buyer-facing helper
}

export const SKINCARE_DISPLAY_STYLES: SkincareSubcategoryStyleOption[] = [
  {
    id: 'hindiEnglishMix',
    label: 'Hindi + English (Easy UI Mix)',
    shortLabel: 'HI + EN Mix',
    description: 'Bilingual labels with Hindi in brackets — easy for tier 2/3 buyers',
    badge: 'Easy',
    languageHint: 'EN + HI',
  },
  {
    id: 'pureEnglish',
    label: 'Pure Short English (Clean B2B Look)',
    shortLabel: 'Pure EN',
    description: 'Short, professional B2B labels — clean catalog look',
    badge: 'B2B',
    languageHint: 'EN',
  },
  {
    id: 'simpleHinglish',
    label: 'Simple Hinglish (Direct & Everyday)',
    shortLabel: 'Hinglish',
    description: 'Everyday spoken words — direct and familiar',
    badge: 'Direct',
    languageHint: 'Hinglish',
  },
];

// Canonical 9-item list covering all 3 requested variants.
// Each entry maps to all three display forms.
export const SKINCARE_SUBCATEGORIES: SkincareSubcategoryItem[] = [
  {
    id: 'serums-treatments',
    canonicalEnglish: 'Serums & Treatments',
    hindiEnglishMix: 'Serums & Treatments (Serums aur Special Care)',
    pureEnglish: 'Face Serums & Actives',
    simpleHinglish: 'Serum & Drops',
    hindiTranslation: 'Serums aur Special Care',
    keywords: ['serum', 'treatment', 'actives', 'drops', 'special care'],
    description: 'Concentrated actives, serums and targeted treatments',
  },
  {
    id: 'cleansers-toners',
    canonicalEnglish: 'Cleansers & Toners',
    hindiEnglishMix: 'Cleansers & Toners (Face Wash aur Toners)',
    pureEnglish: 'Daily Cleansers & Wash',
    simpleHinglish: 'Face Wash & Cleanser',
    hindiTranslation: 'Face Wash aur Toners',
    keywords: ['cleanser', 'face wash', 'toner', 'wash'],
    description: 'Daily face wash, cleansers and toning solutions',
  },
  {
    id: 'moisturizers-creams',
    canonicalEnglish: 'Moisturizers & Creams',
    hindiEnglishMix: 'Moisturizers & Creams (Moisturizer aur Night Creams)',
    pureEnglish: 'Day & Night Moisturizers',
    simpleHinglish: 'Cream & Gel',
    hindiTranslation: 'Moisturizer aur Night Creams',
    keywords: ['moisturizer', 'cream', 'night cream', 'gel', 'day cream'],
    description: 'Day creams, night creams, gels and lotions',
  },
  {
    id: 'sunscreen-sun-care',
    canonicalEnglish: 'Sunscreen & Sun Care',
    hindiEnglishMix: 'Sunscreen & Sun Care (Sunscreen aur Sun Block)',
    pureEnglish: 'Sun Care & SPF',
    simpleHinglish: 'Sunscreen Lotion',
    hindiTranslation: 'Sunscreen aur Sun Block',
    keywords: ['sunscreen', 'sun care', 'spf', 'sun block', 'lotion'],
    description: 'SPF, sun block and sun protection range',
  },
  {
    id: 'face-masks-peels',
    canonicalEnglish: 'Face Masks & Peels',
    hindiEnglishMix: 'Face Masks & Peels (Face Pack aur Sheet Masks)',
    pureEnglish: 'Face Masks & Sheets',
    simpleHinglish: 'Face Pack & Scrub',
    hindiTranslation: 'Face Pack aur Sheet Masks',
    keywords: ['face mask', 'peel', 'sheet mask', 'face pack', 'scrub'],
    description: 'Masks, peels, sheet masks and exfoliating packs',
  },
  {
    id: 'exfoliators-peels',
    canonicalEnglish: 'Exfoliators & Peels',
    hindiEnglishMix: 'Exfoliators & Peels (Scrub aur Peeling ke liye)',
    pureEnglish: 'Exfoliators & Peels',
    simpleHinglish: 'Face Pack & Scrub',
    hindiTranslation: 'Scrub aur Peeling ke liye',
    keywords: ['exfoliator', 'peel', 'scrub', 'peeling'],
    description: 'Chemical and physical exfoliators',
  },
  {
    id: 'eye-lip-care',
    canonicalEnglish: 'Eye & Lip Care',
    hindiEnglishMix: 'Eye & Lip Care (Under-Eye Cream aur Lip Balm)',
    pureEnglish: 'Eye & Lip Treatments',
    simpleHinglish: 'Lip Care & Eye Cream',
    hindiTranslation: 'Under-Eye Cream aur Lip Balm',
    keywords: ['eye care', 'lip care', 'eye cream', 'lip balm', 'under-eye'],
    description: 'Under-eye creams, lip balms and targeted care',
  },
  {
    id: 'anti-aging-spot-care',
    canonicalEnglish: 'Anti-Aging & Spot Care',
    hindiEnglishMix: 'Anti-Aging & Spot Care (Jhurriyon aur Daag-Dhabbon ke liye)',
    pureEnglish: 'Anti-Aging & Spot Care',
    simpleHinglish: 'Daag-Dhabba Cream',
    hindiTranslation: 'Jhurriyon aur Daag-Dhabbon ke liye',
    keywords: ['anti aging', 'spot care', 'jhurriyan', 'daag dhabba', 'wrinkle'],
    description: 'Anti-wrinkle and dark spot correction',
  },
  {
    id: 'body-oils-toners',
    canonicalEnglish: 'Body Oils & Toners',
    hindiEnglishMix: 'Body Oils & Toners (Body Oil aur Toner)',
    pureEnglish: 'Body Oils & Toners',
    simpleHinglish: 'Body Oil & Toner',
    hindiTranslation: 'Body Oil aur Toner',
    keywords: ['body oil', 'toner', 'body toner'],
    description: 'Body oils, mists and toning care',
  },
];

// Helper: get display label for a given style
export function getSkincareDisplayLabel(
  item: SkincareSubcategoryItem,
  style: SkincareDisplayStyleId
): string {
  switch (style) {
    case 'hindiEnglishMix':
      return item.hindiEnglishMix;
    case 'pureEnglish':
      return item.pureEnglish;
    case 'simpleHinglish':
      return item.simpleHinglish;
    default:
      return item.canonicalEnglish;
  }
}

// Helper: map canonical DB name -> item (fuzzy)
export function findSkincareItemByCanonical(name: string): SkincareSubcategoryItem | undefined {
  const normalized = name.trim().toLowerCase();
  return SKINCARE_SUBCATEGORIES.find(
    (it) =>
      it.canonicalEnglish.toLowerCase() === normalized ||
      it.pureEnglish.toLowerCase() === normalized ||
      it.simpleHinglish.toLowerCase() === normalized ||
      it.hindiEnglishMix.toLowerCase().includes(normalized) ||
      it.id === normalized ||
      normalized.includes(it.id.replace(/-/g, ' '))
  );
}

// For taxonomyService fallback: return all display variants for a given style
export function getSkincareSubcategoryNamesForStyle(style: SkincareDisplayStyleId): string[] {
  return SKINCARE_SUBCATEGORIES.map((it) => getSkincareDisplayLabel(it, style));
}

// Canonical names (for DB / internal logic)
export function getCanonicalSkincareNames(): string[] {
  return SKINCARE_SUBCATEGORIES.map((it) => it.canonicalEnglish);
}

// Pure English short list (clean B2B) — used as new default taxonomy
export function getPureEnglishSkincareNames(): string[] {
  return SKINCARE_SUBCATEGORIES.map((it) => it.pureEnglish);
}

// All searchable keywords flattened
export function getAllSkincareKeywords(): string[] {
  return SKINCARE_SUBCATEGORIES.flatMap((it) => it.keywords);
}

// Mapping for UI: id -> all three labels
export const SKINCARE_LABEL_MAP: Record<string, { en: string; hiEn: string; hinglish: string; hi: string }> = 
  Object.fromEntries(
    SKINCARE_SUBCATEGORIES.map((it) => [
      it.id,
      {
        en: it.pureEnglish,
        hiEn: it.hindiEnglishMix,
        hinglish: it.simpleHinglish,
        hi: it.hindiTranslation || '',
      },
    ])
  );

// Export style definitions as requested in the prompt (exact lists)
export const STYLE_DEFINITIONS = {
  hindiEnglishMix: {
    title: 'Hindi + English (Easy UI Mix)',
    subcategories: [
      'Serums & Treatments (Serums aur Special Care)',
      'Cleansers & Toners (Face Wash aur Toners)',
      'Moisturizers & Creams (Moisturizer aur Night Creams)',
      'Sunscreen & Sun Care (Sunscreen aur Sun Block)',
      'Face Masks & Peels (Face Pack aur Sheet Masks)',
      'Eye & Lip Care (Under-Eye Cream aur Lip Balm)',
      'Anti-Aging & Spot Care (Jhurriyon aur Daag-Dhabbon ke liye)',
    ],
  },
  pureEnglish: {
    title: 'Pure Short English (Clean B2B Look)',
    subcategories: [
      'Face Serums & Actives',
      'Daily Cleansers & Wash',
      'Day & Night Moisturizers',
      'Sun Care & SPF',
      'Exfoliators & Peels',
      'Face Masks & Sheets',
      'Eye & Lip Treatments',
      'Body Oils & Toners',
    ],
  },
  simpleHinglish: {
    title: 'Simple Hinglish (Direct & Everyday Language)',
    subcategories: [
      'Face Wash & Cleanser',
      'Serum & Drops',
      'Cream & Gel',
      'Sunscreen Lotion',
      'Face Pack & Scrub',
      'Lip Care & Eye Cream',
    ],
  },
};
