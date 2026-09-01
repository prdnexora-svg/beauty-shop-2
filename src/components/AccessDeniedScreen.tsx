import React from 'react';
import { ShieldAlert, ArrowRight, LogIn, Home } from 'lucide-react';
import type { DenialReason, Viewer } from '../lib/roleAccess';

interface AccessDeniedScreenProps {
  reason: DenialReason;
  message: string;
  viewer: Viewer;
  /** Send the viewer to the workspace they are actually allowed to use. */
  onGoHome: () => void;
  /** Only offered to guests. */
  onSignIn?: () => void;
}

/**
 * Terminal fallback for a blocked screen.
 *
 * This renders only when a redirect could not resolve the situation on its
 * own — it is the visible backstop behind ProtectedRoute, never the primary
 * mechanism. Announced politely to assistive tech via role="alert".
 */
export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  reason,
  message,
  viewer,
  onGoHome,
  onSignIn,
}) => {
  const isGuest = reason === 'unauthenticated';

  const homeLabel =
    viewer === 'supplier'
      ? 'Go to Supplier Admin Portal'
      : viewer === 'buyer'
        ? 'Go to Buyer Dashboard'
        : 'Back to Marketplace';

  return (
    <main
      role="alert"
      aria-live="assertive"
      className="flex-1 min-h-[60vh] bg-[#FDFBF7] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8DEEF] shadow-xl overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-black text-[#2A0E3F]">
              {isGuest ? 'Sign in required' : 'Access denied'}
            </h1>
            <p className="text-[13px] text-[#5B4A6E] leading-relaxed">{message}</p>
          </div>

          <div className="pt-1 space-y-2">
            {isGuest && onSignIn && (
              <button
                onClick={onSignIn}
                className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Continue</span>
              </button>
            )}

            <button
              onClick={onGoHome}
              className={`w-full font-extrabold text-[13px] py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isGuest && onSignIn
                  ? 'bg-white border border-[#E8DEEF] text-[#2A0E3F] hover:bg-[#F7F2FA]'
                  : 'bg-[#6B2D8C] hover:bg-[#4A2560] text-white shadow-md'
              }`}
            >
              {isGuest && onSignIn ? <Home className="w-4 h-4" /> : null}
              <span>{homeLabel}</span>
              {!(isGuest && onSignIn) && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
