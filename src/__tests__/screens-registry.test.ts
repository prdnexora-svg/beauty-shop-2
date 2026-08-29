import { describe, expect, it } from 'vitest';

import {
  EAGER_SCREENS,
  OWNER_SCREEN_IDS,
  OWNER_SCREENS,
  PUBLIC_SCREEN_IDS,
  PUBLIC_SCREENS,
  SCREEN_COMPONENTS,
  SCREEN_METADATA,
  isOwnerScreen,
  isPublicScreen,
  preloadScreen,
} from '../screens/registry';
import type { ScreenId } from '../screens/types';

const ALL_SCREEN_IDS = Object.keys(SCREEN_METADATA) as ScreenId[];

describe('screen registry', () => {
  it('has metadata and a component for every screen id', () => {
    for (const id of ALL_SCREEN_IDS) {
      expect(SCREEN_METADATA[id], `metadata for ${id}`).toBeDefined();
      expect(SCREEN_COMPONENTS[id], `component for ${id}`).toBeDefined();
    }
  });

  it('separates public website screens from owner workspace screens', () => {
    expect(PUBLIC_SCREEN_IDS).toContain('explore');
    expect(OWNER_SCREEN_IDS).not.toContain('explore');

    for (const id of PUBLIC_SCREEN_IDS) expect(isPublicScreen(id)).toBe(true);
    for (const id of OWNER_SCREEN_IDS) expect(isOwnerScreen(id)).toBe(true);

    // The two groups partition the whole set.
    expect([...PUBLIC_SCREEN_IDS, ...OWNER_SCREEN_IDS].sort()).toEqual(
      [...ALL_SCREEN_IDS].sort(),
    );
  });

  it('keeps the landing page eager and every other screen lazy', () => {
    expect(EAGER_SCREENS.explore).toBeDefined();
    const eagerIds = Object.keys(EAGER_SCREENS);
    expect(eagerIds).toEqual(['explore']);

    for (const id of ALL_SCREEN_IDS.filter((s) => s !== 'explore')) {
      expect(SCREEN_METADATA[id].lazy, `${id} should be code-split`).toBe(true);
    }
  });

  it('lazy-loads all eight owner workspace screens (spec 18-25)', () => {
    const ownerSpecs = OWNER_SCREEN_IDS.map((id) => SCREEN_METADATA[id].spec);
    // 18-25 plus the two "b" variants of the dashboard and RFQ routes.
    expect(ownerSpecs).toEqual(
      expect.arrayContaining(['18', '19', '20', '21', '22', '23', '24', '25']),
    );
    for (const id of OWNER_SCREEN_IDS) {
      expect(OWNER_SCREENS[id as keyof typeof OWNER_SCREENS]).toBeDefined();
      expect(SCREEN_METADATA[id].group).toBe('owner');
    }
  });

  it('resolves every dynamic import target without a transform error', async () => {
    const results = await Promise.all(
      ALL_SCREEN_IDS.map((id) => preloadScreen(id).then(() => id)),
    );
    expect(results.sort()).toEqual([...ALL_SCREEN_IDS].sort());

    // Public screens are registered separately from the owner workspace.
    expect(Object.keys(PUBLIC_SCREENS)).toHaveLength(PUBLIC_SCREEN_IDS.length - 1);
    expect(Object.keys(OWNER_SCREENS)).toHaveLength(OWNER_SCREEN_IDS.length);
  });
});
