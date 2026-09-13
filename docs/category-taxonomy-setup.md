# Dynamic Category & Subcategory Taxonomy — Setup

The Nexora Luxe RFQ form now reads its Category / Subcategory taxonomy live
from Supabase, instead of relying on a hard-coded frontend list.

## What was added

| File | Purpose |
| --- | --- |
| `src/db/migrations/0008_category_subcategory_taxonomy.sql` | Creates `categories` + `subcategories`, RLS, grants, and seed data. |
| `src/db/migrations/0012_skincare_subcategory_styles.sql` | Expands Skincare to 3 display styles (HI+EN, Pure EN, Hinglish). |
| `src/data/skincareSubcategoryStyles.ts` | Canonical 9-item Skincare list + 3 display variants with translations. |
| `src/hooks/useSkincareDisplayStyle.ts` | Hook managing selected display style in localStorage + translation. |
| `src/components/SkincareSubcategoryStyleSwitcher.tsx` | UI switcher for 3 styles (compact + full with live preview). |
| `src/components/SkincareTaxonomyShowcase.tsx` | Full-page showcase of all 3 styles side-by-side (on homepage). |
| `src/lib/taxonomyService.ts` | Supabase fetch, fallback catalog, build/group, and search filtering (now Hindi-aware). |
| `src/hooks/useTaxonomyCatalog.ts` | React hook that loads the live catalog on mount. |
| `src/components/ProductTaxonomySelector.tsx` | Shared RFQ taxonomy control (now with style switcher for Skincare). |
| `src/components/RFQModal.tsx` | Quick RFQ modal now uses `ProductTaxonomySelector`. |
| `src/db/schema.sql` | Canonical fresh-install copy of the same tables/seed (with migration 0008). |

## 1. Run the SQL migrations

With the Supabase project already created, run the migration files. For example:

```bash
psql "$DATABASE_URL" -f src/db/migrations/0008_category_subcategory_taxonomy.sql
psql "$DATABASE_URL" -f src/db/migrations/0012_skincare_subcategory_styles.sql
```

or paste the files into the Supabase SQL Editor.

The migrations:

- creates `public.categories` (`id uuid pk`, `name`, `slug unique`, `icon_url`, `created_at`)
- creates `public.subcategories` (`id uuid pk`, `category_id` FK → `categories.id` on delete
  cascade, `name`, `slug`, `created_at`)
- enables RLS and grants public `SELECT` to `anon` + `authenticated`
- seeds the standard B2B beauty taxonomy listed below
- expands Skincare with 3 display style variants (0012)

### Seeded taxonomy (after 0012)

| Category | Subcategories |
| --- | --- |
| Skincare (Pure EN canonical - 8 items) | Face Serums & Actives, Daily Cleansers & Wash, Day & Night Moisturizers, Sun Care & SPF, Exfoliators & Peels, Face Masks & Sheets, Eye & Lip Treatments, Body Oils & Toners, Anti-Aging & Spot Care |
| Skincare (HI+EN Mix - 7 items) | Serums & Treatments (Serums aur Special Care), Cleansers & Toners (Face Wash aur Toners), Moisturizers & Creams (Moisturizer aur Night Creams), Sunscreen & Sun Care (Sunscreen aur Sun Block), Face Masks & Peels (Face Pack aur Sheet Masks), Eye & Lip Care (Under-Eye Cream aur Lip Balm), Anti-Aging & Spot Care (Jhurriyon aur Daag-Dhabbon ke liye) |
| Skincare (Simple Hinglish - 6 items) | Face Wash & Cleanser, Serum & Drops, Cream & Gel, Sunscreen Lotion, Face Pack & Scrub, Lip Care & Eye Cream |
| Haircare & Styling | Shampoo & Conditioners, Hair Oils & Serums, Scalp Treatments, Hair Color & Styling |
| Color Cosmetics / Makeup | Face Makeup, Lip Products, Eye Makeup, Nails |
| Personal Care & Body | Body Washes, Body Lotions, Soaps & Scrubs, Intimate Care |
| Raw Ingredients & Actives | Botanical Extracts, Active Chemicals, Essential Oils, Carrier Oils, Preservatives & Emulsifiers |
| Packaging & Containers | Bottles & Jars, Droppers & Pumps, Tubes & Compacts, Custom Eco Packaging |
| Salon & Spa Equipment | Facial Machines, Styling Chairs, Treatment Tables, Sterilizers |

### Display Styles

**1. Hindi + English (Easy UI Mix)**
- Serums & Treatments (Serums aur Special Care)
- Cleansers & Toners (Face Wash aur Toners)
- Moisturizers & Creams (Moisturizer aur Night Creams)
- Sunscreen & Sun Care (Sunscreen aur Sun Block)
- Face Masks & Peels (Face Pack aur Sheet Masks)
- Eye & Lip Care (Under-Eye Cream aur Lip Balm)
- Anti-Aging & Spot Care (Jhurriyon aur Daag-Dhabbon ke liye)

**2. Pure Short English (Clean B2B Look)** — NEW CANONICAL
- Face Serums & Actives
- Daily Cleansers & Wash
- Day & Night Moisturizers
- Sun Care & SPF
- Exfoliators & Peels
- Face Masks & Sheets
- Eye & Lip Treatments
- Body Oils & Toners
- Anti-Aging & Spot Care (optional 9th)

**3. Simple Hinglish (Direct & Everyday)**
- Face Wash & Cleanser
- Serum & Drops
- Cream & Gel
- Sunscreen Lotion
- Face Pack & Scrub
- Lip Care & Eye Cream

## 2. Frontend behaviour

- `ProductTaxonomySelector` fetches both tables live with
  `@supabase/supabase-js` through `supabase.from('categories')` and
  `supabase.from('subcategories')`.
- Selecting a **Primary Category** dynamically renders that category's
  subcategories.
- Changing the primary category **resets** all selected subcategories.
- Subcategories are **multi-select** pills.
- The **search bar filters both categories and subcategories** in real time, including Hindi/Hinglish keywords.
- The **Active Taxonomy Path** chip area updates instantly from the current
  primary category + selected subcategories, translated to current display style.
- If Supabase is not configured or the fetch fails, the component gracefully
  falls back to the local demo taxonomy so the form is never blank.
- **NEW:** When Skincare is selected, a language style switcher appears:
  - Compact pills (HI+EN Mix / Pure EN / Hinglish) always visible
  - Expandable full card view with live preview of all 3 styles
  - Selection persisted in `localStorage` key `nexora_skincare_display_style`
  - `useSkincareDisplayStyle()` hook provides `translate()` helper
  - `SkincareTaxonomyShowcase` on homepage shows all 3 variants side-by-side

## 3. Adding / editing categories later

Add or update rows directly in the `categories` and `subcategories` tables
(e.g. through the Supabase dashboard or SQL editor). Because the RFQ form
fetches on mount (and offers a **Refresh** action), new categories appear in
the form without a frontend code change.

For Skincare, new subcategories should be added to `skincareSubcategoryStyles.ts`
with all three display variants, then seeded via a new migration.

## 4. Technical details

- Canonical storage uses Pure English B2B labels
- Display layer translates via `formatSkincareSubcategoryForDisplay(name, style)`
- Search in `taxonomyService.ts` matches against:
  - Canonical English
  - Pure English
  - Hindi+English Mix
  - Simple Hinglish
  - Hindi translations
  - Keywords array (e.g., 'jhurriyan', 'daag dhabba')
- Legacy names kept as aliases for backward compat in migration 0012
