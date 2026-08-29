// ============================================================================
// NEXORA LUXE — PUBLIC LANDING PAGE
//
// Extracted verbatim from the App.tsx monolith. This is the anonymous-facing
// marketing + discovery surface: it is eagerly loaded (it is the first thing a
// visitor sees) and is deliberately kept separate from the owner workspace.
// ============================================================================

import React from 'react';
import { LuxeHero } from '../luxe/LuxeHero';
import { BuySmartCard } from '../luxe/BuySmartCard';
import { CategoryStrip } from '../luxe/CategoryStrip';
import { VerifiedSuppliers } from '../luxe/VerifiedSuppliers';
import { TrendingProducts } from '../luxe/TrendingProducts';
import { OemBanner } from '../luxe/OemBanner';
import { SupplierCta } from '../luxe/SupplierCta';
import { SourcingCities } from '../luxe/SourcingCities';
import { HowItWorks } from '../luxe/HowItWorks';
import { LuxeFooter } from '../luxe/LuxeFooter';
import { Reveal } from '../luxe/Reveal';
import { GoldDivider } from '../luxe/GoldDivider';
import { SponsoredImageAds } from '../SponsoredImageAds';
import { SponsoredReelsSection } from '../SponsoredReelsSection';
import { SponsoredFullVideoSection } from '../SponsoredFullVideoSection';
import type { AppScreenContext } from './types';

export const PublicLanding: React.FC<AppScreenContext> = ({
  currentScreen,
  handleNavigate,
  handleOpenAdManager,
  handleOpenAuthModal,
  handleOpenChat,
  handleOpenEnquiry,
  handleSearchSubmit,
  handleSponsoredEnquire,
  handleViewProduct,
  handleViewSupplier,
  triggerToast,
}) => (
  <>
        {/* Screen 01: Homepage / Explore Hub — NEXORA LUXE purple-gold edition */}
        {currentScreen === 'explore' && (
          <main className="flex-1 -mt-20 bg-[linear-gradient(180deg,#FDFBF7_0%,#FAF6EF_45%,#F5EEF8_100%)]">
            <LuxeHero
              onSearch={(q, loc) => handleSearchSubmit({ query: q, location: loc })}
              onTabChange={(scope) => {
                if (scope === 'suppliers') {
                  handleNavigate('supplier-directory');
                } else if (scope === 'brands') {
                  handleNavigate('brands');
                } else if (scope === 'oem') {
                  handleSearchSubmit({ query: 'OEM', location: 'All India' });
                } else {
                  handleNavigate('plp');
                }
              }}
            />

            <Reveal>
            <BuySmartCard
              onGetQuotes={() => {
                handleNavigate('post-rfq');
                triggerToast('Requirement captured — complete the form to receive supplier quotes.');
              }}
              onPostDetailed={() => handleNavigate('post-rfq')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <CategoryStrip
              onCategoryClick={(label) => {
                if (label === 'OEM/Private Label') {
                  handleSearchSubmit({ query: 'OEM', location: 'All India' });
                } else {
                  handleSearchSubmit({ query: label, location: 'All India' });
                }
              }}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <VerifiedSuppliers
              onViewProfile={(id) => handleNavigate('supplier-profile', { supplierId: id })}
              onSendEnquiry={(name) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title: 'Enquiry for ' + name,
                  supplierName: name,
                  type: 'supplier',
                });
              }}
              onViewAll={() => handleNavigate('supplier-directory')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <SponsoredImageAds
              onProductClick={(ad) => handleViewProduct(ad.product_id, ad.seller_id)}
              onSupplierClick={(supplierId) => handleViewSupplier(supplierId)}
              onOpenAdManager={handleOpenAdManager}
              onOpenChat={(supplier, product) => handleOpenChat(supplier, product)}
            />
            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <SponsoredReelsSection
              onOpenAdManager={handleOpenAdManager}
              onViewProduct={handleViewProduct}
              onViewSupplier={handleViewSupplier}
              onEnquire={handleSponsoredEnquire}
            />
            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <SponsoredFullVideoSection
              onOpenAdManager={handleOpenAdManager}
              onViewProduct={handleViewProduct}
              onViewSupplier={handleViewSupplier}
              onEnquire={handleSponsoredEnquire}
            />
            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <TrendingProducts
              onViewDetails={(id) => handleNavigate('product-detail', { productId: id })}
              onSendEnquiry={(title, supplier) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title,
                  supplierName: supplier,
                  type: 'product',
                });
              }}
              onViewAll={() => handleNavigate('plp')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal direction="none">
            <OemBanner
              onExplore={() => handleNavigate('oem-hub')}
              onPostRequirement={() => handleNavigate('post-rfq')}
            />

            </Reveal>

            <Reveal>
            <SupplierCta
              onJoin={() => handleNavigate('onboarding')}
              onLogin={() => handleOpenAuthModal('login')}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <SourcingCities
              onCityClick={(city) => handleSearchSubmit({ query: '', location: city })}
            />

            </Reveal>

            <GoldDivider className="pt-14 md:pt-16" />

            <Reveal>
            <HowItWorks onPost={() => handleNavigate('post-rfq')} />
            </Reveal>
          </main>
        )}
  </>
);

export default PublicLanding;
