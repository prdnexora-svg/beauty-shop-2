import React from 'react';

import { Footer } from '../Footer';
import { LuxeFooter } from '../luxe/LuxeFooter';
import type { ScreenId } from '../../screens/types';

export interface SiteFooterProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
  onOpenRFQ: () => void;
  onOpenAuthModal: () => void;
}

/** Footer variant switch kept out of the app shell for readability. */
export const SiteFooter: React.FC<SiteFooterProps> = ({
  currentScreen,
  onNavigate,
  onOpenRFQ,
  onOpenAuthModal,
}) =>
  currentScreen === 'explore' ? (
    <LuxeFooter onNavigate={onNavigate} onOpenRFQModal={onOpenRFQ} />
  ) : (
    <Footer
      onNavigate={onNavigate}
      onOpenAuthModal={() => onOpenAuthModal()}
      onOpenRFQModal={onOpenRFQ}
    />
  );

export default SiteFooter;
