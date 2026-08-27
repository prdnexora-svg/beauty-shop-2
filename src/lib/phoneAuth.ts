// ============================================================================
// NEXORA LUXE — PHONE / SMS OTP PLUMBING
// ============================================================================
//
// Why this file exists
// --------------------
// The login modal offers "Mobile OTP". That request goes to Supabase Auth
// (GoTrue) at `POST /auth/v1/otp`, and GoTrue then hands the message to
// whichever SMS provider is configured for the project (Twilio, Twilio
// Verify, MessageBird, TextLocal, Vonage, Amazon SNS, custom SMS ...).
//
// If the project has NO SMS provider configured — which is the default state
// of every fresh Supabase project — GoTrue answers:
//
//     "Unsupported phone provider"
//
// That is a project-configuration problem, not a user mistake, but before this
// module existed it reached the screen as that raw string with no explanation,
// no recovery path, and it left the OTP entry box stuck open. Related config
// errors ("Phone signups not allowed", E.164 rejections, SMS rate limits) were
// dumped the same way.
//
// What lives here
// ---------------
// 1. `toE164Phone()` — normalises "+91 98201 54321", "098201-54321" or
//    "91 9820154321" into the only shape GoTrue accepts: "+919820154321".
//    Un-normalised input is the other reason phone OTP silently fails.
// 2. `classifyAuthError()` — maps GoTrue/auth-js failures onto a small union
//    so the UI can explain the problem and offer a working fallback instead of
//    a dead end.
// 3. A per-tab capability cache — once we learn SMS delivery is not wired up,
//    the sign-in form says so up front and stops burning the user's rate-limit
//    budget on a call that cannot succeed.
// ============================================================================

export type OtpChannel = 'sms' | 'whatsapp' | 'email';

// ----------------------------------------------------------------------------
// Environment switches (all optional — sensible defaults for the India-first
// B2B demo, see .env.example for the documented list)
// ----------------------------------------------------------------------------

function readEnv(key: string): string {
  // import.meta.env is static under Vite, but this module is also imported by
  // tooling/tests where `import.meta.env` may be undefined.
  const env = (import.meta as any)?.env as Record<string, string | undefined> | undefined;
  return (env?.[key] ?? '').trim();
}

function readBoolEnv(key: string, fallback: boolean): boolean {
  const value = readEnv(key).toLowerCase();
  if (!value) return fallback;
  return value === 'true' || value === '1' || value === 'on' || value === 'yes';
}

function normalizeCountryCodeDigits(raw: string): string {
  const digits = (raw || '').replace(/[^\d]/g, '');
  if (!digits || digits.length > 3) return '91'; // India, by product design.
  return digits;
}

/** Digits of the dial-in code used to complete national numbers, e.g. "91". */
export const DEFAULT_COUNTRY_CODE_DIGITS = normalizeCountryCodeDigits(
  readEnv('VITE_AUTH_DEFAULT_COUNTRY_CODE'),
);

export const DEFAULT_COUNTRY_CODE = `+${DEFAULT_COUNTRY_CODE_DIGITS}`;

/**
 * Kill switch for the whole SMS path. Set VITE_AUTH_PHONE_OTP_ENABLED="false"
 * when the project has no SMS provider (or no DLT registration, as required
 * for transactional SMS in India) and you want the UI to offer email /
 * password / Google only — no doomed network calls, no confusing errors.
 */
export const PHONE_OTP_ENABLED = readBoolEnv('VITE_AUTH_PHONE_OTP_ENABLED', true);

/** Delivery channel for phone OTP. GoTrue accepts sms|whatsapp (whatsapp needs Twilio/Twilio Verify). */
const OTP_CHANNEL_SETTING = (() => {
  const value = readEnv('VITE_AUTH_OTP_CHANNEL').toLowerCase();
  return value === 'whatsapp' ? ('whatsapp' as const) : ('sms' as const);
})();

export function preferredPhoneOtpChannel(): 'sms' | 'whatsapp' {
  return OTP_CHANNEL_SETTING;
}

export function phoneOtpAllowed(): boolean {
  return PHONE_OTP_ENABLED;
}

// ----------------------------------------------------------------------------
// Identifier parsing / E.164 normalisation
// ----------------------------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const E164_PATTERN = /^\+\d{8,15}$/;
const MAX_E164_DIGITS = 15;
const MIN_PHONE_DIGITS = 8;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test((value || '').trim());
}

