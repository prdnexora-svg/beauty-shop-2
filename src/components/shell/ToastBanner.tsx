import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/** Transient success/info toast rendered by the app shell. */
export const ToastBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    className="fixed bottom-22 right-6 z-50 bg-[#2A0E3F] text-white px-4 py-3 rounded-xl shadow-xl border border-[#352B44] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200"
    role="status"
    aria-live="polite"
    data-testid="toast-banner"
  >
    <CheckCircle2 className="w-4 h-4 text-[#8236A0]" />
    <span className="text-[13px] font-medium">{message}</span>
  </div>
);

export default ToastBanner;
