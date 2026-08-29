import React from 'react';

import { TopNavBar } from '../TopNavBar';
import { LuxeHeader } from '../luxe/LuxeHeader';
import type { BuyerProfileData } from '../EditProfileModal';
import type { ScreenId } from '../../screens/types';

export interface SiteHeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
  onOpenRFQ: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenEditProfile: () => void;
  onLogout: () => void;
  onOpenChat: () => void;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  userProfile: BuyerProfileData;
}

/**
 * Public chrome: the Luxe (purple-gold) header is used on the landing page and
 * the compact utility header everywhere else.
 */
export const SiteHeader: React.FC<SiteHeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenRFQ,
  onOpenAuthModal,
  onOpenEditProfile,
  onLogout,
  onOpenChat,
  isLoggedIn,
  userRole,
  userProfile,
}) => {
  if (currentScreen === 'explore') {
    return (
      <LuxeHeader
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onOpenAuthModal={onOpenAuthModal}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        userProfile={userProfile}
        onOpenChat={onOpenChat}
      />
    );
  }

  return (
    <TopNavBar
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onOpenRFQModal={onOpenRFQ}
      onOpenAuthModal={onOpenAuthModal}
      isLoggedIn={isLoggedIn}
      userRole={userRole}
      userProfile={userProfile}
      onOpenEditProfile={onOpenEditProfile}
      onLogout={onLogout}
    />
  );
};

export default SiteHeader;
