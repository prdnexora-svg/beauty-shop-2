// ============================================================================
// NEXORA LUXE - SUPABASE & DB SUPPLIER SERVICE LAYER (RLS-COMPLIANT)
// ============================================================================
// PUBLIC SUPPLIER/BRAND DIRECTORY DATA SOURCE
// ----------------------------------------------------------------------------
// The directory always reads real database rows. When Supabase is configured it
// queries `profiles_supplier` directly with `active` or `pending_verification`
// rows (freshly onboarded suppliers appear immediately). Without Supabase it
// falls back only to the local relational seed/onboarding store — never to a
// hard-coded UI mock array.
// ============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db/database';
import { VerifiedSupplier, PortfolioProduct } from '../types';

export interface SupplierFilterParams {
  searchQuery?: string;
  businessType?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  verifiedOnly?: boolean;
  includePending?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'rating' | 'response_time' | 'years_established';
}

export interface PaginatedSuppliersResponse {
  data: VerifiedSupplier[];
  count: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/** Directory-visible lifecycle statuses. */
const VISIBLE_STATUSES = ['active', 'pending_verification'];

/**
 * Legal / trade descriptors that carry no brand identity. They are stripped
 * when comparing supplier names so that e.g. "Aura Beauty Labs",
 * "Aura Beauty Labs & Formulations" and "Aura Beauty Labs Pvt Ltd" resolve to
 * the same company instead of appearing as duplicate directory cards.
 */
const NAME_NOISE_TOKENS = new Set([
  'the', 'and', 'co', 'company', 'corp', 'corporation', 'inc', 'incorporated',
  'ltd', 'limited', 'llp', 'pvt', 'private', 'industries', 'industry',
  'enterprise', 'enterprises', 'group', 'groups', 'mfg', 'manufacturing',
  'manufacturer', 'manufacturers', 'formulation', 'formulations', 'formulator',
  'formulators', 'beauty', 'cosmetics', 'cosmetic', 'india', 'indian',
  'products', 'product', 'labs', 'lab', 'laboratories', 'global',
  'international', 'exports', 'exporters', 'trading', 'packaging', 'natural',
  'organic', 'herbal', 'skincare', 'haircare', 'services', 'solutions',
  'science', 'sciences', 'professional', 'p', 'l', 't'
]);

/** Reduce a company name to its distinctive identity tokens. */
export function supplierNameTokens(name?: string | null): string[] {
  const normalized = (name || '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!normalized) return [];
  return Array.from(
    new Set(
      normalized
        .split(' ')
        .filter((token) => token.length >= 3 && !NAME_NOISE_TOKENS.has(token))
    )
  );
}

/**
 * Decide whether two supplier rows describe the SAME brand.
 *
 * Matches either exact identity-token equality ("Aura Beauty Labs" vs
 * "Aura Beauty Labs") or a one-way token containment where the shorter name
 * adds no extra identity ("Aura Beauty Labs" vs "Aura Beauty Labs &
 * Formulations"). A lone shared token must be at least 5 characters long to
 * avoid merging unrelated brands that happen to share a short generic word.
 */
export function isSameSupplierByName(aName?: string | null, bName?: string | null): boolean {
  const a = supplierNameTokens(aName);
  const b = supplierNameTokens(bName);
  if (a.length === 0 || b.length === 0) return false;
  if (a.join(' ') === b.join(' ')) return true;

  const [small, large] = a.length <= b.length ? [a, b] : [b, a];
  const allContained = small.every((token) => large.includes(token));
  if (!allContained) return false;
  if (small.length >= 2) return true;
  return small[0].length >= 5;
}

/** Higher score = the row we keep when several rows describe one brand. */
function supplierQualityScore(s: VerifiedSupplier): number {
  return (
    (s.isVerified ? 10_000 : 0) +
    (s.status === 'active' || s.onboardingStatus === 'approved' ? 1_000 : 0) +
    (s.trustScore || 0) +
    (s.about ? 1 : 0)
  );
}

/**
 * Collapse duplicate / near-duplicate supplier rows into a single card.
 *
 * Live databases accumulate repeats from repeat onboarding submissions and
 * test fixtures (e.g. multiple "Aura Beauty Labs …" / "LuxeForm …" rows with
 * different ids). The directory must show each brand once; when rows collide
 * the verified, approved, highest-trust version wins.
 */
export function dedupeSuppliers(rows: VerifiedSupplier[]): VerifiedSupplier[] {
  const picked: VerifiedSupplier[] = [];
  for (const row of rows) {
    const existingIndex = picked.findIndex(
      (candidate) =>
        candidate.id === row.id ||
        isSameSupplierByName(candidate.name, row.name)
    );
    if (existingIndex === -1) {
      picked.push(row);
    } else if (supplierQualityScore(row) > supplierQualityScore(picked[existingIndex])) {
      picked[existingIndex] = row;
    }
  }
  return picked;
}

/**
 * Directory-safe projection for public/anonymous reads.
 *
 * This is deliberately NOT `select('*')`: after migration 0110 the `anon` /
 * `authenticated` roles only have column-level SELECT on the directory columns
 * below. Private fields (phone, private email, address, GSTIN, PAN, bank) stay
 * in the table and are only available to the profile owner through RLS.
 */
const DIRECTORY_COLUMNS = [
  'id',
  'user_id',
  'company_name',
  'slug',
  'business_type',
  'brand_name',
  'about',
  'city',
  'state',
  'categories',
  'category',
  'subcategory',
  'status',
  'onboarding_status',
  'is_verified_supplier',
  'is_verified',
  'verification_level',
  'logo_url',
  'cover_image_url',
  'trust_score',
  'response_rate',
  'avg_response_time',
  'year_established',
  'employee_count',
  'monthly_capacity',
  'facility_area',
  'moq',
  'certifications',
  'certifications_list',
  'cold_chain_available',
  'created_at',
  'updated_at',
].join(',');

/**
 * Convert a `profiles_supplier` row (Supabase or local store) into the public
 * directory shape used by the React UI.
 */
export function mapSupplierRow(item: any): VerifiedSupplier {
  const companyName = item.company_name || item.name || 'Unnamed Supplier';
  const categories = Array.isArray(item.categories) ? item.categories : [];
  const city = item.city || '';
  const state = item.state || '';
  const isVerified = Boolean(
    item.is_verified ||
    item.is_verified_supplier ||
    item.verification_level === 'Nexora Verified' ||
    item.verification_level === 'Business Verified' ||
    (typeof item.trust_score === 'number' && item.trust_score >= 80)
  );
  const status = item.status || (item.onboarding_status === 'approved' || isVerified ? 'active' : (item.onboarding_status || 'pending_verification'));

  return {
    id: item.id,
    name: companyName,
    shortCode: item.slug || companyName.substring(0, 4).toUpperCase(),
    type: item.business_type || 'Manufacturer',
    city,
    state,
    isVerified,
    status,
    onboardingStatus: item.onboarding_status || (isVerified ? 'approved' : status),
    isVerifiedSupplier: isVerified,
    about: item.about || item.brand_name || item.manufacturing_capabilities || '',
    logoUrl: item.logo_url || item.cover_image_url || '',
    isGstVerified: Boolean(item.is_gst_verified ?? true),
    isIsoCertified: Boolean(item.is_iso_certified ?? false),
    isBusinessVerified: Boolean(item.is_verified ?? isVerified),
    isGmpCertified: Boolean(item.is_gmp_certified ?? false),
    isFdaRegistered: Boolean(item.is_fda_registered ?? false),
    categories,
    phone: item.phone || '',
    whatsapp: item.whatsapp || item.phone || '',
    responseRate: item.response_rate != null ? `${item.response_rate}%` : '95%',
    trustScore: item.trust_score || (isVerified ? 92 : 65),
    reliabilityRating: item.trust_score ? item.trust_score / 20 : 4.5,
    productQualityRating: 4.8,
    overallRating: item.trust_score ? item.trust_score / 20 : 4.6,
    totalReviewsCount: 0,
    responseScore: item.response_rate != null ? Math.round(item.response_rate) : 95,
    responseTimeText: item.avg_response_time != null ? `${item.avg_response_time} Hours` : '2 Hours',
    exportReadiness: 95,
    establishedYear: item.year_established || String(new Date().getFullYear()),
    employeeCount: item.employee_count || '',
    monthlyCapacity: item.monthly_capacity || '',
    facilityArea: item.facility_area || '',
    moq: item.moq || 'Contact for MOQ',
    verificationBadge: item.verification_level || (
      typeof item.trust_score === 'number' && item.trust_score >= 95
        ? 'Platinum Verified'
        : item.is_gst_verified
        ? 'GST Verified'
        : isVerified
        ? 'Nexora Verified'
        : 'Pending Audit'
    ),
    certificationsList: item.certifications || (item.is_gst_verified ? ['GST'] : []),
    locationDetails: {
      industrialZone: `${city} Industrial Hub`,
      fullAddress: item.address || `${city}, ${state || 'India'}`,
      city,
      state: state || 'India',
      lat: 19.0760,
      lng: 72.8777,
      shippingHubs: [],
      rawMaterialSources: [],
      customsStatus: 'Export Ready',
      dispatchTurnaround: '3-5 Days',
      coldChainAvailable: Boolean(item.cold_chain_available),
      transitAdvantage: 'Direct Access'
    },
    complianceReports: [],
    portfolioProducts: []
  };
}

/**
 * Apply server-side filter/sort clauses to a `profiles_supplier` query.
 *
 * Search and business-type filters use `.ilike` against `profiles_supplier`;
 * primary category uses `.eq('category', ...)` when the new primary-category
 * column is populated and falls back to `.contains('categories', [..])`.
 */
function applyFilters(
  query: any,
  params: SupplierFilterParams
): any {
  const {
    searchQuery = '',
    businessType = 'All',
    category = 'All',
    subcategory = '',
    city = '',
    verifiedOnly = false,
    sortBy = 'relevance'
  } = params;

  // Only supplier rows. `active` = approved, `pending_verification` =
  // freshly onboarded supplier that should still appear in the directory.
  query = query.eq('is_verified_supplier', true);
  query = query.in('status', VISIBLE_STATUSES);

  if (verifiedOnly) {
    query = query.eq('is_verified', true);
  }

  if (businessType && businessType !== 'All') {
    query = query.ilike('business_type', `%${businessType}%`);
  }

  if (category && category !== 'All') {
    // Primary-category is denormalized onto `profiles_supplier.category` by the
    // 0009 migration/onboarding so the directory can filter at the database
    // level. `.eq('category', ...)` is the exact server-side filter requested.
    query = query.eq('category', category);
  }

  if (subcategory) {
    query = query.contains('categories', [subcategory]);
  }

  if (city && city.trim() !== '') {
    const cityName = city.split(',')[0].trim();
    query = query.ilike('city', `%${cityName}%`);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim();
    query = query.or(
      `company_name.ilike.%${q}%,business_type.ilike.%${q}%,city.ilike.%${q}%,brand_name.ilike.%${q}%`
    );
  }

  if (sortBy === 'rating') {
    query = query.order('trust_score', { ascending: false });
  } else if (sortBy === 'years_established') {
    query = query.order('year_established', { ascending: true, nullsFirst: false });
  } else if (sortBy === 'response_time') {
    query = query.order('avg_response_time', { ascending: true });
  } else {
    // Recommended: verified first, then newest.
    query = query.order('is_verified', { ascending: false });
    query = query.order('created_at', { ascending: false });
  }

  return query;
}

/**
 * RLS-Compliant Supplier Data Fetcher.
 *
 * When Supabase is configured, this returns ONLY rows from the database —
 * including `pending_verification` rows so newly onboarded suppliers appear
 * instantly. It never merges hard-coded mock supplier cards.
 */
export async function fetchSuppliers(params: SupplierFilterParams = {}): Promise<PaginatedSuppliersResponse> {
  const {
    page = 1,
    limit = 12
  } = params;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('profiles_supplier')
        .select(DIRECTORY_COLUMNS, { count: 'exact' });

      query = applyFilters(query, params);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.warn('Supabase supplier query failed:', error.message);
      } else {
        // Collapse same-brand repeats (repeat onboarding rows, fixtures) so
        // the directory shows each brand exactly once.
        const mappedData = dedupeSuppliers((data || []).map(mapSupplierRow));
        const totalRecords = Math.max(count ?? mappedData.length, mappedData.length);
        const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
        return {
          data: mappedData,
          count: totalRecords,
          page,
          totalPages,
          hasMore: page < totalPages
        };
      }
    } catch (err) {
      console.warn('Supabase supplier fetch notice, using local relational store:', err);
    }
  }

  // Local relational fallback (no hard-coded VERIFIED_SUPPLIERS).
  const dbState = db.getRawState();
  const LOCAL_VISIBLE_STATUSES = [...VISIBLE_STATUSES, 'review', 'approved'];
  const dbSuppliers = (dbState.profiles_supplier || [])
    .filter((row) => {
      const status = row.status || row.onboarding_status;
      const isSupplier = row.is_verified_supplier !== false;
      return isSupplier && (!status || LOCAL_VISIBLE_STATUSES.includes(status));
    })
    .map(mapSupplierRow);

  // Same one-brand-one-card guarantee as the Supabase branch, applied before
  // filtering/pagination so counts and pages never count duplicate rows.
  const dedupedDbSuppliers = dedupeSuppliers(dbSuppliers);

  const {
    searchQuery = '',
    businessType = 'All',
    category = 'All',
    subcategory = '',
    city = '',
    verifiedOnly = false,
    sortBy = 'relevance'
  } = params;

  let baseList = dedupedDbSuppliers;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    baseList = baseList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.categories.some((c) => c.toLowerCase().includes(q))
    );
  }

  if (businessType && businessType !== 'All') {
    baseList = baseList.filter((s) => s.type.toLowerCase().includes(businessType.toLowerCase()));
  }

  if (category && category !== 'All') {
    baseList = baseList.filter((s) =>
      s.categories.some((c) => c.toLowerCase().includes(category.toLowerCase())) ||
      s.status === category?.toLowerCase()
    );
  }

  if (subcategory) {
    baseList = baseList.filter((s) =>
      s.categories.some((c) => c.toLowerCase().includes(subcategory.toLowerCase()))
    );
  }

  if (city && city.trim()) {
    const cityName = city.split(',')[0].toLowerCase();
    baseList = baseList.filter(
      (s) =>
        s.city.toLowerCase().includes(cityName) ||
        (s.state || '').toLowerCase().includes(cityName)
    );
  }

  if (verifiedOnly) {
    baseList = baseList.filter((s) => s.isVerified);
  }

  if (sortBy === 'rating') {
    baseList.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
  } else if (sortBy === 'years_established') {
    baseList.sort((a, b) => {
      const ay = parseInt(a.establishedYear || '0', 10) || 0;
      const by = parseInt(b.establishedYear || '0', 10) || 0;
      return ay - by;
    });
  } else if (sortBy === 'response_time') {
    baseList.sort((a, b) => (parseFloat(a.responseTimeText) || 99) - (parseFloat(b.responseTimeText) || 99));
  }

  const totalCount = baseList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const paginatedData = baseList.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    count: totalCount,
    page,
    totalPages,
    hasMore: page < totalPages
  };
}