export function isE164(value: string): boolean {
  return E164_PATTERN.test((value || '').trim());
}

export interface NormalizedPhone {
  /** E.164 (`+919820154321`) or '' when the input cannot be a phone number. */
  value: string;
  ok: boolean;
  /** Human reason for rejection, safe to render. */
  error?: string;
}

/**
 * Best-effort conversion of whatever a user typed into an E.164 number.
 *
 * Accepted: +919820154321 · +91 98201 54321 · 0091-9820154321 · 09820154321
 *           9820154321 · 91 9820154321
 *
 * GoTrue rejects anything else with "Phone number should be in E.164 format",
 * so this normalisation is mandatory, not cosmetic.
 */
export function toE164Phone(raw: string): NormalizedPhone {
  const input = (raw || '').trim();
  if (!input) return { value: '', ok: false, error: 'Enter your mobile number.' };
  if (/[a-zA-Z]/.test(input)) {
    return { value: '', ok: false, error: 'Mobile numbers can only contain digits and +.' };
  }

  const cc = DEFAULT_COUNTRY_CODE_DIGITS;
  // Indian mobile numbers are exactly 10 digits; for other default country
  // codes we accept the common 7-11 national range rather than guessing hard.
  const [nationalLenMin, nationalLenMax] = cc === '91' ? [10, 10] : [7, 11];

  const hadPlus = input.trim().startsWith('+');
  let digits = input.replace(/[^\d]/g, '');

  if (!hadPlus) {
    if (digits.startsWith('00')) {
      // "00 91 98201..." — the international dialling prefix, not a trunk zero.
      digits = digits.slice(2).replace(/^0+/, '');
    } else {
      // "098201..." — India's trunk prefix.
      digits = digits.replace(/^0+/, '');
    }

    const alreadyCarriesCountryCode = digits.startsWith(cc) && digits.length > nationalLenMax;
    const looksNational =
      digits.length >= nationalLenMin && digits.length <= nationalLenMax && !digits.startsWith('0');

    if (!alreadyCarriesCountryCode && (looksNational || digits.length < nationalLenMin)) {
      digits = `${cc}${digits}`;
    }
  }

  digits = digits.replace(/^0+/, '');
  const candidate = `+${digits}`;

  if (digits.length > MAX_E164_DIGITS) {
    return { value: '', ok: false, error: 'That number is too long. Include the country code, e.g. +91 98201 54321.' };
  }
  if (digits.length < MIN_PHONE_DIGITS || !isE164(candidate)) {
    return {
      value: '',
      ok: false,
      error: `Enter a valid ${DEFAULT_COUNTRY_CODE_DIGITS === '91' ? '10-digit Indian' : 'mobile'} number (without spaces).`,
    };
  }
  return { value: candidate, ok: true };
}

export type ParsedIdentifier =
  | { kind: 'email'; value: string; display: string }
  | { kind: 'phone'; value: string; display: string }
  | { kind: 'invalid'; value: string; display: string; error: string };

/**
 * The sign-in field accepts an email or a mobile number. Resolve which one it
 * is, and normalise it, before any network call happens.
 */
export function parseAuthIdentifier(raw: string): ParsedIdentifier {
  const input = (raw || '').trim();
  if (!input) {
    return { kind: 'invalid', value: '', display: '', error: 'Enter your mobile number or email.' };
  }

  if (input.includes('@')) {
    const email = input.toLowerCase();
    if (!isEmail(email)) {
      return { kind: 'invalid', value: email, display: email, error: 'Enter a valid business email address.' };
    }
    return { kind: 'email', value: email, display: email };
  }

  const phone = toE164Phone(input);
  if (!phone.ok) {
    return { kind: 'invalid', value: input, display: input, error: phone.error ?? 'Enter a valid mobile number.' };
  }
  return { kind: 'phone', value: phone.value, display: phone.value };
}

/** Pretty print for confirmation copy: +919820154321 -> +91 98201 54321. */
export function formatPhoneForDisplay(e164: string): string {
  const value = (e164 || '').trim();
  const cc = DEFAULT_COUNTRY_CODE_DIGITS;
  // Group only the market we actually format for; anything else is shown as the
  // exact E.164 value so users can still proofread what we sent.
  if (isE164(value) && value.startsWith(`+${cc}`) && value.length === cc.length + 11) {
    return `${DEFAULT_COUNTRY_CODE} ${value.slice(1 + cc.length, 6 + cc.length)} ${value.slice(6 + cc.length)}`;
  }
  return value;
}

