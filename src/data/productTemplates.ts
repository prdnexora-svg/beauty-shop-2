/**
 * Pre-defined catalog of popular beauty product templates for the RFQ
 * "Product Name / Specific Requirement" searchable combobox.
 *
 * Buyers type a few letters ("vit", "lip", "argan"...) and pick a ready
 * template instead of writing full product/chemical specifications.
 * Selecting a template auto-fills the requirement name AND selects its
 * Primary Category + Subcategories in the taxonomy selector.
 *
 * NOTE: every `subcategories` entry must exist in the taxonomy
 * (src/data/categoryTaxonomy.ts) — enforced by unit tests.
 */

export interface ProductTemplate {
  id: string;
  /** display name auto-filled into the requirement field */
  name: string;
  /** primary category (key of CATEGORY_TAXONOMY) */
  category: string;
  /** subcategory pills to auto-select within that category */
  subcategories: string[];
  emoji: string;
  /** extra search terms (matched case-insensitively) */
  keywords: string[];
  /** optional ultra-simple builder benefit ids (hydration | brightening | acne-control | glow-repair) */
  benefits?: string[];
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // --- flagship / most searched (also the curated "popular" order) ---
  {
    id: 'vitamin-c-brightening-serum',
    name: 'Vitamin C Brightening Serum',
    category: 'Skincare',
    subcategories: ['Serums & Treatments'],
    emoji: '✨',
    keywords: ['vitamin c', 'ascorbic', 'brightening', 'glow serum'],
    benefits: ['brightening'],
  },
  {
    id: 'hydrating-face-wash',
    name: 'Hydrating Face Wash',
    category: 'Skincare',
    subcategories: ['Cleansers & Toners'],
    emoji: '🧼',
    keywords: ['face wash', 'cleanser', 'foaming', 'hydrating cleanser'],
  },
  {
    id: 'matte-lipstick',
    name: 'Matte Lipstick',
    category: 'Color Cosmetics / Makeup',
    subcategories: ['Lip Products (Lipsticks, Glosses, Liners)'],
    emoji: '💄',
    keywords: ['lipstick', 'matte', 'lip color', 'bullet lipstick'],
  },
  {
    id: 'argan-hair-oil',
    name: 'Argan Hair Oil',
    category: 'Haircare & Styling',
    subcategories: ['Hair Oils & Serums'],
    emoji: '💛',
    keywords: ['argan', 'hair oil', 'moroccan oil', 'nourishing oil'],
  },
  // --- skincare ---
  {
    id: 'hyaluronic-hydrating-serum',
    name: 'Hyaluronic Acid Hydrating Serum',
    category: 'Skincare',
    subcategories: ['Serums & Treatments'],
    emoji: '💧',
    keywords: ['hyaluronic', 'hydration', 'moisturising serum', 'plumping'],
    benefits: ['hydration'],
  },
  {
    id: 'niacinamide-glow-serum',
    name: 'Niacinamide Glow Serum',
    category: 'Skincare',
    subcategories: ['Serums & Treatments'],
    emoji: '🌸',
    keywords: ['niacinamide', 'glow', 'texture repair', 'even tone'],
    benefits: ['glow-repair'],
  },
  {
    id: 'salicylic-acne-gel',
    name: 'Salicylic Acid Acne Gel',
    category: 'Skincare',
    subcategories: ['Serums & Treatments'],
    emoji: '🛡️',
    keywords: ['salicylic', 'acne', 'pore control', 'blemish gel'],
    benefits: ['acne-control'],
  },
  {
    id: 'daily-moisturizing-cream',
    name: 'Daily Moisturizing Cream',
    category: 'Skincare',
    subcategories: ['Moisturizers & Creams'],
    emoji: '🧴',
    keywords: ['moisturizer', 'day cream', 'hydrating cream', 'face cream'],
    benefits: ['hydration'],
  },
  {
    id: 'spf-50-sunscreen',
    name: 'SPF 50 Sunscreen Lotion',
    category: 'Skincare',
    subcategories: ['Sunscreen & Sun Care'],
    emoji: '☀️',
    keywords: ['spf', 'sunscreen', 'sun protection', 'uv protection'],
  },
  {
    id: 'brightening-sheet-mask',
    name: 'Brightening Sheet Mask (Pack of 5)',
    category: 'Skincare',
    subcategories: ['Face Masks & Peels'],
    emoji: '🎭',
    keywords: ['mask', 'sheet mask', 'peel', 'facial mask'],
  },
  {
    id: 'under-eye-cream',
    name: 'Under-Eye Dark Circle Cream',
    category: 'Skincare',
    subcategories: ['Eye & Lip Care'],
    emoji: '👁️',
    keywords: ['eye cream', 'dark circles', 'under eye', 'puffiness'],
  },
  // --- haircare ---
  {
    id: 'keratin-smooth-shampoo',
    name: 'Keratin Smooth Shampoo',
    category: 'Haircare & Styling',
    subcategories: ['Shampoos & Conditioners'],
    emoji: '🚿',
    keywords: ['shampoo', 'keratin', 'smoothing', 'sulphate free'],
  },
  {
    id: 'deep-repair-conditioner',
    name: 'Deep Repair Conditioner',
    category: 'Haircare & Styling',
    subcategories: ['Shampoos & Conditioners'],
    emoji: '🌊',
    keywords: ['conditioner', 'repair', 'detangler', 'soft hair'],
  },
  {
    id: 'ammonia-free-hair-color',
    name: 'Ammonia-Free Hair Color Kit',
    category: 'Haircare & Styling',
    subcategories: ['Hair Colors & Developers'],
    emoji: '🎨',
    keywords: ['hair color', 'hair dye', 'ammonia free', 'color kit'],
  },
  {
    id: 'hair-spa-mask',
    name: 'Hair Spa Treatment Mask',
    category: 'Haircare & Styling',
    subcategories: ['Hair Spa & Deep Treatment Masks'],
    emoji: '🧖',
    keywords: ['hair spa', 'hair mask', 'deep treatment', 'keratin mask'],
  },
  {
    id: 'anti-dandruff-scalp-serum',
    name: 'Anti-Dandruff Scalp Serum',
    category: 'Haircare & Styling',
    subcategories: ['Scalp Treatments'],
    emoji: '🌿',
    keywords: ['dandruff', 'scalp', 'anti dandruff', 'itchy scalp'],
  },
  // --- color cosmetics ---
  {
    id: 'liquid-foundation',
    name: 'Liquid Foundation (20 Shades)',
    category: 'Color Cosmetics / Makeup',
    subcategories: ['Face Makeup (Foundation, Concealer, Compact)'],
    emoji: '🖌️',
    keywords: ['foundation', 'base makeup', 'concealer', 'bb cream'],
  },
  {
    id: 'waterproof-mascara',
    name: 'Waterproof Mascara',
    category: 'Color Cosmetics / Makeup',
    subcategories: ['Eye Makeup (Mascara, Eyeliner, Eyeshadow)'],
    emoji: '👁️',
    keywords: ['mascara', 'eye makeup', 'waterproof', 'lash'],
  },
  {
    id: 'gel-eyeliner',
    name: 'Smudge-Proof Gel Eyeliner',
    category: 'Color Cosmetics / Makeup',
    subcategories: ['Eye Makeup (Mascara, Eyeliner, Eyeshadow)'],
    emoji: '✒️',
    keywords: ['eyeliner', 'kajal', 'gel liner', 'winged liner'],
  },
  {
    id: 'long-wear-nail-polish',
    name: 'Long-Wear Nail Polish',
    category: 'Color Cosmetics / Makeup',
    subcategories: ['Nail Care & Polish'],
    emoji: '💅',
    keywords: ['nail', 'polish', 'manicure', 'nail paint'],
  },
  {
    id: 'makeup-remover-water',
    name: 'Gentle Makeup Remover Water',
    category: 'Color Cosmetics / Makeup',
    subcategories: ['Makeup Removers & Fixers'],
    emoji: '🧽',
    keywords: ['makeup remover', 'micellar', 'cleansing water'],
  },
  // --- personal care & body ---
  {
    id: 'lavender-body-wash',
    name: 'Lavender Body Wash',
    category: 'Personal Care & Body',
    subcategories: ['Body Washes & Shower Gels'],
    emoji: '🛁',
    keywords: ['body wash', 'shower gel', 'lavender', 'bath'],
  },
  {
    id: 'shea-butter-body-lotion',
    name: 'Shea Butter Body Lotion',
    category: 'Personal Care & Body',
    subcategories: ['Body Lotions & Lotions/Butter'],
    emoji: '🧴',
    keywords: ['body lotion', 'shea butter', 'body butter', 'moisturiser'],
  },
  {
    id: 'charcoal-body-scrub',
    name: 'Charcoal Body Scrub',
    category: 'Personal Care & Body',
    subcategories: ['Scrub & Exfoliators'],
    emoji: '🖤',
    keywords: ['scrub', 'exfoliator', 'charcoal', 'polish'],
  },
  {
    id: 'moisturizing-hand-wash',
    name: 'Moisturizing Hand Wash',
    category: 'Personal Care & Body',
    subcategories: ['Soaps & Hand Washes'],
    emoji: '🧼',
    keywords: ['hand wash', 'soap', 'liquid soap', 'hand hygiene'],
  },
  // --- raw ingredients ---
  {
    id: 'bulk-vitamin-c-powder',
    name: 'Bulk Vitamin C Powder (Cosmetic Grade)',
    category: 'Raw Ingredients & Actives',
    subcategories: ['Vitamins & Antioxidants (e.g., Vitamin C, Niacinamide)'],
    emoji: '🧪',
    keywords: ['vitamin c', 'bulk', 'powder', 'active', 'cosmetic grade'],
  },
  {
    id: 'lavender-essential-oil',
    name: 'Lavender Essential Oil (Bulk)',
    category: 'Raw Ingredients & Actives',
    subcategories: ['Essential Oils & Fragrance Oils'],
    emoji: '🌾',
    keywords: ['essential oil', 'lavender', 'fragrance oil', 'aroma'],
  },
  {
    id: 'cold-pressed-argan-carrier-oil',
    name: 'Cold-Pressed Argan Carrier Oil',
    category: 'Raw Ingredients & Actives',
    subcategories: ['Carrier Oils & Butters'],
    emoji: '🌰',
    keywords: ['carrier oil', 'argan', 'cold pressed', 'base oil'],
  },
  // --- packaging ---
  {
    id: 'airless-pump-bottle',
    name: 'Airless Pump Bottle 50ml',
    category: 'Packaging & Containers',
    subcategories: ['Bottles (Glass, PET, HDPE)', 'Pumps, Sprayers & Caps'],
    emoji: '🗄️',
    keywords: ['airless', 'pump bottle', 'bottle', '50ml'],
  },
  {
    id: 'amber-glass-jar',
    name: 'Amber Glass Jar 100g',
    category: 'Packaging & Containers',
    subcategories: ['Jars & Tubs'],
    emoji: '🏺',
    keywords: ['jar', 'amber', 'glass jar', 'cream jar'],
  },
  {
    id: 'eco-squeeze-tube',
    name: 'Eco-Friendly Squeeze Tube',
    category: 'Packaging & Containers',
    subcategories: ['Tubes & Squeeze Bottles', 'Eco-friendly & Sustainable Packaging'],
    emoji: '♻️',
    keywords: ['tube', 'eco', 'sustainable', 'squeeze'],
  },
  // --- salon & spa equipment ---
  {
    id: 'professional-facial-steamer',
    name: 'Professional Facial Steamer',
    category: 'Salon & Spa Equipment',
    subcategories: ['Facial Machines & Tools'],
    emoji: '💨',
    keywords: ['steamer', 'facial machine', 'facial', 'salon machine'],
  },
  {
    id: 'salon-hair-dryer',
    name: 'Salon Hair Dryer 2000W',
    category: 'Salon & Spa Equipment',
    subcategories: ['Hair Styling & Drying Tools'],
    emoji: '💇',
    keywords: ['hair dryer', 'blow dry', 'dryer', 'styling tool'],
  },
  {
    id: 'electric-massage-bed',
    name: 'Electric Massage Bed',
    category: 'Salon & Spa Equipment',
    subcategories: ['Massage & Spa Furniture'],
    emoji: '🛏️',
    keywords: ['massage', 'bed', 'spa furniture', 'massage table'],
  },
];

