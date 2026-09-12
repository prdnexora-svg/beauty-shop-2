import type { SearchProduct } from '../types';
import { SPONSORED_PRODUCTS_DB } from './sponsoredProductsData';
import { SELLER_PROFILES_DB } from './sellerProfilesData';

// Listing and search cards must use the same identities and facts as detail pages.
// This remains the bundled catalogue; live supplier publication is a separate gap.
export const CATALOG_PRODUCTS: SearchProduct[] = Object.values(SPONSORED_PRODUCTS_DB)
  .filter(product => product.isPublished && !product.isSuspended)
  .map(product => {
    const seller = SELLER_PROFILES_DB[product.seller_id];
    return {
      ...product,
      image: product.images[0],
      images: product.images,
      stockAvailability: product.stockAvailability || 'In-Stock',
      leadTimeText: product.leadTimeText || 'Ready Batch (Dispatches in 24–48 Hours)',
      description: product.description,
      bulkTiers: product.bulkTiers,
      specs: product.specs,
      moqNumber: Number(product.moq.match(/[\d,]+/)?.[0].replace(/,/g, '')) || 0,
      rating: seller?.overallRating,
      establishedYear: seller?.establishedYear,
      establishedYearNumber: seller ? parseInt(seller.establishedYear, 10) : undefined,
      responseTime: seller?.responseSla || 'Not provided',
      certifications: product.specs.certifications || [],
      bulkTierText: product.bulkTiers.map(tier => `${tier.quantityRange}: ${tier.unitPrice}`).join(' | '),
    };
  });
