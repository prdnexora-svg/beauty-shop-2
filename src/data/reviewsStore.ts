// ============================================================================
// NEXORA LUXE — SELLER REVIEWS & RATINGS STORE
// localStorage-backed review repository keyed by seller id. Seeded with
// representative B2B reviews so profiles are never empty; buyer-submitted
// reviews are prepended and persist across sessions.
// ============================================================================

export interface SellerReview {
  id: string;
  sellerId: string;
  rating: number; // 1..5
  title: string;
  text: string;
  reviewerName: string;
  reviewerCompany?: string;
  isVerifiedBuyer: boolean;
  createdAt: string; // ISO
}

const STORAGE_KEY = 'nexora_seller_reviews_v1';
export const REVIEWS_EVENT = 'nexora_seller_reviews_updated';

const SEED_REVIEWS: SellerReview[] = [
  {
    id: 'rev-seed-1',
    sellerId: 'seller_aura_001',
    rating: 5,
    title: 'Consistent COA quality across three bulk batches',
    text: 'We sourced 15,000 units of vitamin C serum across three production runs. Batch-to-batch consistency was excellent, COA documentation arrived before dispatch every time, and their sales desk responds within the hour.',
    reviewerName: 'Priya Sharma',
    reviewerCompany: 'Radiant Beauty Solutions, Mumbai',
    isVerifiedBuyer: true,
    createdAt: '2026-07-18T10:30:00.000Z'
  },
  {
    id: 'rev-seed-2',
    sellerId: 'seller_aura_001',
    rating: 4,
    title: 'Great private-label support, slightly long sample lead time',
    text: 'Private-label onboarding was smooth and artwork proofing was professional. Samples took 6 days instead of the quoted 3, but production delivery was on schedule. Would order again.',
    reviewerName: 'Arjun Mehta',
    reviewerCompany: 'GlowKart Retail, Delhi NCR',
    isVerifiedBuyer: true,
    createdAt: '2026-06-02T14:00:00.000Z'
  },
  {
    id: 'rev-seed-3',
    sellerId: 'seller_dermaglow_002',
    rating: 5,
    title: 'Reliable OEM partner for cosmeceutical actives',
    text: 'Dermaglow formulated a custom niacinamide + zinc serum for our salon chain. Stability data was shared proactively and MOQ flexibility helped us test the market before scaling.',
    reviewerName: 'Kavitha Rao',
    reviewerCompany: 'Lumière Salons, Bengaluru',
    isVerifiedBuyer: true,
    createdAt: '2026-07-29T09:15:00.000Z'
  }
];

function readAll(): SellerReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_REVIEWS;
  } catch {
    return SEED_REVIEWS;
  }
}

function writeAll(reviews: SellerReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Storage unavailable — reviews stay in-memory for the session.
  }
  window.dispatchEvent(new CustomEvent(REVIEWS_EVENT));
}

export function getReviewsForSeller(sellerId: string): SellerReview[] {
  return readAll()
    .filter((r) => r.sellerId === sellerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addSellerReview(
  review: Omit<SellerReview, 'id' | 'createdAt'>
): SellerReview {
  const created: SellerReview = {
    ...review,
    rating: Math.min(5, Math.max(1, Math.round(review.rating))),
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  writeAll([created, ...readAll()]);
  return created;
}

/**
 * Blends the profile's published base rating (representing historical
 * offline reviews) with locally submitted ones.
 */
export function getAggregateRating(
  sellerId: string,
  baseRating: number,
  baseCount: number
): { average: number; count: number } {
  const local = getReviewsForSeller(sellerId);
  const totalCount = baseCount + local.length;
  if (totalCount === 0) return { average: 0, count: 0 };
  const localSum = local.reduce((sum, r) => sum + r.rating, 0);
  const average = (baseRating * baseCount + localSum) / totalCount;
  return { average: Math.round(average * 10) / 10, count: totalCount };
}

export function subscribeSellerReviews(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(REVIEWS_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(REVIEWS_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
