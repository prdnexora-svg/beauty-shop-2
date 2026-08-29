import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import App from '../App';
import type { ScreenId } from '../screens/types';

/** Render the application shell straight onto a given workspace screen. */
export function renderAtScreen(screen: ScreenId): RenderResult {
  return render(<App initialScreen={screen} />);
}

/** Pretend the demo/local auth flags are set (no Supabase project configured). */
export function signInLocally(role: 'buyer' | 'supplier' = 'buyer'): void {
  window.localStorage.setItem('nexora_is_logged_in', 'true');
  window.localStorage.setItem('nexora_user_role', role);
}
