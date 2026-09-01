import React, { useEffect, useRef } from 'react';
import { evaluateAccess, type ScreenId, type Viewer } from '../lib/roleAccess';
import { AccessDeniedScreen } from './AccessDeniedScreen';

interface ProtectedRouteProps {
  /** The screen being rendered. */
  screen: ScreenId | string;
  /** Effective viewer, derived from auth state via `toViewer()`. */
  viewer: Viewer;
  /**
   * True while the auth session is still resolving. Rendering a decision
   * before this is false would flash "Access denied" at a legitimate user on
   * every page refresh, so we hold a spinner instead.
   */
  authReady?: boolean;
  /** Perform the corrective navigation. Should be idempotent. */
  onRedirect: (screen: ScreenId) => void;
  /** Surface the denial to the user (toast). Optional. */
  onDenied?: (message: string) => void;
  /** Offered to guests on the fallback screen. */
  onSignIn?: () => void;
  children: React.ReactNode;
}

/**
 * Render-time access guard.
 *
 * This is the second of two layers. `handleNavigate` blocks the *click* path;
 * this blocks the *render* path, which also covers restored state, deep links
 * and any future entry point that bypasses the navigation helper. Protected
 * content is never mounted for an unauthorized viewer — it is not merely
 * hidden with CSS.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  screen,
  viewer,
  authReady = true,
  onRedirect,
  onDenied,
  onSignIn,
  children,
}) => {
  const decision = evaluateAccess(screen, viewer);
  const allowed = decision.allowed;
  const redirectTo = decision.redirectTo;

  // Fire the corrective redirect once per (screen, viewer) denial rather than
  // on every render, otherwise a re-render loop would spam navigation.
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authReady || allowed) {
      handledRef.current = null;
      return;
    }
    const key = `${screen}:${viewer}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    if (decision.message) onDenied?.(decision.message);
    if (redirectTo && redirectTo !== screen) onRedirect(redirectTo);
  }, [authReady, allowed, screen, viewer, redirectTo, decision.message, onRedirect, onDenied]);

  if (!authReady) {
    return (
      <main className="flex-1 min-h-[60vh] bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#5B4A6E]">Checking your access…</p>
        </div>
      </main>
    );
  }

  if (allowed) return <>{children}</>;

  // Visible backstop: shown for the frame(s) before the redirect lands, and
  // permanently if the redirect target is itself unreachable.
  return (
    <AccessDeniedScreen
      reason={decision.reason ?? 'wrong-role'}
      message={decision.message ?? 'You do not have permission to view this page.'}
      viewer={viewer}
      onGoHome={() => redirectTo && onRedirect(redirectTo)}
      onSignIn={onSignIn}
    />
  );
};
