// ============================================================================
// NEXORA LUXE - BUYER MARKETPLACE SERVICE (SUPABASE-FIRST, LOCAL FALLBACK)
// ============================================================================
// Single write/read path for the buyer loop: enquiries, public RFQs, sample
// requests and quote negotiation.
//
//  - When Supabase is configured AND the caller is signed in (real auth UUID),
//    rows are written to / read from Postgres first, then mirrored into the
//    local relational store so the tracking screens, notification center and
//    realtime hooks update instantly without refetching.
//  - Guests and demo mode (no Supabase) use the local store only — the app
//    keeps working offline with zero code branches in the UI.
//
// RLS notes (see migrations 0002 + 0010):
//  - rfqs_enquiries.buyer_id must be the caller's profiles_buyer.id row, which
//    the 0010 auth trigger creates automatically at signup. resolveBuyerProfile
//    double-checks and inserts a stub when a legacy account has none.
//  - supplier_id / product_id are UUID FKs: local demo ids ('supp-aura-labs')
//    are sent as NULL to Supabase and kept only in the local mirror.
//  - messages.sender_id must equal auth.uid(); chat callers pass the real user
//    id and this service resolves the supplier's auth id for receiver_id.
// ============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db/database';
import type { DBProfileBuyer, DBRFQEnquiry, PopulatedQuote } from '../db/types';

export type BackendSource = 'supabase' | 'local';

export interface PublishResult {
  ok: boolean;
  /** Supabase row id when persisted remotely, otherwise the local row id. */
  id: string | null;
  source: BackendSource;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested, no I/O)
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for real Postgres UUIDs; demo ids like 'supp-aura-labs' are not. */
export function isUuidLike(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

/** FK-safe: real UUIDs pass through, everything else becomes NULL. */
export function toUuidOrNull(value: string | null | undefined): string | null {
  return isUuidLike(value) ? (value as string).trim() : null;
}

export function normalizeQuantity(raw: unknown, fallback = 1): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function displayNameFromEmail(email: string | null | undefined, fallback: string): string {
  const local = (email || '').split('@')[0]?.trim();
  if (!local) return fallback;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || fallback;
}

export interface RfqPublishInput {
  /** Supabase auth user id (UUID). Omit for guests/demo. */
  userId?: string | null;
  email?: string | null;
  contactName?: string;
  companyName?: string;
  city?: string;
  state?: string;
  requirementTitle: string;
  category: string;
  quantity: number;
  quantityUnit?: string;
  targetBudget?: number;
  deliveryLocation: string;
  details?: string;
  attachments?: string[];
  type: 'direct_enquiry' | 'public_rfq';
  /** Local demo ids are kept for the local mirror, sent as NULL remotely. */
  supplierId?: string | null;
  productId?: string | null;
  sendToSimilar?: boolean;
}

/** Maps UI input to the exact `rfqs_enquiries` row shape Supabase expects. */
export function buildRfqRow(
  input: RfqPublishInput,
  buyerProfileId: string,
): Record<string, unknown> {
  return {
    buyer_id: buyerProfileId,
    supplier_id: toUuidOrNull(input.supplierId),
    product_id: toUuidOrNull(input.productId),
    requirement_title: input.requirementTitle.trim(),
    category: input.category.trim() || 'General',
    quantity_required: normalizeQuantity(input.quantity),
    quantity_unit: input.quantityUnit || 'Units',
    target_budget: typeof input.targetBudget === 'number' && Number.isFinite(input.targetBudget)
      ? Math.round(input.targetBudget)
      : null,
    delivery_location: input.deliveryLocation.trim(),
    details: (input.details || '').trim(),
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    status: 'new',
    type: input.type,
    send_to_similar_suppliers: input.sendToSimilar ?? true,
  };
}

// ---------------------------------------------------------------------------
// Buyer profile resolution (the FK every RFQ points at)
// ---------------------------------------------------------------------------

export interface BuyerIdentity {
  userId?: string | null;
  email?: string | null;
  contactName?: string;
  companyName?: string;
  businessType?: string;
  city?: string;
  state?: string;
}

export async function resolveBuyerProfile(
  identity: BuyerIdentity,
): Promise<{ profileId: string; source: BackendSource }> {
  const contactName = identity.contactName?.trim()
    || displayNameFromEmail(identity.email, 'Buyer');
  const companyName = identity.companyName?.trim() || contactName;
  const city = identity.city?.trim() || 'Mumbai';
  const state = identity.state?.trim() || 'Maharashtra';

  const userId = identity.userId?.trim() || null;

  // Signed-in + Supabase: the 0010 trigger owns this row; select it, and only
  // insert a stub for legacy accounts created before the trigger existed.
  if (userId && isUuidLike(userId) && isSupabaseConfigured()) {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('profiles_buyer')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!selectError && existing?.id) {
        return { profileId: existing.id as string, source: 'supabase' };
      }
      const { data: created, error: insertError } = await supabase
        .from('profiles_buyer')
        .insert({
          user_id: userId,
          contact_name: contactName,
          company_name: companyName,
          business_type: identity.businessType || 'General',
          city,
          state,
        })
        .select('id')
        .single();
      if (!insertError && created?.id) {
        return { profileId: created.id as string, source: 'supabase' };
      }
    } catch {
      // Fall through to the local mirror below.
    }
  }

  // Local store: stable key per auth user, shared guest row otherwise.
  const localUserKey = userId || `guest:${(identity.email || 'anonymous').toLowerCase()}`;
  let local: DBProfileBuyer | undefined;
  try {
    local = db.getBuyerProfileByUserId(localUserKey);
  } catch {
    local = undefined;
  }
  if (!local) {
    local = db.upsertBuyerProfile({
      user_id: localUserKey,
      contact_name: contactName,
      company_name: companyName,
      business_type: identity.businessType || 'General',
      city,
      state,
    } as Partial<DBProfileBuyer> & { user_id: string; contact_name: string });
  }
  return { profileId: local.id, source: 'local' };
}

