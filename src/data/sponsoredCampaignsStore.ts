import { SponsoredAdItem } from '../types';

export interface AdCampaignItem extends SponsoredAdItem {
  campaignName: string;
  objective: 'Boost Product Sales' | 'Brand Awareness' | 'Lead Generation' | 'OEM Sourcing Enquiries';
  targetType: 'product' | 'profile';
  targetCategories: string[];
  keywords: string[];
  ctaText: 'Get Quote' | 'View Product' | 'Explore Brand' | 'Request Sample' | 'Contact Supplier';
  dailyBudget: number;
  totalBudget: number;
  spentBudget: number;
  remainingBalance: number;
  impressions: number;
  clicks: number;
  ctr: number;
  startDate: string;
  endDate: string;
  isContinuous: boolean;
  createdAt: string;
  placements: ('homepage' | 'search_results' | 'category_page')[];
}

const STORAGE_KEY = 'nexora_sponsored_campaigns';
const BALANCE_KEY = 'nexora_supplier_ad_balance';

const INITIAL_CAMPAIGNS: AdCampaignItem[] = [
  {
    id: 'camp-aura-01',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Vitamin C Serum Bulk Promotion 2026',
    objective: 'Boost Product Sales',
    targetType: 'product',
    adTitle: 'Professional 20% Vitamin C Serum Base',
    subtitle: 'Bulk sourcing for salon chains & cosmetic brand distributors',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    targetCategories: ['Skincare', 'OEM / Private Label'],
    keywords: ['vitamin c', 'serum', 'bulk formulation', 'salon supply'],
    ctaText: 'Get Quote',
    dailyBudget: 500,
    totalBudget: 5000,
    spentBudget: 1450,
    remainingBalance: 3550,
    impressions: 18450,
    clicks: 642,
    ctr: 3.48,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    isContinuous: false,
    status: 'active',
    createdAt: '2026-08-01T10:00:00Z',
    placements: ['homepage', 'search_results', 'category_page']
  },
  {
    id: 'camp-aura-02',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_barrier_102',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Peptide Skin Barrier Cream Lead Gen',
    objective: 'Lead Generation',
    targetType: 'product',
    adTitle: 'Hydrating Hyaluronic Barrier Repair Cream',
    subtitle: 'OEM custom private label formulation with 5D Hyaluronic Acid',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80',
    targetCategories: ['Skincare', 'Dermatology'],
    keywords: ['barrier cream', 'peptides', 'ceramide', 'private label'],
    ctaText: 'Request Sample',
    dailyBudget: 750,
    totalBudget: 7500,
    spentBudget: 2800,
    remainingBalance: 4700,
    impressions: 24100,
    clicks: 890,
    ctr: 3.69,
    startDate: '2026-08-10',
    endDate: '2026-09-10',
    isContinuous: true,
    status: 'active',
    createdAt: '2026-08-10T14:30:00Z',
    placements: ['homepage', 'search_results']
  },
  {
    id: 'camp-aura-03',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    campaignName: 'Festive Season Brand Awareness Banner',
    objective: 'Brand Awareness',
    targetType: 'profile',
    adTitle: 'Aura Beauty Labs — GMP Certified Cleanrooms',
    subtitle: 'Over 32,000 sq.ft state-of-the-art facility for contract manufacturing',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    targetCategories: ['OEM / Private Label', 'Skincare', 'Haircare'],
    keywords: ['contract manufacturing', 'cleanroom', 'gmp', 'oem'],
    ctaText: 'Explore Brand',
    dailyBudget: 300,
    totalBudget: 3000,
    spentBudget: 0,
    remainingBalance: 3000,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    isContinuous: false,
    status: 'draft',
    createdAt: '2026-08-15T09:00:00Z',
    placements: ['homepage', 'category_page']
  }
];

export function getStoredCampaigns(): AdCampaignItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
      return INITIAL_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse campaigns from localStorage:', err);
    return INITIAL_CAMPAIGNS;
  }
}

export function saveCampaignsToStore(campaigns: AdCampaignItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    // Dispatch a custom event so components like SponsoredImageAds can update live!
    window.dispatchEvent(new Event('nexora_sponsored_campaigns_updated'));
  } catch (err) {
    console.error('Failed to save campaigns to localStorage:', err);
  }
}

export function saveSingleCampaign(campaign: AdCampaignItem): void {
  const current = getStoredCampaigns();
  const index = current.findIndex(c => c.id === campaign.id);
  let updated: AdCampaignItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = campaign;
  } else {
    updated = [campaign, ...current];
  }
  saveCampaignsToStore(updated);
}

export function toggleCampaignStatus(campaignId: string): AdCampaignItem[] {
  const current = getStoredCampaigns();
  const updated = current.map(c => {
    if (c.id === campaignId) {
      const nextStatus: 'active' | 'paused' | 'draft' = c.status === 'active' ? 'paused' : 'active';
      return { ...c, status: nextStatus };
    }
    return c;
  });
  saveCampaignsToStore(updated);
  return updated;
}

export function deleteCampaignFromStore(campaignId: string): AdCampaignItem[] {
  const current = getStoredCampaigns();
  const updated = current.filter(c => c.id !== campaignId);
  saveCampaignsToStore(updated);
  return updated;
}

export function getAdAccountBalance(): number {
  try {
    const val = localStorage.getItem(BALANCE_KEY);
    if (val === null) {
      localStorage.setItem(BALANCE_KEY, '12450');
      return 12450;
    }
    return parseFloat(val) || 0;
  } catch {
    return 12450;
  }
}

export function addAdAccountBalance(amount: number): number {
  const current = getAdAccountBalance();
  const newBal = current + amount;
  try {
    localStorage.setItem(BALANCE_KEY, newBal.toString());
  } catch {}
  return newBal;
}

export function recordAdClickInStore(adId: string): void {
  const current = getStoredCampaigns();
  const updated = current.map(c => {
    if (c.id === adId || c.product_id === adId) {
      const clicks = c.clicks + 1;
      const impressions = Math.max(c.impressions, clicks + 10);
      const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
      return { ...c, clicks, impressions, ctr };
    }
    return c;
  });
  saveCampaignsToStore(updated);
}
