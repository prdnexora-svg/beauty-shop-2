# Supplier / Brand Directory Auto-Publish & Dynamic Filtering

This addresses the gap where suppliers/brands registered or updated in onboarding
did not automatically appear in the public Supplier/Brand Directory.

## What changed

| File | Purpose |
| --- | --- |
| `src/db/migrations/0009_supplier_directory_auto_publish.sql` | Adds `status`, `is_verified_supplier`, `category`, `subcategory`, `brand_name`, `about` to `profiles_supplier`, owner INSERT RLS, grants, and indexes. |
| `src/services/supplierService.ts` | Live Supabase directory queries with `.ilike()` / `.eq('category', ...)` and no hard-coded mock supplier merge. |
| `src/components/SupplierDirectoryScreen.tsx` | `/suppliers` page now starts empty and renders only database rows; shows Pending Verification badges and live counts. |
| `src/components/BrandDirectoryDetailScreen.tsx` | `/brands` page now fetches live suppliers instead of hard-coded brand cards. |
| `src/components/SupplierOnboardingScreen.tsx` | Publishing supplier/brand profile automatically after Business Details and on final Review/Launch. |
| `src/App.tsx` | Passes the logged-in user id / email / role into onboarding for RLS-safe writes. |

## 1. Run the migration

```bash
psql "$DATABASE_URL" -f src/db/migrations/0009_supplier_directory_auto_publish.sql
```

or paste it into the Supabase SQL Editor. It:

- adds directory lifecycle columns to `profiles_supplier`
- makes each auth user have one supplier profile (`user_id` unique index)
- maps existing supplier rows to `active` / `pending_verification`
- adds an owner INSERT policy so onboarding can auto-publish
- grants public `SELECT` to `anon` / `authenticated`

## 2. Directory behaviour

- `/suppliers` (SupplierDirectoryScreen) and `/brands` (BrandDirectoryDetailScreen)
  fetch live `profiles_supplier` rows through `fetchSuppliers()`.
- Newly onboarded suppliers are published with:
  - `status = 'pending_verification'`
  - `is_verified_supplier = true`
  - `is_verified = false` until Nexora approves them
- They appear immediately with a **Pending Verification** badge.
- The category filter uses Supabase `.eq('category', selectedCategory)` and
  search uses `.ilike()` on company name, business type, brand name, and city.
- When Supabase is not configured, the directory falls back to the local
  relational store only — it never merges hard-coded mock supplier cards.