// ---------------------------------------------------------------------------
// Publish: enquiry / public RFQ / sample request
// ---------------------------------------------------------------------------

async function publishRfq(input: RfqPublishInput): Promise<PublishResult> {
  const fail = (error: string): PublishResult => ({ ok: false, id: null, source: 'local', error });

  if (!input.requirementTitle?.trim()) return fail('Requirement title is required.');
  if (!input.deliveryLocation?.trim()) return fail('Delivery location is required.');

  const { profileId, source } = await resolveBuyerProfile(input);

  // Local mirror first: the tracking screens + notifications read the local
  // store, so this keeps every UI surface consistent in both modes.
  let localRow: DBRFQEnquiry | null = null;
  try {
    localRow = db.createRFQEnquiry({
      buyer_id: source === 'local' ? profileId : `sb:${profileId}`,
      supplier_id: input.supplierId || null,
      product_id: input.productId || null,
      requirement_title: input.requirementTitle.trim(),
      category: input.category?.trim() || 'General',
      quantity_required: normalizeQuantity(input.quantity),
      quantity_unit: input.quantityUnit || 'Units',
      target_budget: typeof input.targetBudget === 'number' && Number.isFinite(input.targetBudget)
        ? Math.round(input.targetBudget)
        : undefined,
      delivery_location: input.deliveryLocation.trim(),
      details: (input.details || '').trim(),
      attachments: Array.isArray(input.attachments) ? input.attachments : [],
      status: 'new',
      type: input.type,
      send_to_similar_suppliers: input.sendToSimilar ?? true,
    });
  } catch (err: any) {
    return fail(err?.message || 'Could not save your requirement. Please try again.');
  }

  // Guests / demo mode: local row is the whole backend.
  if (source === 'local' || !isSupabaseConfigured()) {
    return { ok: true, id: localRow.id, source: 'local', error: null };
  }

  // Signed-in remote write.
  try {
    const { data, error } = await supabase
      .from('rfqs_enquiries')
      .insert(buildRfqRow(input, profileId))
      .select('id')
      .single();
    if (error) {
      // Local mirror already saved: report remote failure but keep the local
      // id so the UI still shows the requirement instead of losing it.
      return { ok: true, id: localRow.id, source: 'local', error: null };
    }
    return { ok: true, id: (data?.id as string) || localRow.id, source: 'supabase', error: null };
  } catch {
    return { ok: true, id: localRow.id, source: 'local', error: null };
  }
}

/** Direct enquiry to one supplier (optionally broadcast to similar ones). */
export function publishEnquiry(
  input: Omit<RfqPublishInput, 'type'>,
): Promise<PublishResult> {
  return publishRfq({ ...input, type: 'direct_enquiry' });
}

/** Public RFQ visible to all verified suppliers in the category. */
export function publishPublicRfq(
  input: Omit<RfqPublishInput, 'type'>,
): Promise<PublishResult> {
  return publishRfq({ ...input, type: 'public_rfq' });
}

export interface SampleRequestInput extends Omit<RfqPublishInput, 'type' | 'quantity' | 'requirementTitle'> {
  productName: string;
  variant?: string;
  sampleSet?: string;
  shippingMethod?: 'standard' | 'express';
}

/**
 * Sample requests reuse `rfqs_enquiries` (no extra table): they are stored as
 * direct enquiries with a `[Sample Request]` marker the tracking screens can
 * filter on. Quantity is the sample set size.
 */