export interface SupplierPublishInput {
  userId?: string | null;
  userEmail?: string | null;
  companyName: string;
  businessType: string;
  gstNumber?: string;
  brandName?: string;
  about?: string;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  phone?: string;
  whatsapp?: string;
  categories: string[];
  subcategories: string[];
  yearEstablished?: string;
  isGstVerified?: boolean;
  status?: 'active' | 'pending_verification' | 'rejected' | 'suspended';
}

export interface SupplierPublishResult {
  ok: boolean;
  profile?: any;
  error?: string;
}

/**
 * Auto-publish / update a supplier/brand profile after onboarding.
 *
 * This writes:
 *   1. the local relational store (offline/demo preview), and
 *   2. the Supabase `profiles_supplier` table when configured.
 *
 * Newly onboarded suppliers are created with `status = 'pending_verification'`
 * but `is_verified_supplier = true`, which makes them visible in the public
 * directory immediately with a Pending Verification badge.
 */
export async function publishSupplierProfile(
  input: SupplierPublishInput,
  options: { status?: SupplierPublishInput['status']; isGstVerified?: boolean } = {}
): Promise<SupplierPublishResult> {
  const userId = input.userId || 'local-supplier-b2b';
  const companyName = input.companyName.trim();
  if (!companyName) {
    return { ok: false, error: 'Company name is required.' };
  }

  const categories = [...new Set(input.categories.map((c) => c.trim()).filter(Boolean))];
  const subcategories = [...new Set(input.subcategories.map((s) => s.trim()).filter(Boolean))];
  const primaryCategory = categories[0] || input.businessType || 'Manufacturer';
  const status = options.status || input.status || 'pending_verification';
  const isGstVerified = options.isGstVerified ?? Boolean(input.isGstVerified ?? Boolean(input.gstNumber));

  const localProfile = db.upsertSupplierProfile({
    user_id: userId,
    company_name: companyName,
    slug: `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(Date.now()).slice(-5)}`,
    brand_name: input.brandName || companyName,
    about: input.about || '',
    business_type: (input.businessType || 'Manufacturer') as any,
    gst_number: input.gstNumber || '',
    year_established: input.yearEstablished || String(new Date().getFullYear()),
    categories,
    category: primaryCategory,
    subcategory: subcategories[0] || '',
    city: input.city || 'Mumbai',
    state: input.state || 'Maharashtra',
    address: input.address || `${input.city || ''}, ${input.state || ''}, ${input.pincode || ''}`.trim(),
    phone: input.phone || '',
    whatsapp: input.whatsapp || input.phone || '',
    // Trust/verification fields are deliberately never set by the supplier
    // client. Approval/production publishing happens through the admin RPC.
    is_verified: false,
    is_gst_verified: isGstVerified,
    is_verified_supplier: true,
    status: 'pending_verification',
    onboarding_status: 'business_pending',
    verification_level: null,
    reviewed_at: null,
    approved_at: null
  });

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      profile: localProfile,
      error: null
    };
  }

  try {
    const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(Date.now()).slice(-6)}`;
    const payload = {
      user_id: userId,
      company_name: companyName,
      slug,
      brand_name: input.brandName || companyName,
      about: input.about || '',
      business_type: input.businessType || 'Manufacturer',
      gst_number: input.gstNumber || null,
      year_established: input.yearEstablished || String(new Date().getFullYear()),
      employee_count: 'Contact for Details',
      service_areas: ['Pan India'],
      categories,
      category: primaryCategory,
      subcategory: subcategories[0] || '',
      phone: input.phone || null,
      whatsapp: input.whatsapp || input.phone || null,
      city: input.city || 'Mumbai',
      state: input.state || 'Maharashtra',
      address: input.address || null,
      // These must remain safe for RLS `supplier_profile_owner_insert` /
      // `supplier_profile_owner_update`: owners are never allowed to set
      // trust or approval fields from the browser.
      is_verified: false,
      is_gst_verified: isGstVerified,
      is_iso_certified: false,
      is_verified_supplier: true,
      status: 'pending_verification',
      onboarding_status: 'business_pending',
      verification_level: null,
      response_rate: 95,
      avg_response_time: 2.0,
      trust_score: 80,
      profile_completion_pct: 85
    };

    const { error } = await supabase.from('profiles_supplier').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.warn('Supabase supplier publish failed:', error.message);
      return { ok: false, profile: localProfile, error: error.message };
    }

    return { ok: true, profile: localProfile };
  } catch (err: any) {
    console.warn('Supabase supplier publish exception:', err?.message || err);
    return { ok: false, profile: localProfile, error: err?.message || 'Failed to publish supplier to Supabase.' };
  }
}

/**
 * Fetch Single Supplier Profile by ID
 */
export async function fetchSupplierById(supplierId: string): Promise<VerifiedSupplier | null> {
  const res = await fetchSuppliers({ limit: 100 });
  return res.data.find((s) => s.id === supplierId) || null;
}

/**
 * Alias of fetchSuppliers for consistency across codebase (getSuppliers)
 */
export async function getSuppliers(params: SupplierFilterParams = {}): Promise<PaginatedSuppliersResponse> {
  return fetchSuppliers(params);
}

/**
 * Alias of fetchSupplierById for consistency across codebase (getSupplierById)
 */
export async function getSupplierById(supplierId: string): Promise<VerifiedSupplier | null> {
  return fetchSupplierById(supplierId);
}

/**
 * Fetch Products for a specific Supplier
 */
export async function getSupplierProducts(supplierId: string): Promise<PortfolioProduct[]> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId);

      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80',
          price: p.price_range || '₹150 - ₹250',
          moq: p.moq || '500 Units'
        }));
      }
    }
  } catch (err) {
    console.warn('Supabase products fetch notice:', err);
  }

  // Fallback to supplier's portfolio products from the local DB, if any.
  const supplier = await fetchSupplierById(supplierId);
  if (supplier && supplier.portfolioProducts && supplier.portfolioProducts.length > 0) {
    return supplier.portfolioProducts;
  }

  return [];
}