// ----------------------------------------------------------------------------
// GoTrue error classification
// ----------------------------------------------------------------------------

export type AuthFailureKind =
  /** SMS provider missing/misconfigured on the Supabase project ("Unsupported phone provider"). */
  | 'sms_provider_unavailable'
  /** Phone sign-in / sign-up toggles are off in the project's auth settings. */
  | 'phone_disabled'
  | 'email_disabled'
  | 'invalid_phone'
  | 'invalid_email'
  | 'invalid_otp'
  | 'rate_limited'
  /** Weak connectivity / offline: the code may still have been delivered. */
  | 'network'
  | 'credentials'
  | 'unknown';

export interface AuthFailure {
  kind: AuthFailureKind;
  /** Short headline for the alert block. */
  title: string;
  /** User-facing sentence. Never contains server jargon. */
  message: string;
  /** Optional next step for the shopper/supplier. */
  hint?: string;
  /** Only shown to whoever is running the project (never blames the user). */
  adminNote?: string;
  /** Suggested alternative sign-in path, so the flow is not a dead end. */
  fallback?: 'email' | 'password' | 'google' | 'none';
  /** True when retrying the exact same call is pointless until config changes. */
  fatalUntilFixed?: boolean;
}

/**
 * GoTrue error codes we care about. Kept as a lookup so the message matching
 * below stays readable and the codes stay documented in one place.
 */
const ERROR_CODE_HINTS: Record<string, AuthFailureKind> = {
  unsupported_phone_provider: 'sms_provider_unavailable',
  phone_provider_not_configured: 'sms_provider_unavailable',
  sms_provider_not_configured: 'sms_provider_unavailable',
  over_sms_request_limit: 'rate_limited',
  over_sms_max_frequency: 'rate_limited',
  over_email_request_limit: 'rate_limited',
  rate_limit_allowed: 'rate_limited',
  invite_does_not_match: 'invalid_otp',
  otp_expired: 'invalid_otp',
  bad_otp: 'invalid_otp',
  max_frequency: 'rate_limited',
};

const SMS_PROVIDER_PATTERNS = [
  'unsupported phone provider',
  'phone provider',
  'sms provider',
  'sms service',
  'sms gateway',
  'no sms',
  'twilio',
  'vonage',
  'messagebird',
  'textlocal',
  'amazon sns',
  'not configured for sms',
];

function messageIncludes(message: string, needles: string[]): boolean {
  return needles.some((needle) => message.includes(needle));
}

/**
 * Turn an `AuthError` / `TypeError` / string from Supabase into something the
 * UI can act on. Matching is deliberately loose: GoTrue's copy has changed
 * several times across releases, so we match on keywords rather than exact
 * sentences.
 */
