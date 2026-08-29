import React from 'react';

/**
 * Skeleton shown while a lazily-loaded screen chunk is fetched.
 * Every `React.lazy` route in `ScreenRouter` is wrapped in a `Suspense` boundary
 * that renders this, so a code-split route never renders a blank frame.
 */
export const ScreenFallback: React.FC<{ label?: string; screen?: string }> = ({
  label = 'Loading workspace',
  screen,
}) => (
  <main
    className="flex-1 min-h-[60vh] w-full px-4 md:px-8 py-16"
    role="status"
    aria-busy="true"
    aria-live="polite"
    data-testid="screen-fallback"
    data-screen={screen}
  >
    <div className="max-w-[1440px] mx-auto animate-pulse space-y-8">
      <div className="h-8 w-56 rounded-lg bg-[#EFE5F4]" />
      <div className="h-4 w-96 max-w-full rounded bg-[#F5EDF8]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-[#EFE5F4] bg-white p-5 space-y-4">
            <div className="h-32 rounded-xl bg-[#F5EDF8]" />
            <div className="h-3 w-3/4 rounded bg-[#EFE5F4]" />
            <div className="h-3 w-1/2 rounded bg-[#F5EDF8]" />
          </div>
        ))}
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  </main>
);

/** Full-viewport spinner used by the auth boot / redirect states. */
export const FullPageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div
    className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 text-center"
    role="status"
    aria-busy="true"
    aria-live="polite"
    data-testid="full-page-loader"
  >
    <div className="w-10 h-10 border-4 border-[#6B2D8C] border-t-transparent rounded-full animate-spin mx-auto" />
    {message ? (
      <p className="text-sm font-bold text-[#5B4A6E] mt-3">{message}</p>
    ) : null}
  </div>
);

export default ScreenFallback;
