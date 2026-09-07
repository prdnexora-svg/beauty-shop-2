# Production readiness audit — Beauty Shop / Nexora Luxe

Date: 2026-09-06

Repository: `prdnexora-svg/beauty-shop-2`

Branch: `arena/01a07739-beauty-shop-2`

## Headline result

- **TypeScript:** pass (0 errors)
- **Production build:** pass (0 errors)
- **Automated tests:** 164/164 passing (includes new navigation, dead-link, anchor-safety and render-branch regressions)
- **Navigation integrity:** no hard-coded screen id points to a screen that does not exist; every declared screen has a render branch in `App.tsx`
- **Dead/broken UI links found and removed:** `search`, `suppliers`, `supplier-chat` (invalid nav targets), `Procurement Terms` `href="#"`, and a simulated “Export Audit Vault” Vault ZIP download in Supplier Verification.

## What was exercised

### Buyer / guest journeys
- Guest public marketplace: Explore → Products → Supplier Directory → Brand Directory → OEM/Private Label → Supplier Profile → Product Detail.
- Directory search now routes to `search-results` with supplier scope (previously dead `search` id), and “View Full Directory” routes to `supplier-directory` (previously dead `suppliers` id).
- Post Requirement from guest → sign-in modal → successful sign-in resumes the pending RFQ screen.
- Enquiry / Call / WhatsApp / Chat entry points require sign-in; after buyer sign-in the protected workspace is reachable.
- Buyer onboarding → Buyer Dashboard → RFQ Tracking, Enquiry Log, Buyer Profile, Saved Suppliers, Notification Center.
- Network “Send Message” now opens the existing chat drawer (previously dead `supplier-chat` id).

### Supplier journeys
- Supplier CTA → supplier-registration modal → Supplier Onboarding → Supplier Admin Portal.
- Supplier Verification center, inventory/product management, RFQ responses and analytics tabs all point to the supplier portal.
- Supplier accounts are correctly confined to the Supplier Admin Portal; public marketplace navigation is never advertised to them.

### Access policy
- `roleAccess.ts` remains the single source of truth.
- Guests are blocked from protected screens with a sign-in prompt.
- Buyers are blocked from supplier screens and vice versa; each denial redirects to a reachable home screen.
- Navigation filtering never shows a destination the guard would reject.

## Navigation fixes made

| File | Issue | Fix |
| --- | --- | --- |
| `src/components/DirectoryHubScreen.tsx` | `onNavigate('search')` and `onNavigate('suppliers')` were not declared screens → blank page | Route to `search-results` (supplier scope) and `supplier-directory` |
| `src/components/BuyerDashboard.tsx` | `supplier-chat` was not a declared screen | Wire “Send Message” to the existing chat drawer via a new `onOpenChat` prop |
| `src/components/PostRequirementScreen.tsx` | “Procurement Terms” anchor was `href="#"` (dead link) with no destination | Removed dead link; kept styled terms text (no advertised route that does not exist) |
| `src/components/SupplierVerificationScreen.tsx` | Simulated “Export Audit Vault” created a `.zip` `href="#"` download that went nowhere | Removed fake export action |
| `src/lib/roleAccess.ts` | — | Unchanged; used as the source of truth for the new nav integrity checks |

## Responsive / layout verification

- **Shared headers:** desktop nav uses `lg:flex`; mobile uses hamburger drawer. Both Luxe and TopNav variants mount a mobile menu. Mobile bottom navigation is present.
- **Body:** root CSS sets `overflow-x: hidden` so decorative blur blobs and wide tables cannot create a page-level horizontal scroll.
- **Wide content:** product comparison (`min-w-[700px]`) and supplier comparison (`min-w-[760px]`) tables are wrapped in `overflow-x-auto` and remain scrollable inside their modal on mobile.
- **Modals:** all fixed overlays use viewport-aware sizing (`max-h-*`, `w-full`, `sm:w-*`) and `p-4` gutters.
- **Grids:** home and directory sections use `grid-cols-1 sm/grid/lg` progressions; hero and banner layouts stack below `lg`.
- Long text is truncated with `truncate`/`max-w-*` in profile, card and table surfaces.

Note: this is a code-level responsive audit. No browser-based screenshot comparison was available in this session; mobile/desktop visual checks remain listed as a final release gate.

## Production build

- `npm run typecheck` → pass
- `npm test` → 164/164 pass
- `npm run build` → pass, no build errors
- Vendor runtimes are split into stable cacheable chunks:

| Asset | Minified | Gzip |
| --- | --- | --- |
| `index-*.js` (app shell) | 1.11 MB | 241.6 KB |
| `supabase-*.js` | 222.5 KB | 58.2 KB |
| `react-vendor-*.js` | 193.8 KB | 60.5 KB |
| `motion-*.js` | 128.9 KB | 42.4 KB |
| `icons-*.js` | 55.4 KB | 11.4 KB |
| `index-*.css` | 166.4 KB | 26.1 KB |

- A `chunkSizeWarningLimit` is set because the feature-complete SPA intentionally ships as one app shell after vendor splitting; the build log is clean (no output warnings).

## Remaining production gaps (unchanged from the app audit)

These are not navigation or build errors, but they prevent a real multi-user launch:

1. There is **no configured Supabase project** in this checkout. Sign-in is a clearly-namespaced local demo session. Production auth requires `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` plus the SQL migrations.
2. RFQs, enquiries, quotes, products, messages and uploads still rely partly on local stores / fixtures. Full shared-backend CRUD is required for cross-device delivery.
3. Supplier verification still includes hard-coded / simulated review states and document actions in several places.
4. Footer policy/help/report/social pages are not yet implemented with approved content and URLs.
5. Browser-path/deep-link routing and route-aware metadata are still pending.

## Files changed in this audit

- `vite.config.ts` — vendor chunk splitting + build threshold
- `src/App.tsx` — wire buyer dashboard chat prop
- `src/components/BuyerDashboard.tsx` — add `onOpenChat`, replace dead `supplier-chat` nav
- `src/components/DirectoryHubScreen.tsx` — fix `search` / `suppliers` nav targets
- `src/components/PostRequirementScreen.tsx` — remove dead `href="#"` terms link
- `src/components/SupplierVerificationScreen.tsx` — remove simulated Vault export
- `src/tests/navigationIntegrity.test.ts` — new nav integrity, dead-link and anchor-safety regressions