export function classifyAuthError(error: unknown, channel: OtpChannel = 'sms'): AuthFailure {
  const err = error as
    | { message?: string; code?: string; error_code?: string; status?: number; name?: string }
    | string
    | null
    | undefined;

  if (!err) {
    return { kind: 'unknown', title: 'Something went wrong', message: 'We could not complete that request. Please try again.', fallback: 'none' };
  }

  const message = (typeof err === 'string' ? err : err.message || '').toLowerCase();
  const code = String((typeof err === 'object' && (err.error_code || err.code)) || '').toLowerCase();
  const name = String((typeof err === 'object' && err.name) || '').toLowerCase();
  const status = typeof err === 'object' ? err.status : undefined;
  const codedKind = ERROR_CODE_HINTS[code];

  const base: AuthFailure = codedKind
    ? { ...FAILURE_COPY[codedKind], kind: codedKind }
    : { kind: 'unknown', title: 'Sign in failed', message: message || 'Please try again.', fallback: 'none' };

  // --- SMS / phone provider is missing on the project -----------------------
  if (
    codedKind === 'sms_provider_unavailable'
    || messageIncludes(message, SMS_PROVIDER_PATTERNS)
    || (status === 500 && (message.includes('sms') || message.includes('phone')))
  ) {
    return { ...FAILURE_COPY.sms_provider_unavailable, kind: 'sms_provider_unavailable' };
  }

  // --- Transport problems: never blame the user, retry later ---------------
  if (
    name.includes('fetch')
    || name === 'typeerror'
    || messageIncludes(message, [
      'failed to fetch',
      'networkerror',
      'network request failed',
      'could not connect',
      'load failed',
      'err_internet_disconnected',
    ])
  ) {
    return { ...FAILURE_COPY.network, kind: 'network' };
  }

  if (codedKind) return base;

  if (messageIncludes(message, ['e.164', 'invalid phone number', 'invalid phone', 'phone number format'])) {
    return { ...FAILURE_COPY.invalid_phone, kind: 'invalid_phone' };
  }
  if (messageIncludes(message, ['invalid email address', 'enter a valid email'])) {
    return { ...FAILURE_COPY.invalid_email, kind: 'invalid_email' };
  }
  if (
    messageIncludes(message, [
      'phone signups',
      'phone signup is not enabled',
      'signups not allowed for otp',
      'signup is not enabled',
      'otp is not enabled',
      'external phone',
    ])
  ) {
    return {
      ...FAILURE_COPY.phone_disabled,
      kind: channel === 'email' ? 'email_disabled' : 'phone_disabled',
    };
  }
  if (messageIncludes(message, ['too many requests', 'rate limit', 'for 60 more seconds', 'max frequency'])) {
    return { ...FAILURE_COPY.rate_limited, kind: 'rate_limited' };
  }
  if (
    messageIncludes(message, [
      'invalid or expired one-time token',
      'token has expired',
      'expired after',
      'invalid otp',
      'user not found',
    ])
  ) {
    return { ...FAILURE_COPY.invalid_otp, kind: 'invalid_otp' };
  }
  if (messageIncludes(message, ['invalid login credentials', 'incorrect password'])) {
    return { ...FAILURE_COPY.credentials, kind: 'credentials' };
  }

  return base.kind === 'unknown'
    ? { kind: 'unknown', title: 'Sign in failed', message: message || 'Please try again.', fallback: 'none' }
    : base;
}

// Copy table used by classifyAuthError(). Declared after it on purpose — the
// function only reads it at call time.
const FAILURE_COPY: Record<AuthFailureKind, Omit<AuthFailure, 'kind'>> = {
  sms_provider_unavailable: {
    title: 'Text-message sign-in is not available yet',
    message:
      'Nexora could not send a one-time code because this workspace has no SMS delivery provider connected to Supabase Auth. Your account is fine — the text-message channel is not switched on.',
    hint: 'Continue with an emailed code, a password, or Google while this is set up.',
    adminNote:
      'Supabase answers `POST /auth/v1/otp` with "Unsupported phone provider" until an SMS provider is configured. Add Twilio / Twilio Verify / MessageBird / Vonage / TextLocal (or a custom provider) under Authentication -> Sign In / Providers -> Phone, or keep VITE_AUTH_PHONE_OTP_ENABLED="false". For local testing, add a [auth.sms.test_otp] phone -> code mapping in config.toml.',
    fallback: 'email',
    fatalUntilFixed: true,
  },
  phone_disabled: {
    title: 'Phone sign-in is switched off',
    message: 'This workspace does not accept phone numbers for sign-in or sign-up right now.',
    hint: 'Use your business email instead, or ask an admin to enable Phone under Supabase Auth providers.',
    adminNote: 'Enable "Phone" sign-ins under Authentication -> Sign In / Providers in the Supabase dashboard.',
    fallback: 'email',
    fatalUntilFixed: true,
  },
  email_disabled: {
    title: 'Email sign-in is switched off',
    message: 'This workspace does not accept email verification codes right now.',
    hint: 'Use your password or Google, or ask an admin to enable Email under Supabase Auth providers.',
    adminNote: 'Enable "Email" (OTP / magic link) under Authentication -> Sign In / Providers in the Supabase dashboard.',
    fallback: 'password',
    fatalUntilFixed: true,
  },
  invalid_phone: {
    title: 'Check the mobile number',
    message: 'We need the full number with a country code, for example +91 98201 54321.',
    fallback: 'none',
  },
  invalid_email: {
    title: 'Check the email address',
    message: 'That email address does not look complete.',
    fallback: 'none',
  },
  invalid_otp: {
    title: 'That code did not work',
    message: 'The code is wrong or has expired. Request a fresh one and enter all six digits.',
    hint: 'Codes expire quickly — check you are using the most recent one.',
    fallback: 'none',
  },
  rate_limited: {
    title: 'Too many requests',
    message: 'You have requested codes a few times in quick succession. Please wait a minute before trying again.',
    hint: 'Waiting keeps SMS costs and abuse-prevention limits under control.',
    fallback: 'password',
  },
  network: {
    title: 'We could not reach the server',
    message: 'Your connection dropped before the code could be requested.',
    hint: 'Check your internet connection and try again. If a code did arrive, enter it — it stays valid for a few minutes.',
    fallback: 'none',
  },
  credentials: {
    title: 'Email or password is incorrect',
    message: 'We could not match that email and password. Please try again.',
    hint: 'You can request a one-time code instead if you have forgotten the password.',
    fallback: 'email',
  },
  unknown: {
    title: 'Sign in failed',
    message: 'Something went wrong while contacting the auth service. Please try again.',
    fallback: 'none',
  },
};

