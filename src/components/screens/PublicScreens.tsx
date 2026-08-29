// ============================================================================
// NEXORA LUXE — PUBLIC SCREENS
//
// Routes any anonymous visitor can reach: listings, search, product detail,
// directories and the OEM hub. Every component here is lazy-loaded, so none of
// it is downloaded until the visitor actually navigates to it.
//
// Kept separate from OwnerScreens so the public/owner boundary is explicit
// rather than implied by which branch of a switch it happens to sit in.
// ============================================================================

import React from 'react';
import { lazyNamed } from './lazyNamed';
const ProductListingScreen = lazyNamed(() => import('../ProductListingScreen'), 'ProductListingScreen');
const SearchFilterScreen = lazyNamed(() => import('../SearchFilterScreen'), 'SearchFilterScreen');
const ProductDetailPage = lazyNamed(() => import('../ProductDetailPage'), 'ProductDetailPage');
const DirectoryHubScreen = lazyNamed(() => import('../DirectoryHubScreen'), 'DirectoryHubScreen');
const SupplierDirectoryScreen = lazyNamed(() => import('../SupplierDirectoryScreen'), 'SupplierDirectoryScreen');
const SellerProfileScreen = lazyNamed(() => import('../SellerProfileScreen'), 'SellerProfileScreen');
const BrandDirectoryDetailScreen = lazyNamed(() => import('../BrandDirectoryDetailScreen'), 'BrandDirectoryDetailScreen');
const OemPrivateLabelHubScreen = lazyNamed(() => import('../OemPrivateLabelHubScreen'), 'OemPrivateLabelHubScreen');
import type { AppScreenContext } from './types';

export const PublicScreens: React.FC<AppScreenContext> = ({
  currentScreen,
  isLoggedIn,
  searchParams,
  selectedProductId,
  selectedSupplierId,
  handleCallSupplier,
  handleFacilityTour,
  handleNavigate,
  handleOpenAuthModal,
  handleOpenChat,
  handleOpenEnquiry,
  handleOpenProductComparison,
  handleOpenQuoteModal,
  handleWhatsAppSupplier,
}) => (
  <>
        {currentScreen === 'plp' && (
          <main className="flex-1">
            <ProductListingScreen
              isLoggedIn={isLoggedIn}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={handleOpenQuoteModal}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSearch={handleNavigate}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenProductComparison={handleOpenProductComparison}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
            />
          </main>
        )}

        {/* Screen 02: Global Search & Filter Results (Unified) */}
        {currentScreen === 'search-results' && (
          <main className="flex-1">
            <SearchFilterScreen
              initialQuery={searchParams.query}
              initialCategory={searchParams.category}
              initialLocation={searchParams.location}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={handleOpenQuoteModal}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onNavigate={handleNavigate}
            />
          </main>
        )}

        {/* Screen 04: Product Detail Page */}
        {currentScreen === 'product-detail' && (
          <main className="flex-1">
            <ProductDetailPage
              productId={selectedProductId}
              onBack={() => handleNavigate('explore')}
              onOpenEnquiryModal={(item) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title: item.name,
                  supplierName: item.supplierName,
                  type: 'product'
                });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToSampleRequest={() => handleNavigate('sample-request')}
              onNavigateToSupplierProfile={(supplierId) => {
                handleNavigate('supplier-profile', { supplierId });
              }}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
              onOpenChat={handleOpenChat}
            />
          </main>
        )}

        {/* Screen 06: Directory Hub */}
        {currentScreen === 'directory' && (
          <main className="flex-1">
            <DirectoryHubScreen
              onNavigate={handleNavigate}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
            />
          </main>
        )}

        {/* Screen 06 List: Supplier Directory */}
        {currentScreen === 'supplier-directory' && (
          <main className="flex-1">
            <SupplierDirectoryScreen
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={handleOpenQuoteModal}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
            />
          </main>
        )}

        {/* Screen 07: Dedicated Seller Profile / Mini-Website Page */}
        {currentScreen === 'supplier-profile' && (
          <main className="flex-1">
            <SellerProfileScreen
              sellerId={selectedSupplierId || searchParams.supplierId}
              isLoggedIn={isLoggedIn}
              onBack={() => handleNavigate('explore')}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenAuth={() => handleOpenAuthModal('login')}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={(suppName) => handleNavigate('post-rfq', { supplierName: suppName })}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
            />
          </main>
        )}

        {/* Screen 08: Brand Directory */}
        {currentScreen === 'brands' && (
          <main className="flex-1">
            <BrandDirectoryDetailScreen
              onOpenEnquiryModal={(prodName, suppName) => {
                handleOpenEnquiry({ name: prodName, supplierName: suppName });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onOpenFacilityTour={(suppName) => handleFacilityTour(suppName)}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}

        {/* Screen 09: OEM / Private Label Hub */}
        {currentScreen === 'oem-hub' && (
          <main className="flex-1">
            <OemPrivateLabelHubScreen
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onOpenEnquiryModal={(prodName, suppName) => {
                handleOpenEnquiry({ name: prodName, supplierName: suppName });
              }}
              onOpenFacilityTour={(suppName) => handleFacilityTour(suppName)}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}
  </>
);

export default PublicScreens;
