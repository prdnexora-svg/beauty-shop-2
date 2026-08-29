import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { renderAtScreen } from '../test/renderApp';

/**
 * Lives in its own file on purpose: the module registry must not have loaded
 * the screen chunk yet, otherwise `act()` resolves the lazy import before the
 * fallback can be observed.
 */
describe('code-split Suspense boundaries', () => {
  it('shows the skeleton while a lazy screen chunk loads, then swaps in the screen', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderAtScreen('supplier-portal');

    // The Suspense fallback is visible immediately — no blank frame.
    expect(screen.getByTestId('screen-fallback')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('screen-fallback')).toBeNull(), {
      timeout: 8000,
    });

    expect(screen.getAllByText('Supplier Portal').length).toBeGreaterThan(0);

    const suspenseErrors = consoleError.mock.calls.filter((args) =>
      /no fallback UI was specified|suspended while rendering/i.test(String(args[0])),
    );
    expect(suspenseErrors).toEqual([]);
    consoleError.mockRestore();
  });
});
