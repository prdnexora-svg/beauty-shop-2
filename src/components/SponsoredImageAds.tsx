import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Plus, ShieldCheck } from 'lucide-react';
import { SponsoredAdItem } from '../types';
import { validateSponsoredAd, SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { getStoredCampaigns, recordAdClickInStore } from '../data/sponsoredCampaignsStore';
import { recordSponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';

interface SponsoredImageAdsProps {
  onProductClick?: (ad: SponsoredAdItem) => void;
  onSupplierClick?: (supplierId: string) => void;
  onOpenAdManager?: () => void;
  onOpenChat?: (
    supplier: { id: string; name: string; location: string; isVerified: boolean },
    product: { title: string; image: string; price?: string; moq?: string }
  ) => void;
}

export const SPONSORED_ADS: SponsoredAdItem[] = [
  {
    id: 'sp-ad-1',
    advertiser_id: 'adv_aura_001',
    seller_id: 'seller_aura_001',
    product_id: 'product_vitc_101',
    supplierName: 'Aura Beauty Labs',
    adTitle: 'Professional 20% Vitamin C Serum',
    subtitle: 'Bulk sourcing for salons & distributors',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-2',
    advertiser_id: 'adv_luxe_002',
    seller_id: 'seller_luxe_002',
    product_id: 'product_barrier_102',
    supplierName: 'LuxeForm Cosmetics',
    adTitle: 'Hydrating Hyaluronic Barrier Cream',
    subtitle: 'OEM formulation & custom private label',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-3',
    advertiser_id: 'adv_derma_003',
    seller_id: 'seller_derma_003',
    product_id: 'product_spa_103',
    supplierName: 'Dermaglow India',
    adTitle: 'Salon Hair Repair Spa Kits',
    subtitle: 'Wholesale pricing for chain salons & spas',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-4',
    advertiser_id: 'adv_pure_004',
    seller_id: 'seller_pure_004',
    product_id: 'product_matte_104',
    supplierName: 'PureFormulations Pvt',
    adTitle: 'Matte Liquid Lipstick Pigment Base',
    subtitle: 'Raw material supply for cosmetics manufacturers',
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-5',
    advertiser_id: 'adv_biotech_005',
    seller_id: 'seller_biotech_005',
    product_id: 'product_scalp_105',
    supplierName: 'BioTech Derma Labs',
    adTitle: 'Rosemary & Redensyl Scalp Tonic',
    subtitle: 'Trichologist-tested anti-hairfall formula',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-6',
    advertiser_id: 'adv_cosmo_006',
    seller_id: 'seller_cosmo_006',
    product_id: 'product_dropper_106',
    supplierName: 'CosmoTech Packaging',
    adTitle: 'Frosted Amber Glass Dropper Bottles',
    subtitle: 'MOQ 500 pcs with custom silk logo printing',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-7',
    advertiser_id: 'adv_radiant_007',
    seller_id: 'seller_radiant_007',
    product_id: 'product_niacinamide_107',
    supplierName: 'Radiant Cosmeceuticals',
    adTitle: 'Brightening Niacinamide Gel Cleanser',
    subtitle: 'Dermatologist approved bulk formulations',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-8',
    advertiser_id: 'adv_velvet_008',
    seller_id: 'seller_velvet_008',
    product_id: 'product_rosewater_108',
    supplierName: 'VelvetTouch Botanical',
    adTitle: 'Organic Rosewater Face Mist',
    subtitle: '100% steam-distilled wholesale batches',
    imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-9',
    advertiser_id: 'adv_apex_009',
    seller_id: 'seller_apex_009',
    product_id: 'product_microderm_109',
    supplierName: 'Apex Beauty Equipment',
    adTitle: 'Professional Micro-Dermabrasion Machine',
    subtitle: 'ISO certified clinical aesthetic devices',
    imageUrl: 'https://images.unsplash.com/photo-1512290900676-26c2a4d4b57b?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  },
  {
    id: 'sp-ad-10',
    advertiser_id: 'adv_silk_010',
    seller_id: 'seller_silk_010',
    product_id: 'product_keratin_110',
    supplierName: 'Silk&Shine Manufacturing',
    adTitle: 'Keratin Infused Hair Treatment Oil',
    subtitle: 'Export quality bulk supply for distributors',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80',
    status: 'active'
  }
];

export const SponsoredImageAds: React.FC<SponsoredImageAdsProps> = ({ 
  onProductClick, 
  onSupplierClick,
  onOpenAdManager,
  onOpenChat
}) => {
  const [customCampaigns, setCustomCampaigns] = useState(() => getStoredCampaigns());
  const recordedImpressionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleUpdate = () => {
      setCustomCampaigns(getStoredCampaigns());
    };
    window.addEventListener('nexora_sponsored_campaigns_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexora_sponsored_campaigns_updated', handleUpdate);
    };
  }, []);

  // Combine static SPONSORED_ADS with dynamic user created campaigns that are active, fully synced with SPONSORED_PRODUCTS_DB
  const activeValidAds = useMemo(() => {
    const defaultValid = SPONSORED_ADS.filter((ad) => validateSponsoredAd(ad));

    // Convert custom active campaigns to SponsoredAdItem format
    const customActive: SponsoredAdItem[] = customCampaigns
      .filter((c) => c.status === 'active')
      .map((c) => ({
        id: c.id,
        advertiser_id: c.advertiser_id,
        seller_id: c.seller_id,
        product_id: c.product_id,
        supplierName: c.supplierName,
        adTitle: c.adTitle,
        subtitle: c.subtitle,
        imageUrl: c.imageUrl,
        status: 'active'
      }))
      .filter((ad) => validateSponsoredAd(ad));

    // Deduplicate and sync with SPONSORED_PRODUCTS_DB
    const combinedMap = new Map<string, SponsoredAdItem>();
    [...customActive, ...defaultValid].forEach(ad => {
      if (!combinedMap.has(ad.id)) {
        const dbProduct = SPONSORED_PRODUCTS_DB[ad.product_id];
        if (dbProduct) {
          combinedMap.set(ad.id, {
            ...ad,
            supplierName: dbProduct.supplierName,
            adTitle: dbProduct.title,
            subtitle: dbProduct.description ? dbProduct.description.substring(0, 75) + '...' : ad.subtitle,
            imageUrl: dbProduct.images[0] || ad.imageUrl,
            seller_id: dbProduct.seller_id
          });
        } else {
          combinedMap.set(ad.id, ad);
        }
      }
    });

    return Array.from(combinedMap.values());
  }, [customCampaigns]);

  // Duplicate validated array once for seamless infinite continuous marquee
  const marqueeItems = useMemo(() => {
    if (activeValidAds.length === 0) return [];
    return [...activeValidAds, ...activeValidAds];
  }, [activeValidAds]);

  // Viewport impression observer for image ads
  useEffect(() => {
    if (activeValidAds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const adId = entry.target.getAttribute('data-ad-id');
            if (adId && !recordedImpressionsRef.current.has(adId)) {
              recordedImpressionsRef.current.add(adId);
              const matched = activeValidAds.find(a => a.id === adId);
              if (matched) {
                recordSponsoredAnalyticsEvent('ad_impression', {
                  ad_id: matched.id,
                  seller_id: matched.seller_id,
                  product_id: matched.product_id,
                  media_type: 'image_ad',
                  supplierName: matched.supplierName
                });
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = document.querySelectorAll('.sponsored-image-ad-card');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [activeValidAds]);

  if (activeValidAds.length === 0) {
    return null; // Do not render empty or invalid marquee
  }

  return (
    <section className="my-8 overflow-hidden py-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#fde7f3] border border-[#f7c5e0] flex items-center justify-center text-[#b90064]">
            <Sparkles className="w-4 h-4 text-[#b90064]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-extrabold text-[#1c1b1b] tracking-tight">
                Sponsored Beauty Showcase
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] text-[10px] font-bold uppercase tracking-wider">
                Featured Ads
              </span>
            </div>
            <p className="text-xs text-[#594047] font-medium hidden sm:block mt-0.5">
              Verified supplier promotions and direct product showcases
            </p>
          </div>
        </div>

        {onOpenAdManager && (
          <button
            onClick={onOpenAdManager}
            className="bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Manage / Create Ads</span>
          </button>
        )}
      </div>

      {/* Single Continuous Horizontal Marquee Container */}
      <div className="relative w-full overflow-x-auto hide-scrollbar group">
        {/* Soft edge gradients for smooth visual fade */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-[#fdf8f8] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-[#fdf8f8] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-4 py-3 px-2">
          {marqueeItems.map((ad, index) => (
            <div
              key={`${ad.id}-${index}`}
              data-ad-id={ad.id}
              onClick={() => {
                recordAdClickInStore(ad.id);
                recordSponsoredAnalyticsEvent('product_click', {
                  ad_id: ad.id,
                  seller_id: ad.seller_id,
                  product_id: ad.product_id,
                  media_type: 'image_ad',
                  supplierName: ad.supplierName
                });
                onProductClick?.(ad);
              }}
              className="sponsored-image-ad-card group/card shrink-0 cursor-pointer bg-white border border-[#e8e8e8] hover:border-[#b90064]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl relative flex flex-col justify-between
                w-[280px] md:w-[340px]"
            >
              {/* Top: HD Product Banner Image */}
              <div className="relative w-full h-[150px] md:h-[200px] overflow-hidden bg-stone-100">
                <img
                  src={ad.imageUrl}
                  alt={ad.adTitle}
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
              </div>

              {/* Bottom: Company Name, Title, Subtitle & Single Action Prompt */}
              <div className="p-3.5 md:p-4 flex flex-col justify-between space-y-2.5 bg-white flex-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mb-1">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSupplierClick?.(ad.seller_id);
                      }}
                      className="truncate flex items-center gap-1 text-[#b90064] hover:underline cursor-pointer"
                      title="View Supplier Profile"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                      <span className="truncate">{ad.supplierName}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                      GST Verified
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-zinc-950 leading-snug line-clamp-1 group-hover/card:text-[#b90064] transition-colors">
                    {ad.adTitle}
                  </h3>

                  <p className="text-xs text-[#594047] font-medium line-clamp-1 mt-0.5">
                    {ad.subtitle}
                  </p>
                </div>

                {/* Clean single-action footer link to product details */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#b90064]">
                  <span>View Product Details</span>
                  <span className="text-stone-400 group-hover/card:text-[#b90064] group-hover/card:translate-x-1 transition-all">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
