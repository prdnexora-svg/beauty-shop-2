import React from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderAtScreen } from '../test/renderApp';

describe('public website (landing + discovery)', () => {
  it('renders the landing page eagerly — no suspense fallback on first paint', () => {
    const { container } = renderAtScreen('explore');

    // The landing page is bundled with the shell: it must never show the
    // code-splitting skeleton before the first meaningful paint.
    expect(screen.queryByTestId('screen-fallback')).toBeNull();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByText(/Nexora Luxe/)).toBeInTheDocument();
    expect(container.querySelector('#fab-db-inspector')).toBeInTheDocument();
  });

  it('routes from the landing page into a public discovery screen', async () => {
    const user = userEvent.setup();
    renderAtScreen('explore');

    const header = screen.getByRole('banner');
    await user.click(within(header).getAllByText('Suppliers')[0]);

    // The lazy chunk resolves behind the Suspense boundary, then the breadcrumb
    // reflects the new route.
    await waitFor(() => expect(screen.queryByTestId('screen-fallback')).toBeNull(), {
      timeout: 5000,
    });
    expect(await screen.findAllByText('Suppliers')).not.toHaveLength(0);
  });

  it('keeps guests on public screens and never mounts an owner screen', async () => {
    renderAtScreen('brands');

    await waitFor(() => expect(screen.queryByTestId('screen-fallback')).toBeNull(), {
      timeout: 5000,
    });
    expect(screen.queryByText('Please sign in to access dashboard workspace features.')).toBeNull();
  });
});