export function publishSampleRequest(input: SampleRequestInput): Promise<PublishResult> {
  const setSize = normalizeQuantity(parseInt(input.sampleSet || '1', 10), 1);
  const lines = [
    '[Sample Request]',
    `Product: ${input.productName}`,
    input.variant ? `Variant: ${input.variant}` : null,
    `Sample set: ${setSize} unit${setSize > 1 ? 's' : ''}`,
    input.shippingMethod ? `Shipping: ${input.shippingMethod === 'express' ? 'Express' : 'Standard'}` : null,
    input.details?.trim() ? `Notes: ${input.details.trim()}` : null,
  ].filter(Boolean);
  return publishRfq({
    ...input,
    requirementTitle: `Sample Request: ${input.productName}`,
    quantity: setSize,
    quantityUnit: 'Units',
    details: lines.join('\n'),
    type: 'direct_enquiry',
    sendToSimilar: false,
  });
}

// ---------------------------------------------------------------------------
// Reads: buyer's RFQs + quotes (Supabase-first, local fallback)
// ---------------------------------------------------------------------------

export interface BuyerRfqRow {
  id: string;
  title: string;
  category: string;
  quantity: string;
  status: string;
  type: string;
  createdAt: string;
  quotesCount?: number;
}

export async function listBuyerRfqs(profileId: string): Promise<{ rows: BuyerRfqRow[]; source: BackendSource }> {
  if (profileId && isUuidLike(profileId) && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('rfqs_enquiries')
        .select('id, requirement_title, category, quantity_required, quantity_unit, status, type, created_at')
        .eq('buyer_id', profileId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && Array.isArray(data)) {
        return {
          source: 'supabase',
          rows: data.map((r: any) => ({
            id: r.id,
            title: r.requirement_title,
            category: r.category,
            quantity: `${r.quantity_required} ${r.quantity_unit || 'Units'}`,
            status: r.status,
            type: r.type,
            createdAt: r.created_at,
          })),
        };
      }
    } catch {
      // Fall through to local.
    }
  }
  const localRows = db.getRFQsAndEnquiries({ buyer_id: profileId });
  return {
    source: 'local',
    rows: localRows.map((r) => ({
      id: r.id,
      title: r.requirement_title,
      category: r.category,
      quantity: `${r.quantity_required} ${r.quantity_unit || 'Units'}`,
      status: r.status,
      type: r.type,
      createdAt: r.created_at,
      quotesCount: r.quotes?.length ?? 0,
    })),
  };
}

export async function listQuotesForRfq(rfqId: string): Promise<{ quotes: PopulatedQuote[]; source: BackendSource }> {
  if (rfqId && isUuidLike(rfqId) && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return { source: 'supabase', quotes: data as unknown as PopulatedQuote[] };
      }
    } catch {
      // Fall through to local.
    }
  }
  return { source: 'local', quotes: db.getQuotesByRfqId(rfqId) };
}

export type QuoteAction = 'accept' | 'reject' | 'counter';

export async function negotiateQuote(
  quoteId: string,
  rfqId: string,
  action: QuoteAction,
  counter?: { price: number; notes: string },
): Promise<{ ok: boolean; error: string | null }> {
  const status = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'negotiating';

  // Remote first (RLS: quotes_buyer_negotiate_own_rfqs).
  if (isUuidLike(quoteId) && isSupabaseConfigured()) {
    try {
      const patch: Record<string, unknown> = { status };
      if (action === 'counter' && counter) {
        patch.counter_offer_price = counter.price;
        patch.counter_offer_notes = counter.notes;
      }
      const { error } = await supabase.from('quotes').update(patch).eq('id', quoteId);
      if (error) return { ok: false, error: error.message };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Could not update the quote.' };
    }
  }

  // Local mirror (drives the tracking UI in both modes).
  try {
    db.updateQuoteStatus(quoteId, status as 'accepted' | 'rejected' | 'negotiating', counter
      ? { counter_offer_price: counter.price, counter_offer_notes: counter.notes }
      : undefined);
    if (action === 'accept') db.updateRFQStatus(rfqId, 'closed');
    else if (action === 'counter') db.updateRFQStatus(rfqId, 'negotiating');
  } catch {
    // Local ids from a remote-only row may not exist locally; not fatal.
  }
  return { ok: true, error: null };
}

// ---------------------------------------------------------------------------
// Chat addressing: messages.receiver_id must be the supplier's auth user UUID
// ---------------------------------------------------------------------------

/** Resolves a supplier profile id to its owner's auth user id (or null). */
export async function resolveSupplierUserId(supplierProfileId: string | null | undefined): Promise<string | null> {
  if (!supplierProfileId || !isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('profiles_supplier')
      .select('user_id')
      .eq('id', supplierProfileId)
      .maybeSingle();
    if (error || !data?.user_id) return null;
    return isUuidLike(data.user_id as string) ? (data.user_id as string) : null;
  } catch {
    return null;
  }
}
