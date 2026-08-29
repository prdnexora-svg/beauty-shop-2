// ============================================================================
// NEXORA LUXE — OWNER SCREENS
//
// Authenticated workspace routes: buyer dashboard, RFQ tracking, onboarding,
// supplier portal and verification. All lazy-loaded — a visitor who never signs
// in never downloads a byte of this.
//
// These are the flows the role guard in `handleNavigate` protects; keeping them
// in one module makes that trust boundary easy to review.
// ============================================================================

import React from 'react';
import { lazyNamed } from './lazyNamed';
const BuyerDashboard = lazyNamed(() => import('../BuyerDashboard'), 'BuyerDashboard');
const BuyerRFQTrackingScreen = lazyNamed(() => import('../BuyerRFQTrackingScreen'), 'BuyerRFQTrackingScreen');
const SampleRequestScreen = lazyNamed(() => import('../SampleRequestScreen'), 'SampleRequestScreen');
const PostRequirementScreen = lazyNamed(() => import('../PostRequirementScreen'), 'PostRequirementScreen');
const BuyerEnquiryLogScreen = lazyNamed(() => import('../BuyerEnquiryLogScreen'), 'BuyerEnquiryLogScreen');
const BuyerOnboardingScreen = lazyNamed(() => import('../BuyerOnboardingScreen'), 'BuyerOnboardingScreen');
const SupplierOnboardingScreen = lazyNamed(() => import('../SupplierOnboardingScreen'), 'SupplierOnboardingScreen');
const SupplierAdminPortal = lazyNamed(() => import('../SupplierAdminPortal'), 'SupplierAdminPortal');
const SupplierVerificationScreen = lazyNamed(() => import('../SupplierVerificationScreen'), 'SupplierVerificationScreen');
import { VERIFIED_SUPPLIERS } from '../../data/mockData';
import type { AppScreenContext } from './types';

export const OwnerScreens: React.FC<AppScreenContext> = ({
  buyerDashboardTab,
  buyerProfile,
  currentScreen,
  isLoggedIn,
  userRole,
  handleCallSupplier,
  handleNavigate,
  handleOpenAuthModal,
  handleOpenChat,
  handleSaveProfile,
  handleWhatsAppSupplier,
  setIsEditProfileOpen,
  setSelectedProductId,
  triggerToast,
}) => (
  <>
        {currentScreen === 'buyer-onboarding' && (
          <main className="flex-1">
            <BuyerOnboardingScreen
              onComplete={(data) => {
                handleSaveProfile({
                  ...buyerProfile,
                  businessName: data.businessName,
                  businessType: data.buyerCategory,
                  designation: data.designation,
                  gstin: data.gstNumber,
                  annualProcurementBudget: data.annualBudget,
                  primaryCategories: data.primaryCategories,
                  city: data.location.split(',')[0] || '',
                  state: data.location.split(',')[1]?.trim() || '',
                });
                handleNavigate('buyer-dashboard');
              }}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}

        {/* Phase B: Supplier Onboarding Flow */}
        {currentScreen === 'onboarding' && (
          <main className="flex-1">
            <SupplierOnboardingScreen
              authenticated={isLoggedIn && userRole === 'supplier'}
              onComplete={() => {
                triggerToast('Business listing created! Redirecting to Portal...');
                handleNavigate('supplier-portal');
              }}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}

        {/* Phase B: Supplier Admin Portal */}
        {currentScreen === 'supplier-portal' && (
          <main className="flex-1">
            <SupplierAdminPortal 
              onNavigateToProduct={(productId) => {
                setSelectedProductId(productId);
                handleNavigate('product-detail', { productId });
              }}
            />
          </main>
        )}

        {/* Screen 24: Supplier Verification Center */}
        {currentScreen === 'supplier-verification' && (
          <main className="flex-1">
            <SupplierVerificationScreen 
              onBack={() => handleNavigate('supplier-portal')}
            />
          </main>
        )}

        {/* Screen 12: Buyer Dashboard */}
        {currentScreen === 'buyer-dashboard' && (
          <main className="flex-1">
            <BuyerDashboard 
              isLoggedIn={isLoggedIn}
              onNavigate={handleNavigate}
              onPostRFQ={() => handleNavigate('post-rfq')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
              buyerProfile={buyerProfile}
              onSaveProfile={handleSaveProfile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              initialTab={buyerDashboardTab}
              isProfileRoute={false}
              currentScreen={currentScreen}
            />
          </main>
        )}

        {/* Specific /buyer/profile Route View */}
        {currentScreen === 'buyer-profile' && (
          <main className="flex-1">
            <BuyerDashboard 
              isLoggedIn={isLoggedIn}
              onNavigate={handleNavigate}
              onPostRFQ={() => handleNavigate('post-rfq')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
              buyerProfile={buyerProfile}
              onSaveProfile={handleSaveProfile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              initialTab="activity"
              isProfileRoute={true}
              currentScreen={currentScreen}
            />
          </main>
        )}

        {/* Screen 13: Buyer RFQ Tracking & Quote Comparison */}
        {currentScreen === 'rfq-tracking' && (
          <main className="flex-1">
            <BuyerRFQTrackingScreen
              onBack={() => handleNavigate('buyer-dashboard')}
              onNavigateToChat={(supplierIdOrName) => {
                const supp = VERIFIED_SUPPLIERS.find(s => 
                  s.name.toLowerCase().includes(supplierIdOrName.toLowerCase()) || 
                  s.id === supplierIdOrName
                );
                handleOpenChat(
                  {
                    id: supp?.id || 'supp-rfq',
                    name: supp?.name || supplierIdOrName,
                    location: supp ? `${supp.city}${supp.state ? `, ${supp.state}` : ''}` : 'India',
                    isVerified: supp ? supp.isVerified : true
                  },
                  { title: 'Vitamin C Brightening Serum (Bulk)', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', price: '₹195 / unit', moq: '2,000 Units' }
                );
              }}
            />
          </main>
        )}

        {/* Sample Request Screen */}
        {currentScreen === 'sample-request' && (
          <main className="flex-1">
            <SampleRequestScreen 
              onBack={() => handleNavigate('search-results')}
              onSubmit={(data) => {
                console.log('Sample Request Submitted:', data);
                handleNavigate('buyer-dashboard');
              }}
            />
          </main>
        )}

        {/* Screen 10: Post Requirement / Public RFQ Form */}
        {currentScreen === 'post-rfq' && (
          <main className="flex-1">
            <PostRequirementScreen
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToRFQs={() => handleNavigate('rfq-tracking')}
            />
          </main>
        )}

        {/* Screen 14: Buyer Enquiry Log */}
        {currentScreen === 'buyer-enquiry-log' && (
          <main className="flex-1">
            <BuyerEnquiryLogScreen
              onBack={() => handleNavigate('buyer-dashboard')}
              onNavigateToChat={(supplierName) => handleOpenChat({ id: 'supp_custom', name: supplierName, location: 'All India', isVerified: true })}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}
  </>
);

export default OwnerScreens;
