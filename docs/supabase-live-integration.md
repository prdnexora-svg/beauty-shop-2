# Nexora Luxe — Live Supabase Integration

This project is wired for a real Supabase backend. With credentials present it uses real Supabase Auth sessions, RLS-protected PostgreSQL tables, and Supabase-first service queries with local fallback.

## 1. Environment variables

Create `.env` at the repository root (already git-ignored; do not commit):

```bash
VITE_SUPABASE_URL="https://qwaehqsmodekbgvnaavz.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
VITE_SUPABASE_STORAGE_KEY="nexora.auth.qwaehqsmodekbgvnaavz"
```

- On Vercel/Netlify add these as **build/production environment variables** before deployment.
- The app uses `isSupabaseConfigured()` to decide live vs local mode. Any placeholder value (`mock-`, `your-project`, `your-anon`) keeps demo mode.

## 2. Apply the migrations (Supabase SQL Editor)

Run in this order. They are idempotent/safe to re-run.

1. `src/db/schema.sql` — full fresh schema (or apply individual migrations)
2. `src/db/migrations/0002_rls_policies.sql` — RLS on all tenant tables
3. `src/db/migrations/0003_location_sync.sql`
4. `src/db/migrations/0004_supplier_onboarding_workflow.sql`
5. `src/db/migrations/0005_users_column_types.sql`
6. `src/db/migrations/0006_make_phone_nullable_and_add_auth_trigger.sql` — mirror `auth.users` → `public.users`
7. `src/db/migrations/0007_post_likes_and_comments.sql`
8. `src/db/migrations/0008_category_subcategory_taxonomy.sql`
9. `src/db/migrations/0009_supplier_directory_auto_publish.sql`
10. `src/db/migrations/0010_profile_stubs_and_grants.sql`
11. `src/db/migrations/0110_production_rls_hardening.sql` — column-level privacy, no self-verification, admin-only approval
12. `src/db/migrations/0011_orders_payment.sql` — orders table, payment/advance metadata, multi-line JSONB invoice line items, RLS

## 3. Auth configuration

- Authentication is Email/Password + Google OAuth through `@supabase/supabase-js`.
- Auth session is persisted under `VITE_SUPABASE_STORAGE_KEY`.
- Password reset / confirmation emails use `/auth/callback` redirect targets.
- No phone/OTP is required by this app. Leave OTP providers disabled unless you add them.

Supabase Dashboard settings:

- **Authentication → Providers → Email** → enabled.
- **Authentication → Providers → Google** → enabled if you want Google sign-in (add OAuth client credentials).
- **Authentication → URL Configuration** → add `https://your-deployed-domain.callback` with `Site URL` = app origin.
- Email templates use the `/auth/callback` link.

## 4. Row Level Security model (multi-tenant)

| Actor | Table access |
| --- | --- |
| Anonymous / guest | Read active public products, public supplier directory projection, taxonomy |
| Buyer (auth.uid) | Own `profiles_buyer`, own RFQs/enquiries, received quotes for own RFQs, own messages |
| Supplier (verified) | Own `profiles_supplier`, own products, matched RFQ leads, quotes, follow-ups, messages |
| Admin/service role only | Supplier verification/approval RPC, trust fields |

`0110` additionally:

- Revokes table-level `SELECT` on `profiles_supplier` from `anon`/`authenticated` and grants only a directory-safe column projection (no phone, address, GSTIN, PAN or bank data).
- Forces new supplier rows to start `business_pending` / unverified.
- Adds a BEFORE trigger so suppliers cannot self-verify or set themselves `active`/`approved` from the browser.
- Restricts `approve_supplier_onboarding`, `handle_new_auth_user` and `is_verified_supplier` execute privileges.

## 5. Live health check

```bash
npm run db:check
```

It verifies:
- Supabase REST reachability
- Public read on supplier directory, products, categories, subcategories
- RLS-protected tables return an expected policy error rather than an unhandled failure

## 6. Database error handling in the app

- Service layer (`supplierService`, `buyerService`, `taxonomyService`, `socialApi`) wraps every Supabase call in `try/catch`.
- Query errors are logged with `console.warn` and the UI falls back to the local relational store.
- Write operations return `{ ok, source, id, error }` so the UI can show a real failure instead of claiming success.
- Supabase auth errors are classified (`credentials`, `duplicate_email`, `weak_password`, `rate_limited`, `network`, etc.) so the Auth modal shows an actionable message.

## 7. Production checklist

- [ ] `npm run build` passes with the live env vars
- [ ] `npm run db:check` passes from a machine with outbound access
- [ ] Sign up buyer + supplier, confirm email, sign in, verify portal/dashboard load
- [ ] Apply `0110` and confirm a supplier cannot self-verify via RLS/trigger
- [ ] Confirm vendor chunks (`react-vendor`, `supabase`, `motion`, `icons`) are served from the deployed bundle
