import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Building2, ShoppingBag, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'buyer' | 'supplier') => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) return;
    setOtpMode(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '1234') {
      setVerified(true);
    } else {
      alert('Invalid OTP. For Demo, please enter: 1234');
      setOtp('');
    }
  };

  const handleReset = () => {
    setOtpMode(false);
    setVerified(false);
    setOtp('');
    setPhoneOrEmail('');
    setBusinessName('');
    onSuccess(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#e8e8e8] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e8e8e8] flex items-center justify-between bg-[#fcf9f8]">
          <div>
            <h3 className="text-base font-bold text-[#1c1b1b]">
              {verified ? 'Success' : otpMode ? 'Verify OTP' : mode === 'login' ? 'Sign In to Nexora Luxe' : 'Create Business Account'}
            </h3>
            <p className="text-[12px] text-[#594047]">
              {verified ? 'Welcome to the platform' : otpMode ? `OTP sent to ${phoneOrEmail}` : 'Access India\'s premier B2B beauty sourcing network'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {verified ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#1c1b1b]">Verification Complete!</h4>
                <p className="text-[13px] text-[#594047] mt-1">
                  You are now connected as a <strong>{role === 'buyer' ? 'Professional Buyer' : 'Verified Supplier'}</strong>.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-all"
              >
                Continue to Platform
              </button>
            </div>
          ) : otpMode ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-6">
                <div>
                  <p className="text-[13px] text-[#594047] mb-4">Please enter the 4-digit code sent to your device.</p>
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={otp[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*$/.test(val)) {
                            const newOtp = otp.split('');
                            newOtp[i] = val;
                            const combined = newOtp.join('');
                            setOtp(combined);
                            
                            // Auto-focus next input
                            if (val && i < 3) {
                              const inputs = e.target.parentElement?.querySelectorAll('input');
                              if (inputs && inputs[i + 1]) inputs[i + 1].focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            const inputs = (e.target as HTMLInputElement).parentElement?.querySelectorAll('input');
                            if (inputs && inputs[i - 1]) inputs[i - 1].focus();
                          }
                        }}
                        className="w-12 h-14 bg-[#f7f2f2] border-2 border-[#e8e8e8] focus:border-[#b90064] rounded-xl text-center text-xl font-bold text-[#1c1b1b] focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Demo Hint */}
                <div className="inline-block bg-[#fde7f3]/30 border border-[#fde7f3] px-4 py-2 rounded-lg animate-pulse mx-auto">
                  <p className="text-[11px] font-bold text-[#b90064] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    For Demo, enter OTP: 1234
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={otp.length !== 4}
                  className="w-full bg-[#b90064] hover:bg-[#8e004b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Verify & Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMode(false)}
                  className="w-full text-[12px] font-bold text-[#b90064] hover:underline"
                >
                  Change Contact Details
                </button>
              </div>

              <div className="text-center">
                <p className="text-[12px] text-[#8c7077]">
                  Didn't receive code? <button type="button" className="text-[#b90064] font-semibold hover:underline">Resend in 25s</button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role Toggle Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f7f2f2] rounded-xl border border-[#e8e8e8]">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-2 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    role === 'buyer'
                      ? 'bg-white text-[#b90064] shadow-xs'
                      : 'text-[#594047] hover:text-[#1c1b1b]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>I am a Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('supplier')}
                  className={`py-2 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    role === 'supplier'
                      ? 'bg-white text-[#b90064] shadow-xs'
                      : 'text-[#594047] hover:text-[#1c1b1b]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>I am a Supplier</span>
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex border-b border-[#e8e8e8] text-[13px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 pb-2 border-b-2 transition-all ${
                    mode === 'login'
                      ? 'border-[#b90064] text-[#b90064]'
                      : 'border-transparent text-[#594047]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 pb-2 border-b-2 transition-all ${
                    mode === 'register'
                      ? 'border-[#b90064] text-[#b90064]'
                      : 'border-transparent text-[#594047]'
                  }`}
                >
                  Register Business
                </button>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Luxe Skin Clinic / Aura Cosmetics"
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                  Mobile Number / Business Email
                </label>
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="+91 98765 43210 or name@business.com"
                  className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{mode === 'login' ? 'Get Login OTP' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-[#8c7077] text-center">
                By continuing, you agree to Nexora Luxe's B2B Terms of Sourcing &amp; Verified Supplier Privacy Code.
              </p>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
