# Skincare Subcategories — 3 Display Styles

Implemented as per request:

## 1. Hindi + English (Easy UI Mix)
Bilingual labels with Hindi in brackets — easy for tier 2/3 buyers

- Serums & Treatments (Serums aur Special Care)
- Cleansers & Toners (Face Wash aur Toners)
- Moisturizers & Creams (Moisturizer aur Night Creams)
- Sunscreen & Sun Care (Sunscreen aur Sun Block)
- Face Masks & Peels (Face Pack aur Sheet Masks)
- Eye & Lip Care (Under-Eye Cream aur Lip Balm)
- Anti-Aging & Spot Care (Jhurriyon aur Daag-Dhabbon ke liye)

## 2. Pure Short English (Clean B2B Look) — NEW CANONICAL
Short, professional B2B labels — clean catalog look. Used as default storage.

- Face Serums & Actives
- Daily Cleansers & Wash
- Day & Night Moisturizers
- Sun Care & SPF
- Exfoliators & Peels
- Face Masks & Sheets
- Eye & Lip Treatments
- Body Oils & Toners
- (Optional) Anti-Aging & Spot Care

## 3. Simple Hinglish (Direct & Everyday Language)
Everyday spoken words — direct and familiar

- Face Wash & Cleanser
- Serum & Drops
- Cream & Gel
- Sunscreen Lotion
- Face Pack & Scrub
- Lip Care & Eye Cream

---

## Technical Implementation

### Files Added
- `src/data/skincareSubcategoryStyles.ts` — canonical 9-item list, all 3 display maps, keywords, STYLE_DEFINITIONS
- `src/hooks/useSkincareDisplayStyle.ts` — manages style in localStorage, provides translate() helper
- `src/components/SkincareSubcategoryStyleSwitcher.tsx` — compact + full UI with live preview
- `src/components/SkincareTaxonomyShowcase.tsx` — homepage section showing all 3 side-by-side
- `src/db/migrations/0012_skincare_subcategory_styles.sql` — Supabase seed for all variants

### Files Updated
- `src/data/categoryTaxonomy.ts` — now uses Pure English B2B as canonical (8-9 items)
- `src/data/categories.ts` — B2B_CATEGORIES skincare now uses canonical list
- `src/data/productTemplates.ts` — templates updated to new canonical names
- `src/components/SupplierAdminPortal.tsx` — seed products updated
- `src/data/sponsoredProductsData.ts` — subcategory updated
- `src/components/BuyerRFQTrackingScreen.tsx`, `PostRequirementScreen.tsx`, `RFQModal.tsx` — defaults updated
- `src/lib/taxonomyService.ts` — search now matches Hindi/Hinglish aliases + keywords
- `src/components/ProductTaxonomySelector.tsx` — shows style switcher when Skincare selected, translates pills, shows Hindi hint
- `src/components/ProductListingScreen.tsx` — sidebar shows language switcher, translates subcategory labels
- `src/App.tsx` — homepage includes SkincareTaxonomyShowcase
- Tests updated to new canonical names

### How Display Translation Works
```ts
import { useSkincareDisplayStyle } from '../hooks/useSkincareDisplayStyle';
const { styleId, translate } = useSkincareDisplayStyle();
// translate('Face Serums & Actives') => depending on styleId:
// - hindiEnglishMix: 'Serums & Treatments (Serums aur Special Care)'
// - pureEnglish: 'Face Serums & Actives'
// - simpleHinglish: 'Serum & Drops'
```

Storage key: `nexora_skincare_display_style` in localStorage
Default: `pureEnglish`

### Search Support
filterTaxonomyCatalog now checks:
- canonical English
- pure English
- hindiEnglishMix
- simpleHinglish
- hindiTranslation
- keywords (e.g., 'jhurriyan', 'daag dhabba', 'face wash', 'serum drops')

So typing "face wash" or "serums aur" or "jhurriyon" will all surface Skincare.

### Supabase
Run migration 0012 to add all variants to `subcategories` table. Legacy names kept for backward compat.

### Future
Add new subcategory to `SKINCARE_SUBCATEGORIES` array with all three labels + keywords, then add migration entry.