/* ------------------------------------------------------------------ */
/* Pure search helpers (unit tested)                                   */
/* ------------------------------------------------------------------ */

function scoreTemplate(template: ProductTemplate, normalizedQuery: string): number {
  const name = template.name.toLowerCase();
  const words = name.split(/\s+/);
  if (name.startsWith(normalizedQuery)) return 4; // exact prefix of the name
  if (words.some((w) => w.startsWith(normalizedQuery))) return 3; // word starts with query
  if (template.keywords.some((k) => k.startsWith(normalizedQuery))) return 3; // keyword prefix
  if (name.includes(normalizedQuery)) return 2; // anywhere in the name
  if (template.keywords.some((k) => k.includes(normalizedQuery))) return 1; // anywhere in keywords
  return 0;
}

/**
 * Search-as-you-type over the catalog. Empty query returns the curated
 * "popular" order. Results are ranked (prefix > word-start > substring)
 * and ties keep catalog order.
 */
export function searchProductTemplates(query: string, limit = 8): ProductTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return PRODUCT_TEMPLATES.slice(0, limit);

  return PRODUCT_TEMPLATES.map((template, index) => ({ template, index, score: scoreTemplate(template, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.template);
}

/**
 * Character ranges of every case-insensitive occurrence of `query` inside
 * `text` — used to <mark> the matching text in the dropdown.
 */
export function getMatchRanges(text: string, query: string): Array<[number, number]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const haystack = text.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(q, from);
    if (idx === -1) break;
    ranges.push([idx, idx + q.length]);
    from = idx + q.length;
  }
  return ranges;
}

/**
 * Pure keyboard-navigation reducer for the combobox listbox.
 * ArrowDown/ArrowUp wrap around; Home/End jump; other keys are no-ops.
 */
export function nextActiveIndex(key: string, current: number, count: number): number {
  if (count <= 0) return -1;
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowUp':
      return current <= 0 ? count - 1 : current - 1;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return current;
  }
}
