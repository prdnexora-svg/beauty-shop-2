import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ArrowRight, Building2, ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle, Info, KeyRound, ChevronLeft, Send } from 'lucide-react';
import { useSupabase, MIN_PASSWORD_LENGTH, EMAIL_REGEX, AUTH_RESEND_COOLDOWN_MS } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'buyer' | 'supplier', isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
  initialRole?: 'buyer' | 'supplier';
  isFullPage?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialRole = 'buyer',
  isFullPage = false
}) => {
  const {
    isConfigured,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signInWithGoogle,
    sendPasswordResetEmail,
    resendSignupConfirmation,
  } = useSupabase();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [view, setView] = useState<'auth' | 'forgot'>('auth');
  const [role, setRole] = useState<'buyer' | 'supplier'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetSent, setResetSent] = useState(false);
  // The role the SERVER confirmed for this account. On sign-in this can differ
  // from the `role` toggle, and the server value must win when routing.
  const [resolvedRole, setResolvedRole] = useState<'buyer' | 'supplier' | null>(null);
  const [wasRegistration, setWasRegistration] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const errorBoxRef = useRef<HTMLDivElement>(null);

  // Screen readers announce auth errors; keyboard focus moves to the banner
  // so the failure is impossible to miss.
  useEffect(() => {
    if (errorMessage && errorBoxRef.current) {
      errorBoxRef.current.focus();
    }
  }, [errorMessage]);

  // Resend cooldown ticker (confirmation + reset emails).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!isOpen && !isFullPage) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const validate = () => {
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid Gmail / Email address. Example: name@gmail.com');
      return false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return false;
    }
    if (mode === 'register' && !businessName.trim()) {
      setErrorMessage('Please enter your Business / Company Name.');
      return false;
    }
    return true;
  };

  const handleOAuthGoogle = async () => {
    resetMessages();
    setIsGoogleLoading(true);

    if (isConfigured) {
      try {
        // Pass the selected role so it survives the provider redirect.
        const { error, failure } = await signInWithGoogle(role);
        if (error || failure) {
          setErrorMessage(failure?.message || error?.message || 'Google sign-in failed. Please try again.');
          setIsGoogleLoading(false);
        }
        // On success the browser navigates away; leave the spinner running.
      } catch (err: any) {
        setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
        setIsGoogleLoading(false);
      }
      return;
    }

    setIsGoogleLoading(false);
    setErrorMessage('Sign-in is currently unavailable. Please browse as a guest and try again later.');
  };

  // Guests simply browse the public marketplace — no fake login, no flags.
  const handleGuestContinue = () => {
    try {
      localStorage.setItem('nexora_is_logged_in', 'false');
      localStorage.removeItem('nexora_user_role');
      localStorage.removeItem('nexora_guest_mode');
    } catch { /* storage disabled */ }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (!isConfigured) {
        setErrorMessage('Sign-in is currently unavailable. Please browse as a guest and try again later.');
        return;
      }

      if (mode === 'register') {
        const { error, needsEmailConfirmation, failure, role: serverRole } = await signUpWithEmailPassword(
          email.trim().toLowerCase(),
          password,
          role,
        );
        if (error || failure) {
          setErrorMessage(failure?.message || error?.message || 'Registration failed. Please try again.');
          // A duplicate email is actionable: drop the user straight into sign-in.
          if (failure?.kind === 'duplicate_email') {
            setMode('login');
            setPassword('');
          }
          return;
        }
        if (needsEmailConfirmation) {
          setVerified(false);
          setInfoMessage('Registration successful! Please check your Gmail inbox to confirm your account, then sign in.');
          return;
        }
        setResolvedRole(serverRole ?? role);
        setWasRegistration(true);
        setVerified(true);
        return;
      }

      const { error, failure, role: serverRole } = await signInWithEmailPassword(email.trim().toLowerCase(), password);
      if (error || failure) {
        setErrorMessage(failure?.message || error?.message || 'Sign in failed. Please check your email and password.');
        return;
      }
      // Route by the account's real role, not the toggle the user happened to
      // leave selected — a supplier signing in with "Buyer" active must still
      // land in the Supplier portal.
      const effectiveRole = serverRole ?? role;
      if (serverRole && serverRole !== role) {
        setRole(serverRole);
        setInfoMessage(`Signed in as a ${serverRole === 'buyer' ? 'Buyer' : 'Supplier'} account.`);
      }
      setResolvedRole(effectiveRole);
      setWasRegistration(false);
      setVerified(true);
    } catch (err: any) {
      // Guarantees the button never sticks on "Please wait..." after a crash.
      setErrorMessage(err?.message || 'Unexpected error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const isNew = wasRegistration;
    const finalRole = resolvedRole ?? role;
    setVerified(false);
    setEmail('');
    setPassword('');
    setBusinessName('');
    setResolvedRole(null);
    setWasRegistration(false);
    setShowResend(false);
    onSuccess(finalRole, isNew);
    onClose();
  };

  const startCooldown = () => {
    setResendCooldown(Math.ceil(AUTH_RESEND_COOLDOWN_MS / 1000));
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    resetMessages();
    const clean = email.trim().toLowerCase();
    if (!clean || !EMAIL_REGEX.test(clean)) {
      setErrorMessage('Please enter the email you registered with, then tap Resend.');
      return;
    }
    if (!isConfigured) {
      setInfoMessage('Demo preview — no email is sent. Just press Sign In to continue.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error, failure } = await resendSignupConfirmation(clean);
      if (error || failure) {
        setErrorMessage(failure?.message || error?.message || 'Could not resend the email. Please try again.');
        return;
      }
      startCooldown();
      setInfoMessage(`Confirmation email sent again to ${clean}. It can take a minute — also check Spam.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const clean = email.trim().toLowerCase();
    if (!clean || !EMAIL_REGEX.test(clean)) {
      setErrorMessage('Please enter a valid Gmail / Email address. Example: name@gmail.com');
      return;
    }
    if (!isConfigured) {
      setInfoMessage('Demo preview — password reset needs a connected Supabase project.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error, failure } = await sendPasswordResetEmail(clean);
      if (error || failure) {
        setErrorMessage(failure?.message || error?.message || 'Could not send the reset email. Please try again.');
        return;
      }
      setResetSent(true);
      startCooldown();
      setInfoMessage(`If an account exists for ${clean}, a reset link is on its way. It expires in 1 hour.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotView = () => {
    resetMessages();
    setResetSent(false);
    setView('forgot');
  };

  const backToAuth = () => {
    resetMessages();
    setResetSent(false);
    setView('auth');
  };

  const content = (
    <div className="bg-white rounded-3xl border border-[#E8DEEF] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

      {/* Header */}
      <div className="p-5 border-b border-[#E8DEEF] flex items-center justify-between bg-[#FDFBF7]">
        <div>
          <h3 className="text-base font-black text-[#2A0E3F]">
            {verified ? 'Authentication Verified' : mode === 'login' ? 'Sign In to Nexora Luxe' : 'Create Business Account'}
          </h3>
          <p className="text-[12px] text-[#5B4A6E] font-medium">
            {verified
              ? 'Session activated & security checks passed'
              : mode === 'login'
                ? 'Welcome back! Sign in with your Gmail ID'
                : 'Join with your Gmail ID & Password'}
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

      {/* Body */}
      <div className="p-6">
        {errorMessage && (
          <div
            ref={errorBoxRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold border bg-red-50 border-red-200 text-red-700 focus:outline-none"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div role="status" aria-live="polite" className="mb-4 flex items-start gap-2 bg-sky-50 border border-sky-200 text-sky-700 px-3 py-2.5 rounded-xl text-[12px] font-semibold">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {showResend && !verified && view === 'auth' && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={isSubmitting || resendCooldown > 0}
            className="mb-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-[#F6F1FA] disabled:opacity-60 border border-[#E8DEEF] text-[#6B2D8C] font-bold text-[12px] py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : 'Resend confirmation email'}
            </span>
          </button>
        )}

        {view === 'forgot' ? (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="w-12 h-12 bg-[#F6F1FA] rounded-2xl flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 text-[#6B2D8C]" />
            </div>
            <p className="text-[13px] text-[#5B4A6E] text-center leading-relaxed">
              Enter the email you signed up with. We will send a link to set a new password — no old password needed.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                Gmail / Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errorMessage) resetMessages(); }}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || (resetSent && resendCooldown > 0)}
              className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] disabled:opacity-60 text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>
                {isSubmitting
                  ? 'Sending...'
                  : resetSent && resendCooldown > 0
                    ? `Link sent — resend in ${resendCooldown}s`
                    : resetSent
                      ? 'Send the link again'
                      : 'Send reset link'}
              </span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={backToAuth}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] py-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </form>
        ) : verified ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#2A0E3F]">Welcome to Nexora!</h4>
              <p className="text-[13px] text-[#5B4A6E] mt-1">
                You are logged in as a <strong>{role === 'buyer' ? 'Professional Buyer' : 'Verified Supplier'}</strong> with <strong>{email}</strong>.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Continue to {role === 'buyer' ? 'Buyer Dashboard' : 'Supplier Portal'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6F1FA] rounded-xl border border-[#E8DEEF]">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`py-2.5 text-[12px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'buyer'
                    ? 'bg-white text-[#6B2D8C] shadow-sm'
                    : 'text-[#5B4A6E] hover:text-[#2A0E3F]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buyer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('supplier')}
                className={`py-2.5 text-[12px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'supplier'
                    ? 'bg-white text-[#6B2D8C] shadow-sm'
                    : 'text-[#5B4A6E] hover:text-[#2A0E3F]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Supplier</span>
              </button>
            </div>

            {/* Login / Register Tabs */}
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
                Sign Up
              </button>
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
                  placeholder="e.g. Radiant Beauty Solutions"
                  className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-3.5 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none transition-colors"
                  required={mode === 'register'}
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                Gmail / Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errorMessage) resetMessages(); }}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errorMessage) resetMessages(); }}
                  placeholder={mode === 'login' ? 'Enter your password' : `Create a password (min ${MIN_PASSWORD_LENGTH} chars)`}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-[#2A0E3F] focus:outline-none transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' ? (
                <p className="mt-1.5 text-[11px] text-[#7E6C96]">Use at least {MIN_PASSWORD_LENGTH} characters. No mobile, no OTP needed.</p>
              ) : (
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={openForgotView}
                    className="text-[12px] font-bold text-[#6B2D8C] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6B2D8C] hover:bg-[#4A2560] disabled:opacity-60 text-white font-extrabold text-[13px] py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>
                {isSubmitting
                  ? 'Please wait...'
                  : mode === 'login' ? 'Sign In Securely' : 'Create Account'}
              </span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-[#E8DEEF] flex-1" />
              <span className="text-[11px] font-bold text-[#7E6C96] uppercase tracking-wider">or</span>
              <div className="h-px bg-[#E8DEEF] flex-1" />
            </div>

            <button
              type="button"
              onClick={handleOAuthGoogle}
              disabled={isGoogleLoading}
              className="w-full bg-white hover:bg-stone-50 border border-[#E8DEEF] hover:border-stone-300 text-[#2A0E3F] font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : `Continue with Google`}</span>
            </button>

            <div className="pt-2 text-center border-t border-[#F4F0E9] space-y-2">
              <p className="text-[12px] text-[#5B4A6E]">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetMessages(); }}
                  className="font-bold text-[#6B2D8C] hover:underline cursor-pointer"
                >
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
              <button
                type="button"
                onClick={handleGuestContinue}
                className="text-[12px] font-bold text-[#5B4A6E] hover:text-[#6B2D8C] hover:underline cursor-pointer"
              >
                Continue Browsing as Guest
              </button>
            </div>

            {!isConfigured && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center leading-relaxed">
                Demo preview — any email works, and data stays in this browser only.
              </p>
            )}

            <p className="text-[11px] text-[#7E6C96] text-center leading-relaxed">
              Simple & secure — only Gmail/Email + Password. No mobile number, no OTP required.
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
