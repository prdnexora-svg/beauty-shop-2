import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { SCREEN_METADATA } from '../screens/registry';
import type { ScreenId } from '../screens/types';
import { renderAtScreen, signInLocally } from '../test/renderApp';

const SCREEN_IDS = Object.keys(SCREEN_METADATA) as ScreenId[];

/**
 * The leaf label `Breadcrumbs` renders for each route — the cheapest proof that
 * the routed screen mounted rather than an earlier screen lingering.
 */
const BREADCRUMB_LEAF: Record<ScreenId, string> = {
  explore: '',
  directory: 'Category Catalog',
  'supplier-directory': 'Suppliers',
  plp: 'Products',
  'product-detail': 'Products',
  'search-results': 'Search Results',
  brands: 'Brands',
  'oem-hub': 'OEM / Private Label',
  'supplier-profile': 'Suppliers',
  onboarding: 'Supplier Onboarding',
  'supplier-portal': 'Supplier Portal',
  'supplier-verification': 'Verification',
  'buyer-dashboard': 'Buyer Dashboard',
  'buyer-profile': 'Buyer Profile',
  'rfq-tracking': 'RFQ Tracking',
  'sample-request': 'Sample Request',
  'post-rfq': 'Post Requirement',
  'buyer-enquiry-log': 'Enquiry Log',
  'buyer-onboarding': 'Buyer Onboarding',
};

describe('workspace routing', () => {
  it.each(SCREEN_IDS)('mounts the "%s" screen from its lazy chunk', async (id) => {
    if (SCREEN_METADATA[id].group === 'owner') {
      signInLocally(SCREEN_METADATA[id].spec.startsWith('1') ? 'supplier' : 'buyer');
    }

    const { container } = renderAtScreen(id);

    // The Suspense skeleton must disappear once the chunk resolves.
    await waitFor(() => expect(screen.queryByTestId('screen-fallback')).toBeNull(), {
      timeout: 8000,
    });

    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);

    if (id !== 'explore') {
      expect(screen.getAllByText(BREADCRUMB_LEAF[id]).length).toBeGreaterThan(0);
    }
  });

});
