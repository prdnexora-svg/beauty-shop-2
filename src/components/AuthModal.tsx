import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Building2, ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { useSupabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'buyer' | 'supplier', isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
  isFullPage?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    signInWithGoogle,
  } = useSupabase();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  // The role the SERVER confirmed for this account. On sign-in this can differ
  // from the `role` toggle, and the server value must win when routing.
  const [resolvedRole, setResolvedRole] = useState<'buyer' | 'supplier' | null>(null);
  const [wasRegistration, setWasRegistration] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
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

    // Demo fallback
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
      localStorage.removeItem('nexora_guest_mode');
      setResolvedRole(role);
      setWasRegistration(false);
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

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (!isConfigured) {
        // Demo mode - no Supabase
        const token = `nexora_jwt_${Date.now()}`;
        localStorage.setItem('nexora_user_session', JSON.stringify({
          token,
          email: email.trim().toLowerCase(),
          name: businessName || (role === 'buyer' ? 'Priya Sharma' : 'Aura Beauty Labs'),
          role,
          authenticatedAt: new Date().toISOString()
        }));
        localStorage.setItem('nexora_is_logged_in', 'true');
        localStorage.setItem('nexora_user_role', role);
        localStorage.removeItem('nexora_guest_mode');
        setResolvedRole(role);
        setWasRegistration(mode === 'register');
        setVerified(true);
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
    onSuccess(finalRole, isNew);
    onClose();
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
          <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold border bg-red-50 border-red-200 text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
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
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min 6 chars)'}
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
              {mode === 'register' && (
                <p className="mt-1.5 text-[11px] text-[#7E6C96]">Use at least 6 characters. No mobile, no OTP needed.</p>
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
