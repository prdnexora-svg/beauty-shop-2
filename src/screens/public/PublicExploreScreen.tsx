import React from 'react';

import { LuxeHero } from '../../components/luxe/LuxeHero';
import { BuySmartCard } from '../../components/luxe/BuySmartCard';
import { CategoryStrip } from '../../components/luxe/CategoryStrip';
import { VerifiedSuppliers } from '../../components/luxe/VerifiedSuppliers';
import { TrendingProducts } from '../../components/luxe/TrendingProducts';
import { OemBanner } from '../../components/luxe/OemBanner';
import { SupplierCta } from '../../components/luxe/SupplierCta';
import { SourcingCities } from '../../components/luxe/SourcingCities';
import { HowItWorks } from '../../components/luxe/HowItWorks';
import { Reveal } from '../../components/luxe/Reveal';
import { GoldDivider } from '../../components/luxe/GoldDivider';
import type { ScreenId } from '../types';

/**
 * PUBLIC LANDING / EXPLORE HUB (spec screen 01)
 *
 * Extracted from the `App.tsx` monolith. It owns only the marketing surface —
 * no auth state, no owner data, no database access — and stays eagerly bundled
 * so the first paint of the site is never blocked by a chunk request.
 */
export interface PublicExploreScreenProps {
  onNavigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
  onSearch: (params: { query: string; location: string }) => void;
  onOpenEnquiry: (item: {
    id: string;
    title: string;
    supplierName: string;
    type: 'supplier' | 'product';
  }) => void;
  /** Navigate to the RFQ form and confirm the captured requirement. */
  onQuickQuote: () => void;
  /** Navigate to the RFQ form without a toast. */
  onPostRequirement: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const PublicExploreScreen: React.FC<PublicExploreScreenProps> = ({
  onNavigate,
  onSearch,
  onOpenEnquiry,
  onQuickQuote,
  onPostRequirement,
  onOpenAuth,
}) => {
  const handleTabChange = (scope: string) => {
    if (scope === 'suppliers') {
      onNavigate('supplier-directory');
    } else if (scope === 'brands') {
      onNavigate('brands');
    } else if (scope === 'oem') {
      onSearch({ query: 'OEM', location: 'All India' });
    } else {
      onNavigate('plp');
    }
  };

  return (
    <main className="flex-1 -mt-20 bg-[linear-gradient(180deg,#FDFBF7_0%,#FAF6EF_45%,#F5EEF8_100%)]">
      <LuxeHero
        onSearch={(q, loc) => onSearch({ query: q, location: loc })}
        onTabChange={handleTabChange}
      />

      <Reveal>
        <BuySmartCard onGetQuotes={onQuickQuote} onPostDetailed={onPostRequirement} />
      </Reveal>

      <GoldDivider className="pt-14 md:pt-16" />

      <Reveal>
        <CategoryStrip
          onCategoryClick={(label) =>
            // The OEM tile is labelled "OEM/Private Label" but searches the
            // "OEM" scope, exactly as the marketplace taxonomy expects.
            onSearch({
              query: label === 'OEM/Private Label' ? 'OEM' : label,
              location: 'All India',
            })
          }
        />
      </Reveal>

      <GoldDivider className="pt-14 md:pt-16" />

      <Reveal>
        <VerifiedSuppliers
          onViewProfile={(id) => onNavigate('supplier-profile', { supplierId: id })}
          onSendEnquiry={(name) =>
            onOpenEnquiry({
              id: 'enq-' + Date.now(),
              title: 'Enquiry for ' + name,
              supplierName: name,
              type: 'supplier',
            })
          }
          onViewAll={() => onNavigate('supplier-directory')}
        />
      </Reveal>

      <GoldDivider className="pt-14 md:pt-16" />

      <Reveal>
        <TrendingProducts
          onViewDetails={(id) => onNavigate('product-detail', { productId: id })}
          onSendEnquiry={(title, supplier) =>
            onOpenEnquiry({
              id: 'enq-' + Date.now(),
              title,
              supplierName: supplier,
              type: 'product',
            })
          }
          onViewAll={() => onNavigate('plp')}
        />
      </Reveal>

      <GoldDivider className="pt-14 md:pt-16" />

      <Reveal direction="none">
        <OemBanner
          onExplore={() => onNavigate('oem-hub')}
          onPostRequirement={onPostRequirement}
        />
      </Reveal>

      <Reveal>
        <SupplierCta
          onJoin={() => onNavigate('onboarding')}
          onLogin={() => onOpenAuth('login')}
        />
      </Reveal>

      <GoldDivider className="pt-14 md:pt-16" />

      <Reveal>
        <SourcingCities onCityClick={(city) => onSearch({ query: '', location: city })} />
      </Reveal>

      <GoldDivider className="pt-14 md:pt-16" />

      <Reveal>
        <HowItWorks onPost={onPostRequirement} />
      </Reveal>
    </main>
  );
};

export default PublicExploreScreen;
