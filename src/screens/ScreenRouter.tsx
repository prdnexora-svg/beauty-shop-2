import React, { Suspense } from 'react';

import { ScreenFallback } from '../components/shell/LoadingStates';
import { OWNER_SCREENS, PUBLIC_SCREENS, SCREEN_METADATA } from './registry';
import { PublicExploreScreen } from './public/PublicExploreScreen';
import type { ScreenContextValue, ScreenId } from './types';
import { VERIFIED_SUPPLIERS } from '../data/mockData';

/**
 * SCREEN ROUTER
 *
 * Single source of truth for "which component renders for a screen id". The
 * shell (`App.tsx`) owns state and guards; this module owns the presentation
 * plumbing for every route.
 *
 * - Public discovery routes come from `PUBLIC_SCREENS` (lazy).
 * - Owner workspace routes (spec screens 18-25) come from `OWNER_SCREENS`
 *   (lazy) and are the biggest chunk-savings in the app.
 * - The landing page is eager, so it is rendered directly.
 *
 * The whole switch sits behind one keyed `Suspense` boundary: switching screens
 * remounts the boundary and shows `ScreenFallback` while the chunk downloads.
 */
export const ScreenRouter: React.FC<{ ctx: ScreenContextValue }> = ({ ctx }) => (
  <Suspense
    key={ctx.screen}
    fallback={
      <ScreenFallback
        screen={ctx.screen}
        label={SCREEN_METADATA[ctx.screen]?.label}
      />
    }
  >
    {renderScreen(ctx)}
  </Suspense>
);

