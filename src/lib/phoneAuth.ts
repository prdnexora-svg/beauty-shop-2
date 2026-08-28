// ============================================================================
// NEXORA LUXE — PHONE / OTP DISABLED
// Simple Email + Password auth only. No mobile, no OTP.
// This file is kept for backward compatibility but all phone/OTP functions
// are disabled and return safe defaults.
// ============================================================================

export type OtpChannel = 'email' | 'sms' | 'whatsapp';
export type PhoneCapability = 'disabled' | 'unknown' | 'available' | 'unavailable';
export interface PhoneCapabilityRecord {
  state: PhoneCapability;
  reason?: string;
  checkedAt?: number;
}
export type AuthFailureKind = 'sms_provider_unavailable' | 'phone_disabled' | 'email_disabled' | 'invalid_phone' | 'invalid_email' | 'invalid_otp' | 'rate_limited' | 'network' | 'credentials' | 'unknown';
export interface AuthFailure {
  kind: AuthFailureKind;
  title: string;
  message: string;
  hint?: string;
  adminNote?: string;
  fallback?: 'email' | 'password' | 'google' | 'none';
  fatalUntilFixed?: boolean;
}

export const DEFAULT_COUNTRY_CODE_DIGITS = '91';
export const DEFAULT_COUNTRY_CODE = '+91';
export const PHONE_OTP_ENABLED = false;
export const OTP_RESEND_COOLDOWN_MS = 60000;
export const SUPABASE_OTP_LENGTH = 6;
export const SUPABASE_AUTH_PROVIDERS_URL = 'https://supabase.com/dashboard/project/_/auth/providers-and-otp';
export const SMS_PROVIDER_FIX_STEPS: { label: string; detail: string }[] = [];

export function preferredPhoneOtpChannel(): 'sms' | 'whatsapp' { return 'sms'; }
export function phoneOtpAllowed(): boolean { return false; }
export function isEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value||'').trim()); }
export function isE164(value: string): boolean { return false; }
export function toE164Phone(raw: string) { return { value: '', ok: false, error: 'Phone auth is disabled. Use Gmail/Email + Password.' }; }
export function parseAuthIdentifier(raw: string) {
  const input = (raw||'').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input) return { kind: 'invalid' as const, value: '', display: '', error: 'Enter your Gmail / Email address.' };
  if (emailRegex.test(input)) return { kind: 'email' as const, value: input, display: input };
  return { kind: 'invalid' as const, value: input, display: input, error: 'Please enter a valid Gmail / Email address. Phone & OTP are disabled.' };
}
export function formatPhoneForDisplay(e164: string): string { return e164; }
export function classifyAuthError(error: unknown, channel: OtpChannel = 'email'): AuthFailure {
  return { kind: 'unknown', title: 'Auth disabled', message: 'Phone/OTP auth is disabled. Use Email + Password.', fallback: 'password' };
}
export function localAuthFailure(kind: AuthFailureKind, message?: string): AuthFailure {
  return { kind, title: 'Auth', message: message || 'Phone auth disabled. Use Email + Password.' };
}
export function readPhoneCapability(): PhoneCapabilityRecord { return { state: 'disabled', reason: 'Phone OTP disabled - Email+Password only' }; }
export function writePhoneCapability(record: PhoneCapabilityRecord): void {}
export function clearPhoneCapability(): void {}