/**
 * Build a failure for problems we detect before any network call (bad phone,
 * SMS path disabled by config). Reuses the copy table so the alert styling and
 * fallback suggestions stay consistent with server-side failures.
 */
export function localAuthFailure(
  kind: Extract<AuthFailureKind, 'invalid_phone' | 'invalid_email' | 'sms_provider_unavailable' | 'phone_disabled'>,
  message?: string,
): AuthFailure {
  const copy = FAILURE_COPY[kind];
  return { kind, ...copy, message: message ?? copy.message };
}

// ----------------------------------------------------------------------------
// Per-tab capability cache for the SMS channel
// ----------------------------------------------------------------------------

export type PhoneCapability = 'unknown' | 'available' | 'unavailable' | 'disabled';

export interface PhoneCapabilityRecord {
  state: PhoneCapability;
  reason?: string;
  checkedAt?: number;
}

const CAPABILITY_STORAGE_KEY = 'nexora.auth.phone_capability';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function readPhoneCapability(): PhoneCapabilityRecord {
  if (!phoneOtpAllowed()) {
    return { state: 'disabled', reason: 'VITE_AUTH_PHONE_OTP_ENABLED is off' };
  }
  if (!canUseStorage()) return { state: 'unknown' };
  try {
    const raw = window.sessionStorage.getItem(CAPABILITY_STORAGE_KEY);
    if (!raw) return { state: 'unknown' };
    const parsed = JSON.parse(raw) as PhoneCapabilityRecord;
    if (parsed && (parsed.state === 'available' || parsed.state === 'unavailable' || parsed.state === 'disabled')) {
      return parsed;
    }
    return { state: 'unknown' };
  } catch {
    // Corrupt or unavailable storage should never break sign-in.
    return { state: 'unknown' };
  }
}

export function writePhoneCapability(record: PhoneCapabilityRecord): void {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(CAPABILITY_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore quota / privacy-mode failures */
  }
}

export function clearPhoneCapability(): void {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.removeItem(CAPABILITY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ----------------------------------------------------------------------------
// Misc constants used by the sign-in UI
// ----------------------------------------------------------------------------

/** GoTrue default SMS_MAX_FREQUENCY is 60s; asking sooner is rejected anyway. */
export const OTP_RESEND_COOLDOWN_MS = 60_000;

/** Supabase issues 6-digit codes for SMS and email OTP. */
export const SUPABASE_OTP_LENGTH = 6;

export const SUPABASE_AUTH_PROVIDERS_URL =
  'https://supabase.com/dashboard/project/_/auth/providers-and-otp';

export const SMS_PROVIDER_FIX_STEPS: { label: string; detail: string }[] = [
  {
    label: 'Open Supabase -> Authentication -> Sign In / Providers',
    detail: 'Open the Providers & OTP settings of your Supabase project (link below).',
  },
  {
    label: 'Turn on "Phone", then add an SMS provider',
    detail: 'Twilio, Twilio Verify, MessageBird, Vonage or TextLocal. "Unsupported phone provider" disappears as soon as a provider with valid credentials is saved.',
  },
  {
    label: 'For India: complete DLT registration with your provider',
    detail: 'Transactional SMS needs an approved template and sender header; otherwise Twilio accepts the request but the message is never delivered.',
  },
  {
    label: 'Local development without a provider',
    detail: 'In supabase/config.toml add [auth.sms] enabled = true and a [auth.sms.test_otp] entry such as 919820154321 = "123456" (remove before production).',
  },
  {
    label: 'Or hide the SMS path',
    detail: 'Set VITE_AUTH_PHONE_OTP_ENABLED="false" and rebuild — the sign-in form then offers email code, password and Google only.',
  },
];