function renderScreen(ctx: ScreenContextValue): React.ReactNode {
  const {
    screen,
    isLoggedIn,
    buyerProfile,
    searchParams,
    selectedProductId,
    selectedSupplierId,
    buyerDashboardTab,
    navigate,
    openEnquiry,
    openChat,
    openAuth,
    callSupplier,
    whatsappSupplier,
    saveProfile,
    completeBuyerOnboarding,
    completeSupplierOnboarding,
    submitSampleRequest,
  } = ctx;

  const noop = () => {};

  // Local aliases: JSX member expressions cannot use bracket/kebab keys.
  const SearchResultsScreen = PUBLIC_SCREENS['search-results'];
  const ProductDetailRoute = PUBLIC_SCREENS['product-detail'];
  const SupplierDirectoryRoute = PUBLIC_SCREENS['supplier-directory'];
  const SupplierProfileRoute = PUBLIC_SCREENS['supplier-profile'];
  const OemHubRoute = PUBLIC_SCREENS['oem-hub'];
  const SupplierPortalScreen = OWNER_SCREENS['supplier-portal'];
  const SupplierVerificationScreen = OWNER_SCREENS['supplier-verification'];
  const BuyerOnboardingScreen = OWNER_SCREENS['buyer-onboarding'];
  const RfqTrackingScreen = OWNER_SCREENS['rfq-tracking'];
  const BuyerEnquiryLogScreen = OWNER_SCREENS['buyer-enquiry-log'];
  const PostRequirementRoute = OWNER_SCREENS['post-rfq'];
  const SampleRequestRoute = OWNER_SCREENS['sample-request'];

  switch (screen) {
    // ---------------------------------------------------------------- public
    case 'explore':
      // Landing route is eager — no chunk round-trip on first paint.
      return (
        <PublicExploreScreen
          onNavigate={navigate}
          onSearch={ctx.onSearch}
          onOpenEnquiry={openEnquiry}
          onQuickQuote={ctx.openQuickQuote}
          onPostRequirement={() => navigate('post-rfq')}
          onOpenAuth={openAuth}
        />
      );

    case 'plp':
      return (
        <main className="flex-1">
          <PUBLIC_SCREENS.plp
            isLoggedIn={isLoggedIn}
            onOpenEnquiryModal={openEnquiry}
            onOpenQuoteModal={noop}
            onOpenRFQModal={() => navigate('post-rfq')}
            onNavigateToExplore={() => navigate('explore')}
            onNavigateToSearch={navigate}
            onNavigateToProductDetail={(productId: string) =>
              navigate('product-detail', { productId })
            }
            onOpenProductComparison={noop}
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
            onOpenAuth={() => openAuth('login')}
          />
        </main>
      );

    case 'search-results':
      return (
        <main className="flex-1">
          <SearchResultsScreen
            initialQuery={searchParams.query}
            initialCategory={searchParams.category}
            initialLocation={searchParams.location}
            onOpenEnquiryModal={openEnquiry}
            onOpenQuoteModal={noop}
            onOpenRFQModal={() => navigate('post-rfq')}
            onNavigateToExplore={() => navigate('explore')}
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
            onNavigate={navigate}
          />
        </main>
      );

    case 'product-detail':
      return (
        <main className="flex-1">
          <ProductDetailRoute
            productId={selectedProductId}
            onBack={() => navigate('explore')}
            onOpenEnquiryModal={(item: { name: string; supplierName: string }) =>
              openEnquiry({
                id: 'enq-' + Date.now(),
                title: item.name,
                supplierName: item.supplierName,
                type: 'product',
              })
            }
            onOpenRFQModal={() => navigate('post-rfq')}
            onNavigateToSampleRequest={() => navigate('sample-request')}
            onNavigateToSupplierProfile={(supplierId: string) =>
              navigate('supplier-profile', { supplierId })
            }
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
            onOpenChat={openChat}
          />
        </main>
      );

    case 'directory':
      return (
        <main className="flex-1">
          <PUBLIC_SCREENS.directory
            onNavigate={navigate}
            onOpenRFQModal={() => navigate('post-rfq')}
          />
        </main>
      );

    case 'supplier-directory':
      return (
        <main className="flex-1">
          <SupplierDirectoryRoute
            onOpenEnquiryModal={openEnquiry}
            onOpenQuoteModal={noop}
            onOpenRFQModal={() => navigate('post-rfq')}
            onNavigateToExplore={() => navigate('explore')}
            onNavigateToSupplierProfile={(supplierId: string) =>
              navigate('supplier-profile', { supplierId })
            }
            onNavigateToProductDetail={(productId: string) =>
              navigate('product-detail', { productId })
            }
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
          />
        </main>
      );

    case 'supplier-profile':
      return (
        <main className="flex-1">
          <SupplierProfileRoute
            sellerId={selectedSupplierId || searchParams.supplierId}
            isLoggedIn={isLoggedIn}
            onBack={() => navigate('explore')}
            onNavigateToProductDetail={(productId: string) =>
              navigate('product-detail', { productId })
            }
            onOpenAuth={() => openAuth('login')}
            onOpenEnquiryModal={openEnquiry}
            onOpenQuoteModal={(suppName: string) =>
              navigate('post-rfq', { supplierName: suppName })
            }
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
          />
        </main>
      );

    case 'brands':
      return (
        <main className="flex-1">
          <PUBLIC_SCREENS.brands
            onOpenEnquiryModal={(prodName: string, suppName: string) =>
              openEnquiry({ name: prodName, supplierName: suppName })
            }
            onOpenRFQModal={() => navigate('post-rfq')}
            onOpenFacilityTour={noop}
            onNavigateToSuppliers={() => navigate('supplier-directory')}
            onNavigateToSupplierProfile={(supplierId: string) =>
              navigate('supplier-profile', { supplierId })
            }
          />
        </main>
      );

    case 'oem-hub':
      return (
        <main className="flex-1">
          <OemHubRoute
            onOpenRFQModal={() => navigate('post-rfq')}
            onOpenEnquiryModal={(prodName: string, suppName: string) =>
              openEnquiry({ name: prodName, supplierName: suppName })
            }
            onOpenFacilityTour={noop}
            onNavigateToSuppliers={() => navigate('supplier-directory')}
            onNavigateToSupplierProfile={(supplierId: string) =>
              navigate('supplier-profile', { supplierId })
            }
          />
        </main>
      );

    // ----------------------------------------------------------------- owner
    // 18 — Supplier onboarding
    case 'onboarding':
      return (
        <main className="flex-1">
          <OWNER_SCREENS.onboarding
            authenticated={isLoggedIn && ctx.userRole === 'supplier'}
            onComplete={completeSupplierOnboarding}
            onNavigateToExplore={() => navigate('explore')}
          />
        </main>
      );

    // 19 — Supplier admin portal
    case 'supplier-portal':
      return (
        <main className="flex-1">
          <SupplierPortalScreen
            onNavigateToProduct={(productId: string) =>
              navigate('product-detail', { productId })
            }
          />
        </main>
      );

    // 20 — Supplier verification centre
    case 'supplier-verification':
      return (
        <main className="flex-1">
          <SupplierVerificationScreen
            onBack={() => navigate('supplier-portal')}
          />
        </main>
      );

    // 21 — Buyer onboarding
    case 'buyer-onboarding':
      return (
        <main className="flex-1">
          <BuyerOnboardingScreen
            onComplete={(data: Record<string, unknown>) => completeBuyerOnboarding(data)}
            onNavigateToExplore={() => navigate('explore')}
          />
        </main>
      );

    // 22 — Buyer dashboard / public buyer profile
    case 'buyer-dashboard':
    case 'buyer-profile': {
      const BuyerWorkspace = OWNER_SCREENS[screen];
      return (
        <main className="flex-1">
          <BuyerWorkspace
            isLoggedIn={isLoggedIn}
            onNavigate={navigate}
            onPostRFQ={() => navigate('post-rfq')}
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
            onOpenAuth={() => openAuth('login')}
            buyerProfile={buyerProfile}
            onSaveProfile={saveProfile}
            onOpenEditProfile={ctx.openEditProfile}
            initialTab={screen === 'buyer-profile' ? 'activity' : buyerDashboardTab}
            isProfileRoute={screen === 'buyer-profile'}
            currentScreen={screen}
          />
        </main>
      );
    }

    // 23 — RFQ tracking
    case 'rfq-tracking':
      return (
        <main className="flex-1">
          <RfqTrackingScreen
            onBack={() => navigate('buyer-dashboard')}
            onNavigateToChat={(supplierIdOrName: string) => {
              const supp = VERIFIED_SUPPLIERS.find(
                (s) =>
                  s.name.toLowerCase().includes(supplierIdOrName.toLowerCase()) ||
                  s.id === supplierIdOrName,
              );
              openChat(
                {
                  id: supp?.id || 'supp-rfq',
                  name: supp?.name || supplierIdOrName,
                  location: supp
                    ? `${supp.city}${supp.state ? `, ${supp.state}` : ''}`
                    : 'India',
                  isVerified: supp ? supp.isVerified : true,
                },
                {
                  title: 'Vitamin C Brightening Serum (Bulk)',
                  image:
                    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
                  price: '₹195 / unit',
                  moq: '2,000 Units',
                },
              );
            }}
          />
        </main>
      );

    // 24 — Buyer enquiry log
    case 'buyer-enquiry-log':
      return (
        <main className="flex-1">
          <BuyerEnquiryLogScreen
            onBack={() => navigate('buyer-dashboard')}
            onNavigateToChat={(supplierName: string) =>
              openChat({
                id: 'supp_custom',
                name: supplierName,
                location: 'All India',
                isVerified: true,
              })
            }
            onCallSupplier={callSupplier}
            onWhatsAppSupplier={whatsappSupplier}
            onNavigateToExplore={() => navigate('explore')}
          />
        </main>
      );

    // 25 — Requirement capture
    case 'post-rfq':
      return (
        <main className="flex-1">
          <PostRequirementRoute
            onNavigateToExplore={() => navigate('explore')}
            onNavigateToRFQs={() => navigate('rfq-tracking')}
          />
        </main>
      );

    case 'sample-request':
      return (
        <main className="flex-1">
          <SampleRequestRoute
            onBack={() => navigate('search-results')}
            onSubmit={submitSampleRequest}
          />
        </main>
      );

    default:
      return null;
  }
}

export default ScreenRouter;

export type { ScreenId };
