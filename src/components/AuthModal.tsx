import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, ArrowRight, Building2, ShoppingBag, Sparkles, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Info, ShieldAlert, RefreshCw, ExternalLink, Smartphone, ChevronDown } from 'lucide-react';
import {
  AuthFailure,
  OtpChannel,
  SMS_PROVIDER_FIX_STEPS,
  SUPABASE_AUTH_PROVIDERS_URL,
  SUPABASE_OTP_LENGTH,
  formatPhoneForDisplay,
  parseAuthIdentifier,
  phoneOtpAllowed,
  useSupabase,
} from '../lib/supabase';
import { OTP_RESEND_COOLDOWN_MS } from '../lib/phoneAuth';

/** Preview copy for whatever the person typed into the contact field. */
const describeParsedIdentifier = (kind: 'email' | 'phone', value: string) =>
  kind === 'email' ? value : formatPhoneForDisplay(value) || value;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'buyer' | 'supplier', isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
  isFullPage?: boolean;
}

/** Demo OTP accepted when no Supabase project is wired up. */
const DEMO_OTP = '1234';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  isFullPage = false
}) => {
  const {
    isConfigured,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signInWithOtp,
    verifyOtp,
    signInWithGoogle,
    phoneOtpCapability,
    recheckPhoneOtpCapability,
  } = useSupabase();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  /** Classified auth error so the UI can explain + offer a way forward. */
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  /** Where the code actually went, and when a resend becomes legal again. */
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('sms');
  const [otpTarget, setOtpTarget] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const [showAdminSteps, setShowAdminSteps] = useState(false);
  const [isRecheckingProvider, setIsRecheckingProvider] = useState(false);
  const identifierRef = useRef<HTMLInputElement | null>(null);
  const otpRowRef = useRef<HTMLDivElement | null>(null);

  /** Supabase issues 6-digit codes; the local demo keeps the shorter 1234. */
  const otpLength = isConfigured ? SUPABASE_OTP_LENGTH : DEMO_OTP.length;

  const parsedIdentifier = parseAuthIdentifier(phoneOrEmail);
  const typedPhone = parsedIdentifier.kind === 'phone';
  const typedEmail = parsedIdentifier.kind === 'email';
  /**
   * The SMS channel is unavailable when this project has no SMS provider
   * (learned from a previous attempt and cached for the tab) or when the
   * deployment turned the phone path off with VITE_AUTH_PHONE_OTP_ENABLED.
   * We warn up front instead of after the button press.
   */
  const smsProviderUnavailable = !phoneOtpAllowed() || (isConfigured && phoneOtpCapability === 'unavailable');
  const showInlineProviderNotice = authMethod === 'otp' && !otpMode && !typedEmail && smsProviderUnavailable;
  // The amber notice already carries the "why", so the red banner is redundant.
  const suppressErrorPanel = showInlineProviderNotice && failure?.kind === 'sms_provider_unavailable';
  const resendSecondsLeft = Math.max(0, Math.ceil((resendAt - clock) / 1000));

  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  if (!isOpen && !isFullPage) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setFailure(null);
  };

  const startResendCooldown = () => {
    setClock(Date.now());
    setResendAt(Date.now() + OTP_RESEND_COOLDOWN_MS);
  };

  const openOtpEntry = (channel: OtpChannel, target: string) => {
    setOtpChannel(channel);
    setOtpTarget(target);
    setOtp('');
    setOtpMode(true);
  };

  const closeOtpEntry = () => {
    setOtpMode(false);
    setOtp('');
    setResendAt(0);
    resetMessages();
  };

  const describeTarget = (channel: OtpChannel, target: string) =>
    channel === 'email' ? target : formatPhoneForDisplay(target) || target;

  /**
   * Request a code. Used by both "Get Login OTP" and "Resend code" so the
   * provider-unavailable handling can never drift between the two.
   */
  const sendOtpCode = async (identifier: string, options?: { silent?: boolean }) => {
    if (!identifier.trim()) return false;

    if (!isConfigured) {
      // Demo fallback (no remote Supabase project configured).
      const parsed = parseAuthIdentifier(identifier);
      openOtpEntry(parsed.kind === 'email' ? 'email' : 'sms', parsed.kind === 'invalid' ? identifier : parsed.value);
      setInfoMessage(options?.silent ? 'Demo code re-sent. Enter 1234.' : `Demo mode: enter ${DEMO_OTP} to continue.`);
      return true;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithOtp(identifier.trim(), { purpose: mode === 'register' ? 'register' : 'signin' });

      if (result.error) {
        const classified = result.failure ?? null;
        setFailure(classified);
        setErrorMessage(classified?.message ?? result.error.message ?? 'We could not send a code just now. Please try again.');
        if (!options?.silent) setOtpMode(false);
        return false;
      }

      setFailure(null);
      setErrorMessage(null);
      openOtpEntry(result.channel, result.target);
      startResendCooldown();
      setInfoMessage(
        options?.silent
          ? `A fresh code is on its way to ${describeTarget(result.channel, result.target)}.`
          : `We sent a ${otpLength}-digit code to ${describeTarget(result.channel, result.target)}.`,
      );
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthGoogle = async () => {
    resetMessages();
    setIsGoogleLoading(true);

    if (isConfigured) {
      try {
        await signInWithGoogle();
        // PKCE detectSessionInUrl handles the redirect/callback.
      } catch (err: any) {
        setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
        setIsGoogleLoading(false);
      }
      return;
    }

    // Demo fallback (no remote Supabase project configured).
    setTimeout(() => {
      setIsGoogleLoading(false);
      const token = `nexora_oauth_token_${Date.now()}`;
      localStorage.setItem('nexora_user_session', JSON.stringify({
        token,
        email: 'priya.procurement@radiantbeauty.in',
        name: 'Priya Sharma',
        role,
        authenticatedAt: new Date().toISOString()
      }));
      localStorage.setItem('nexora_is_logged_in', 'true');
      localStorage.setItem('nexora_user_role', role);
      setVerified(true);
    }, 900);
  };

  const handleGuestContinue = () => {
    localStorage.setItem('nexora_is_logged_in', 'false');
    localStorage.setItem('nexora_user_role', 'buyer');
    localStorage.setItem('nexora_guest_mode', 'true');
    onSuccess('buyer', false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!phoneOrEmail.trim()) return;

    if (parsedIdentifier.kind === 'invalid') {
      setErrorMessage(parsedIdentifier.error);
      return;
    }

    if (authMethod === 'otp') {
      await sendOtpCode(phoneOrEmail);
      return;
    }

    if (!isConfigured) {
      // Demo fallback (no remote Supabase project configured).
      if (password.length >= 4) {
        const token = `nexora_jwt_${Date.now()}`;
        localStorage.setItem('nexora_user_session', JSON.stringify({
          token,
          email: phoneOrEmail,
          name: businessName || (role === 'buyer' ? 'Priya Sharma' : 'Aura Beauty Labs'),
          role,
          authenticatedAt: new Date().toISOString()
        }));
        localStorage.setItem('nexora_is_logged_in', 'true');
        localStorage.setItem('nexora_user_role', role);
        setVerified(true);
      } else {
        setErrorMessage('Please enter a password with at least 4 characters.');
      }
      return;
    }

    if (mode === 'register') {
      const { error, failure: passwordFailure, needsEmailConfirmation } = await signUpWithEmailPassword(
        parsedIdentifier.value,
        password,
        role,
      );
      if (error) {
        setFailure(passwordFailure ?? null);
        setErrorMessage(passwordFailure?.message ?? error.message ?? 'Registration failed. Please try again.');
        return;
      }
      if (needsEmailConfirmation) {
        setVerified(false);
        setInfoMessage('Registration received. Check your email to confirm your Nexora account, then sign in.');
        return;
      }
      setVerified(true);
      return;
    }

    const { error, failure: passwordFailure } = await signInWithEmailPassword(parsedIdentifier.value, password);
    if (error) {
      setFailure(passwordFailure ?? null);
      setErrorMessage(passwordFailure?.message ?? error.message ?? 'Sign in failed. Please verify your credentials.');
      return;
    }
    setVerified(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (otp.length !== otpLength) {
      setErrorMessage(`Enter the full ${otpLength}-digit code.`);
      return;
    }

    if (isConfigured) {
      setIsSubmitting(true);
      try {
        const { error, failure: verifyFailure } = await verifyOtp(phoneOrEmail.trim(), otp);
        if (error) {
          const kind = verifyFailure?.kind;
          setFailure(verifyFailure ?? null);
          setErrorMessage(
            verifyFailure?.message
            ?? error.message
            ?? `That code was not accepted. Check the ${otpLength} digits and try again.`,
          );
          // A code that never arrives because the channel is down should not
          // keep the entry box open.
          if (kind === 'sms_provider_unavailable') closeOtpEntry();
          setOtp('');
          return;
        }
        setVerified(true);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Demo fallback (no remote Supabase project configured).
    if (otp === DEMO_OTP || otp.length === DEMO_OTP.length) {
      const token = `nexora_jwt_${Date.now()}`;
      localStorage.setItem('nexora_user_session', JSON.stringify({
        token,
        email: phoneOrEmail,
        name: businessName || (role === 'buyer' ? 'Priya Sharma' : 'Aura Beauty Labs'),
        role,
        authenticatedAt: new Date().toISOString()
      }));
      localStorage.setItem('nexora_is_logged_in', 'true');
      localStorage.setItem('nexora_user_role', role);
      setVerified(true);
    } else {
      setErrorMessage(`Invalid OTP. For Demo, please enter: ${DEMO_OTP}`);
      setOtp('');
    }
  };

  const handleResendCode = async () => {
    if (resendSecondsLeft > 0 || isSubmitting) return;
    resetMessages();
    await sendOtpCode(phoneOrEmail, { silent: true });
  };

  /**
   * SMS delivery is not wired up on this project — move the same person to a
   * channel that works instead of leaving them on a broken screen.
   */
  const handleSwitchToEmailCode = () => {
    resetMessages();
    setAuthMethod('otp');
    closeOtpEntry();
    if (typedPhone) setPhoneOrEmail('');
    setInfoMessage('Type your business email below and we will send the code there instead.');
    window.setTimeout(() => identifierRef.current?.focus(), 0);
  };

  const handleSwitchToPassword = () => {
    resetMessages();
    closeOtpEntry();
    setAuthMethod('password');
    window.setTimeout(() => identifierRef.current?.focus(), 0);
  };

  const handleRecheckProvider = async () => {
    setIsRecheckingProvider(true);
    resetMessages();
    try {
      await recheckPhoneOtpCapability();
      // Retry now: if the provider is still missing, requestOtp() classifies it
      // again and the notice stays on screen with an updated timestamp.
      await sendOtpCode(phoneOrEmail);
    } finally {
      setIsRecheckingProvider(false);
    }
  };

  const handleReset = () => {
    const isNew = mode === 'register';
    closeOtpEntry();
    setVerified(false);
    setPhoneOrEmail('');
    setPassword('');
    setBusinessName('');
    setFailure(null);
    onSuccess(role, isNew);
    onClose();
  };

  const channelLabel = otpChannel === 'email' ? 'email' : otpChannel === 'whatsapp' ? 'WhatsApp' : 'text message';

  const content = (
    <div className="bg-white rounded-3xl border border-[#E8DEEF] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

      {/* Modal Header */}
      <div className="p-5 border-b border-[#E8DEEF] flex items-center justify-between bg-[#FDFBF7]">
        <div>
          <h3 className="text-base font-black text-[#2A0E3F]">
            {verified ? 'Authentication Verified' : otpMode ? 'Verify Sourcing OTP' : mode === 'login' ? 'Sign In to Nexora Luxe' : 'Create Business Account'}
          </h3>
          <p className="text-[12px] text-[#5B4A6E] font-medium">
            {verified
              ? 'Session activated & security checks passed'
              : otpMode
                ? `Code sent to ${otpTarget ? describeTarget(otpChannel, otpTarget) : phoneOrEmail}`
                : "Access India's premier B2B beauty sourcing network"}
          </p>
        </div>
        {!isFullPage && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[#7E6C96] hover:text-[#2A0E3F] hover:bg-[#F4F0E9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal Body */}
      <div className="p-6">
        {errorMessage && !suppressErrorPanel && (
          <div className={`mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold border ${
            failure?.adminNote
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {failure?.adminNote
              ? <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <div className="space-y-1">
              {failure?.title && <p className="font-black">{failure.title}</p>}
              <span>{errorMessage}</span>
              {failure?.hint && <p className="font-medium opacity-80">{failure.hint}</p>}
            </div>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 flex items-start gap-2 bg-sky-50 border border-sky-200 text-sky-700 px-3 py-2.5 rounded-xl text-[12px] font-semibold">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {verified ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#2A0E3F]">Verification Complete!</h4>
              <p className="text-[13px] text-[#5B4A6E] mt-1">
                You are securely logged in as a <strong>{role === 'buyer' ? 'Professional Buyer' : 'Verified Supplier'}</strong>.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Continue to {role === 'buyer' ? 'Buyer Dashboard' : 'Supplier Portal'}
            </button>
          </div>
        ) : otpMode ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center space-y-5">
              <div>
                <p className="text-[13px] text-[#5B4A6E] mb-4">
                  Enter the {otpLength}-digit code we sent by {channelLabel} to{' '}
                  <strong className="text-[#2A0E3F]">{describeTarget(otpChannel, otpTarget)}</strong>.
                </p>
                <div ref={otpRowRef} className="flex justify-center gap-3">
                  {Array.from({ length: otpLength }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        const digits = otp.split('');
                        digits[i] = val;
                        // Keep the code dense: a cleared middle digit shifts left.
                        setOtp(digits.join('').slice(0, otpLength));

                        if (val && i < otpLength - 1) {
                          const inputs = otpRowRef.current?.querySelectorAll('input');
                          if (inputs && inputs[i + 1]) inputs[i + 1].focus();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
                        if (!pasted) return;
                        e.preventDefault();
                        setOtp(pasted);
                        const inputs = otpRowRef.current?.querySelectorAll('input');
                        const focusIndex = Math.min(pasted.length, otpLength - 1);
                        if (inputs && inputs[focusIndex]) inputs[focusIndex].focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          const inputs = otpRowRef.current?.querySelectorAll('input');
                          if (inputs && inputs[i - 1]) inputs[i - 1].focus();
                        }
                      }}
                      className="w-11 h-14 bg-[#F6F1FA] border-2 border-[#E8DEEF] focus:border-[#C9A961] rounded-xl text-center text-xl font-bold text-[#2A0E3F] focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Demo Hint */}
              {!isConfigured && (
                <div className="inline-block bg-[#F5EEF8] border border-[#6B2D8C]/20 px-4 py-2 rounded-xl animate-pulse mx-auto">
                  <p className="text-[11px] font-black text-[#6B2D8C] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    For Demo, enter OTP: {DEMO_OTP}
                  </p>
                </div>
              )}

              {isConfigured && otpChannel !== 'email' && (
                <p className="text-[11px] font-semibold text-[#7E6C96]">
                  Codes expire in a few minutes. Wrong number? <button type="button" onClick={closeOtpEntry} className="text-[#6B2D8C] font-bold hover:underline cursor-pointer">Change it</button>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={otp.length !== otpLength || isSubmitting}
                className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={closeOtpEntry}
                className="w-full text-[12px] font-bold text-[#6B2D8C] hover:underline cursor-pointer"
              >
                Change Contact Details
              </button>
            </div>

            <div className="text-center">
              {resendSecondsLeft > 0 ? (
                <p className="text-[12px] text-[#7E6C96]">
                  Didn't receive code? Resend available in {resendSecondsLeft}s
                </p>
              ) : (
                <p className="text-[12px] text-[#7E6C96]">
                  Didn't receive code?{' '}
                  {isConfigured ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isSubmitting}
                      className="text-[#6B2D8C] font-bold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  ) : (
                    <button type="button" onClick={() => setOtp(DEMO_OTP)} className="text-[#6B2D8C] font-bold hover:underline cursor-pointer">
                      Auto-fill {DEMO_OTP}
                    </button>
                  )}
                </p>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Toggle Selector (Buyer, Supplier) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6F1FA] rounded-xl border border-[#E8DEEF]">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`py-2 text-[12px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'buyer'
                    ? 'bg-white text-[#6B2D8C] shadow-xs'
                    : 'text-[#5B4A6E] hover:text-[#2A0E3F]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buyer Account</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('supplier')}
                className={`py-2 text-[12px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'supplier'
                    ? 'bg-white text-[#6B2D8C] shadow-xs'
                    : 'text-[#5B4A6E] hover:text-[#2A0E3F]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Supplier Account</span>
              </button>
            </div>

            {/* Mode Toggle Tabs (Sign In vs Register) */}
            <div className="flex border-b border-[#E8DEEF] text-[13px] font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                className={`flex-1 pb-2.5 border-b-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'border-[#6B2D8C] text-[#6B2D8C]'
                    : 'border-transparent text-[#5B4A6E]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); resetMessages(); }}
                className={`flex-1 pb-2.5 border-b-2 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'border-[#6B2D8C] text-[#6B2D8C]'
                    : 'border-transparent text-[#5B4A6E]'
                }`}
              >
                Register Business
              </button>
            </div>

            {/* Auth Method (OTP vs Password) */}
            <div className="flex items-center justify-end gap-3 text-[11px] font-bold text-[#5B4A6E]">
              <span>Sign in using:</span>
              <button
                type="button"
                onClick={() => { setAuthMethod('otp'); resetMessages(); }}
                className={`px-2 py-0.5 rounded cursor-pointer ${authMethod === 'otp' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:text-[#2A0E3F]'}`}
              >
                Mobile OTP
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => { setAuthMethod('password'); resetMessages(); }}
                className={`px-2 py-0.5 rounded cursor-pointer ${authMethod === 'password' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:text-[#2A0E3F]'}`}
              >
                Password
              </button>
            </div>

            {/* Google OAuth Trigger */}
            <button
              type="button"
              onClick={handleOAuthGoogle}
              disabled={isGoogleLoading}
              className="w-full bg-white hover:bg-stone-50 border border-[#E8DEEF] hover:border-stone-300 text-[#2A0E3F] font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : `Continue with Google (${role === 'buyer' ? 'Buyer' : 'Supplier'})`}</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-[#E8DEEF] flex-1" />
              <span className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider">or</span>
              <div className="h-px bg-[#E8DEEF] flex-1" />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Luxe Skin Clinic / Aura Cosmetics"
                  className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                {authMethod === 'otp' ? 'Mobile Number / Business Email' : 'Business Email Address'}
              </label>
              <div className="relative">
                <input
                  ref={authMethod === 'otp' ? identifierRef : undefined}
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => { setPhoneOrEmail(e.target.value); if (errorMessage) resetMessages(); }}
                  onBlur={(e) => {
                    // Normalise on blur so what they see is what we send.
                    if (authMethod !== 'otp') return;
                    const parsed = parseAuthIdentifier(e.target.value);
                    if (parsed.kind !== 'invalid' && parsed.value !== e.target.value) {
                      setPhoneOrEmail(parsed.value);
                    }
                  }}
                  placeholder={authMethod === 'otp' ? '+91 98201 54321 or name@business.com' : 'procurement@company.com'}
                  autoComplete="username"
                  className={`w-full bg-[#F6F1FA] border focus:border-[#C9A961] rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none ${
                    phoneOrEmail && parsedIdentifier.kind === 'invalid' ? 'border-red-300' : 'border-[#E8DEEF]'
                  }`}
                  required
                />
                {authMethod === 'otp' ? (
                  typedEmail
                    ? <Mail className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
                    : <Phone className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {authMethod === 'otp' && phoneOrEmail.trim() && (
                <p className={`mt-1 text-[11px] font-semibold ${parsedIdentifier.kind === 'invalid' ? 'text-red-600' : 'text-[#7E6C96]'}`}>
                  {parsedIdentifier.kind === 'invalid'
                    ? parsedIdentifier.error
                    : `Code will go to ${describeParsedIdentifier(parsedIdentifier.kind, parsedIdentifier.value)}`}
                </p>
              )}
            </div>

            {/* Text-message channel is not usable on this project: say so here,
                not after the person has already pressed the button. */}
            {showInlineProviderNotice && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2.5">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-amber-900">
                      {phoneOtpAllowed()
                        ? 'Codes cannot be texted to this number yet'
                        : 'Text-message sign-in is turned off for this deployment'}
                    </p>
                    <p className="text-[11.5px] text-amber-800 leading-relaxed">
                      {phoneOtpAllowed()
                        ? 'Supabase Auth has no SMS delivery provider connected to this project, so a texted code would never arrive. Nothing is wrong with your number — pick one of the options below.'
                        : 'Text-message codes are switched off for this deployment (VITE_AUTH_PHONE_OTP_ENABLED=false), so nothing will be sent to this number. Pick one of the options below.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchToEmailCode}
                    className="flex items-center gap-1.5 bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email me the code instead
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToPassword}
                    className="flex items-center gap-1.5 bg-white hover:bg-stone-50 border border-amber-200 text-[#2A0E3F] text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Use my password
                  </button>
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={handleRecheckProvider}
                      disabled={isRecheckingProvider}
                      className="flex items-center gap-1.5 bg-white hover:bg-stone-50 border border-amber-200 text-[#2A0E3F] text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRecheckingProvider ? 'animate-spin' : ''}`} />
                      {isRecheckingProvider ? 'Checking provider...' : "I've set it up — retry"}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdminSteps((v) => !v)}
                  className="flex items-center gap-1 text-[10.5px] font-black uppercase tracking-wide text-amber-700 hover:text-amber-900 cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" />
                  How to enable SMS OTP
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAdminSteps ? 'rotate-180' : ''}`} />
                </button>

                {showAdminSteps && (
                  <ol className="space-y-1.5 pl-0.5">
                    {SMS_PROVIDER_FIX_STEPS.map((step, index) => (
                      <li key={step.label} className="text-[11px] leading-relaxed text-amber-900">
                        <span className="font-black">{index + 1}. {step.label}</span>
                        <span className="block text-amber-800/90">{step.detail}</span>
                      </li>
                    ))}
                    <li className="pt-0.5">
                      <a
                        href={SUPABASE_AUTH_PROVIDERS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B2D8C] hover:underline"
                      >
                        Open Supabase auth providers
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  </ol>
                )}
              </div>
            )}

            {authMethod === 'password' && (
              <div>
                <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] disabled:opacity-60 text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>
                {authMethod === 'otp'
                  ? isSubmitting
                    ? 'Sending code...'
                    : mode === 'login' ? 'Get Login OTP' : 'Send Registration OTP'
                  : mode === 'login' ? 'Sign In Securely' : 'Complete Registration'}
              </span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Continue as Guest option */}
            <div className="pt-2 text-center border-t border-[#F4F0E9]">
              <button
                type="button"
                onClick={handleGuestContinue}
                className="text-[12px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] hover:underline cursor-pointer"
              >
                Continue Browsing as Guest
              </button>
            </div>

            <p className="text-[11px] text-[#7E6C96] text-center">
              By continuing, you agree to Nexora Luxe's B2B Terms of Sourcing &amp; Verified Supplier Privacy Code.
            </p>

          </form>
        )}
      </div>

    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {content}
    </div>
  );
};
