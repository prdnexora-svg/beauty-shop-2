# Dynamic Category & Subcategory Taxonomy — Setup

The Nexora Luxe RFQ form now reads its Category / Subcategory taxonomy live
from Supabase, instead of relying on a hard-coded frontend list.

## What was added

| File | Purpose |
| --- | --- |
| `src/db/migrations/0008_category_subcategory_taxonomy.sql` | Creates `categories` + `subcategories`, RLS, grants, and seed data. |
| `src/lib/taxonomyService.ts` | Supabase fetch, fallback catalog, build/group, and search filtering. |
| `src/hooks/useTaxonomyCatalog.ts` | React hook that loads the live catalog on mount. |
| `src/components/ProductTaxonomySelector.tsx` | Shared RFQ taxonomy control (search, category select, multi-select pills, active path). |
| `src/components/RFQModal.tsx` | Quick RFQ modal now uses `ProductTaxonomySelector`. |
| `src/db/schema.sql` | Canonical fresh-install copy of the same tables/seed (with migration 0008). |

## 1. Run the SQL migration

With the Supabase project already created, run the migration file. For example:

```bash
psql "$DATABASE_URL" -f src/db/migrations/0008_category_subcategory_taxonomy.sql
```

or paste the file into the Supabase SQL Editor.

The migration:

- creates `public.categories` (`id uuid pk`, `name`, `slug unique`, `icon_url`, `created_at`)
- creates `public.subcategories` (`id uuid pk`, `category_id` FK → `categories.id` on delete
  cascade, `name`, `slug`, `created_at`)
- enables RLS and grants public `SELECT` to `anon` + `authenticated`
- seeds the standard B2B beauty taxonomy listed below

### Seeded taxonomy

| Category | Subcategories |
| --- | --- |
| Skincare | Serums & Treatments, Cleansers & Toners, Moisturizers & Creams, Sunscreen & Sun Care, Face Masks & Peels, Eye & Lip Care |
| Haircare & Styling | Shampoo & Conditioners, Hair Oils & Serums, Scalp Treatments, Hair Color & Styling |
| Color Cosmetics / Makeup | Face Makeup, Lip Products, Eye Makeup, Nails |
| Personal Care & Body | Body Washes, Body Lotions, Soaps & Scrubs, Intimate Care |
| Raw Ingredients & Actives | Botanical Extracts, Active Chemicals, Essential Oils, Carrier Oils, Preservatives & Emulsifiers |
| Packaging & Containers | Bottles & Jars, Droppers & Pumps, Tubes & Compacts, Custom Eco Packaging |
| Salon & Spa Equipment | Facial Machines, Styling Chairs, Treatment Tables, Sterilizers |

## 2. Frontend behaviour

- `ProductTaxonomySelector` fetches both tables live with
  `@supabase/supabase-js` through `supabase.from('categories')` and
  `supabase.from('subcategories')`.
- Selecting a **Primary Category** dynamically renders that category's
  subcategories.
- Changing the primary category **resets** all selected subcategories.
- Subcategories are **multi-select** pills.
- The **search bar filters both categories and subcategories** in real time.
- The **Active Taxonomy Path** chip area updates instantly from the current
  primary category + selected subcategories.
- If Supabase is not configured or the fetch fails, the component gracefully
  falls back to the local demo taxonomy so the form is never blank.

## 3. Adding / editing categories later

Add or update rows directly in the `categories` and `subcategories` tables
(e.g. through the Supabase dashboard or SQL editor). Because the RFQ form
fetches on mount (and offers a **Refresh** action), new categories appear in
the form without a frontend code change.
