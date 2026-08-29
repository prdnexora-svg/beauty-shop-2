// ============================================================================
// NEXORA LUXE — MEDIA CONFIGURATION & VALIDATION
//
// Single source of truth for every storage bucket, size/MIME limit and object
// path convention used by the app. The server-side copy of these rules lives
// in `src/db/migrations/0005_media_storage.sql` (bucket `file_size_limit` +
// `allowed_mime_types`). Keep the two in sync: the client rules exist to give
// users instant feedback, the SQL rules are the ones that actually enforce.
// ============================================================================

import { ENV, hasRealSupabaseCredentials } from './env';

// ---------------------------------------------------------------------------
// BUCKET REGISTRY
// ---------------------------------------------------------------------------

export type MediaBucketId =
  | 'avatars'
  | 'product-media'
  | 'ad-creatives'
  | 'videos'
  | 'documents';

export type MediaKind = 'image' | 'video' | 'document';

/**
 * What a bucket is allowed to hold, who can read it, and the scopes that may
 * write to it. `visibility` mirrors `storage.buckets.public`.
 */
export interface BucketSpec {
  id: MediaBucketId;
  label: string;
  /** `public` => getPublicUrl() works for anonymous visitors. */
  visibility: 'public' | 'private';
  /** Media kinds accepted by this bucket. */
  kinds: MediaKind[];
  /** Hard byte cap enforced client-side before any network call. */
  maxBytes: number;
  /** Accepted MIME types (must be a subset of the SQL allow-list). */
  mimeTypes: string[];
  /** Accepted file extensions, shown in the picker and checked as a fallback
   *  because some browsers report an empty `File.type`. */
  extensions: string[];
  description: string;
}

const MB = 1024 * 1024;

export const IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;

export const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export const DOCUMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MEDIA_BUCKETS: Record<MediaBucketId, BucketSpec> = {
  avatars: {
    id: 'avatars',
    label: 'Profile photos & banners',
    visibility: 'public',
    kinds: ['image'],
    maxBytes: 5 * MB,
    mimeTypes: [...IMAGE_MIMES],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'],
    description: 'Buyer/supplier avatars and cover banners. Readable by anyone.',
  },
  'product-media': {
    id: 'product-media',
    label: 'Product & catalogue images',
    visibility: 'public',
    kinds: ['image'],
    maxBytes: 10 * MB,
    mimeTypes: [...IMAGE_MIMES],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'],
    description: 'Product gallery images shown on public marketplace listings.',
  },
  'ad-creatives': {
    id: 'ad-creatives',
    label: 'Sponsored ad creatives',
    visibility: 'public',
    kinds: ['image'],
    maxBytes: 10 * MB,
    mimeTypes: [...IMAGE_MIMES],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'],
    description: 'Banner images and video poster frames for sponsored campaigns.',
  },
  videos: {
    id: 'videos',
    label: 'Videos, reels & posters',
    visibility: 'public',
    kinds: ['video', 'image'],
    maxBytes: 200 * MB,
    mimeTypes: [...VIDEO_MIMES, ...IMAGE_MIMES],
    extensions: ['.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp'],
    description: 'Self-hosted reels, facility tours and their poster images.',
  },
  documents: {
    id: 'documents',
    label: 'Compliance & RFQ documents',
    visibility: 'private',
    kinds: ['document', 'image'],
    maxBytes: 25 * MB,
    mimeTypes: [...DOCUMENT_MIMES],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.zip', '.doc', '.docx'],
    description:
      'GST/ISO certificates, verification proofs and RFQ attachments. Private — served only through short-lived signed URLs.',
  },
};

export const ALL_BUCKETS: BucketSpec[] = Object.values(MEDIA_BUCKETS);

// ---------------------------------------------------------------------------
// UPLOAD SCOPES
//
// A `scope` is the second path segment and identifies *why* an object exists.
// It lets the media library filter ("show me my verification certificates")
// without a join, and keeps unrelated uploads from colliding.
// ---------------------------------------------------------------------------

export type MediaScope =
  | 'avatar'
  | 'cover'
  | 'product'
  | 'post'
  | 'ad-creative'
  | 'video'
  | 'video-poster'
  | 'compliance'
  | 'attachment'
  | 'verification'
  | 'general';

export interface ScopeSpec {
  scope: MediaScope;
  bucket: MediaBucketId;
  kinds: MediaKind[];
  /** Overrides the bucket default when a scope needs a tighter cap. */
  maxBytes?: number;
  /** Restricts MIME types further than the bucket allows. */
  mimeTypes?: string[];
  extensions?: string[];
  /** Max images/videos accepted by a multi-file picker for this scope. */
  maxFiles?: number;
  label: string;
}

export const MEDIA_SCOPES: Record<MediaScope, ScopeSpec> = {
  avatar:        { scope: 'avatar',        bucket: 'avatars',       kinds: ['image'], maxFiles: 1, label: 'Profile photo' },
  cover:         { scope: 'cover',         bucket: 'avatars',       kinds: ['image'], maxFiles: 1, label: 'Cover banner' },
  product:       { scope: 'product',       bucket: 'product-media', kinds: ['image'], maxFiles: 10, label: 'Product image' },
  post:          { scope: 'post',          bucket: 'product-media', kinds: ['image'], maxFiles: 4, label: 'Timeline post image' },
  'ad-creative': { scope: 'ad-creative',   bucket: 'ad-creatives',  kinds: ['image'], maxFiles: 1, label: 'Ad creative / poster' },
  video:         { scope: 'video',         bucket: 'videos',        kinds: ['video'], maxFiles: 1, label: 'Video file' },
  'video-poster':{ scope: 'video-poster',  bucket: 'videos',        kinds: ['image'], maxFiles: 1, label: 'Video poster' },
  compliance:    { scope: 'compliance',    bucket: 'documents',     kinds: ['document', 'image'], maxFiles: 5, label: 'Compliance document' },
  verification:  { scope: 'verification',  bucket: 'documents',     kinds: ['document', 'image'], maxFiles: 5, label: 'Verification proof' },
  attachment:    { scope: 'attachment',    bucket: 'documents',     kinds: ['document', 'image'], maxFiles: 5, label: 'Enquiry / RFQ attachment' },
  general:       { scope: 'general',       bucket: 'product-media', kinds: ['image'], maxFiles: 5, label: 'General media' },
};

// ---------------------------------------------------------------------------
// RUNTIME CAPABILITY CHECK
// ---------------------------------------------------------------------------

/**
 * True when real Supabase credentials exist. When false the app runs in local
 * demo mode: uploads are kept in-browser only and labelled as such — they are
 * never presented as persisted server-side media.
 */
export function isStorageConfigured(): boolean {
  return hasRealSupabaseCredentials();
}

// ---------------------------------------------------------------------------
// PATH CONVENTION
//
//   <bucket>/<ownerId>/<scope>/<yyyy>/<mm>/<safeName>-<random>.<ext>
//
// The first segment MUST be the owner's auth uid — every storage write policy
// in 0005 compares against it. Never build a path with a hardcoded id.
// ---------------------------------------------------------------------------

export function sanitizeFileName(name: string): string {
  const withoutDirs = (name || 'file').split(/[\\/]/).pop() || 'file';

  // Split the extension off first so dots inside the name cannot smuggle in
  // extra path segments or double extensions.
  const lastDot = withoutDirs.lastIndexOf('.');
  const base = lastDot > 0 ? withoutDirs.slice(0, lastDot) : withoutDirs;
  const ext = lastDot > 0 ? withoutDirs.slice(lastDot) : '';

  const cleanBase = base
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const cleanExt = ext.replace(/[^\w.]/g, '').toLowerCase();

  return `${cleanBase || 'file'}${cleanExt}`.slice(0, 80) || 'file';
}

export function extensionOf(name: string, mimeType?: string): string {
  const fromName = (name || '').includes('.')
    ? (name.split('.').pop() || '').toLowerCase()
    : '';
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return `.${fromName}`;
  const byMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  };
  return mimeType ? byMime[mimeType] || '.bin' : '.bin';
}

/** Short, collision-resistant suffix (not security-sensitive). */
function randomSuffix(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().split('-')[0];
  }
  return Math.random().toString(36).slice(2, 10);
}

export interface BuildPathInput {
  ownerId: string;
  scope: MediaScope;
  fileName: string;
  mimeType?: string;
  now?: Date;
}

export function buildObjectPath({
  ownerId,
  scope,
  fileName,
  mimeType,
  now = new Date(),
}: BuildPathInput): string {
  if (!ownerId) {
    throw new Error('buildObjectPath: ownerId is required (storage policies key on it).');
  }
  if (!/^[0-9a-f-]{8,}$/i.test(ownerId) || /\.\./.test(ownerId) || ownerId.includes('/')) {
    throw new Error('buildObjectPath: ownerId looks malformed.');
  }
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const base = sanitizeFileName(fileName).replace(/\.[a-z0-9]{2,5}$/i, '');
  const ext = extensionOf(fileName, mimeType);
  return `${ownerId}/${scope}/${year}/${month}/${base}-${randomSuffix()}${ext}`;
}

/** First path segment — the owner id enforced by storage policies. */
export function ownerSegmentOf(path: string): string | null {
  const seg = (path || '').split('/')[0];
  return seg || null;
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

export type MediaValidationCode =
  | 'no_file'
  | 'empty_file'
  | 'too_large'
  | 'bad_type'
  | 'bad_extension'
  | 'content_mismatch'
  | 'too_many_files'
  | 'unauthenticated';

export interface MediaValidationError {
  code: MediaValidationCode;
  message: string;
  fileName: string;
  /** Value that broke the rule (e.g. byte size), for error messages. */
  detail?: string;
}

export interface MediaValidationResult {
  ok: boolean;
  error?: MediaValidationError;
  /** Media kind inferred from MIME/extension. */
  kind?: MediaKind;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Infer the media kind from MIME type, falling back to the extension. */
export function detectMediaKind(file: { type?: string; name?: string }): MediaKind | null {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || '';
  const extMap: Record<string, MediaKind> = {
    jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', avif: 'image', gif: 'image',
    mp4: 'video', webm: 'video', mov: 'video', m4v: 'video',
    pdf: 'document', zip: 'document', doc: 'document', docx: 'document',
  };
  return extMap[ext] || null;
}

/** Resolve the effective limits for a scope (scope override > bucket default). */
export function limitsForScope(scope: MediaScope) {
  const spec = MEDIA_SCOPES[scope];
  const bucket = MEDIA_BUCKETS[spec.bucket];
  return {
    scope: spec,
    bucket,
    maxBytes: spec.maxBytes ?? bucket.maxBytes,
    mimeTypes: spec.mimeTypes ?? bucket.mimeTypes,
    extensions: spec.extensions ?? bucket.extensions,
    maxFiles: spec.maxFiles ?? 1,
  };
}

/**
 * Validate one file against a scope. Synchronous — no I/O — so it can run on
 * every drag/drop and file-picker change.
 */
export function validateFileForScope(
  file: File | null | undefined,
  scope: MediaScope,
): MediaValidationResult {
  const fileName = file?.name || 'file';

  if (!file) {
    return { ok: false, error: { code: 'no_file', message: 'No file was selected.', fileName } };
  }
  if (file.size <= 0) {
    return {
      ok: false,
      error: { code: 'empty_file', message: 'That file is empty (0 bytes).', fileName },
    };
  }

  const { bucket, maxBytes, mimeTypes, extensions, scope: spec } = limitsForScope(scope);

  const kind = detectMediaKind(file);
  if (!kind || !spec.kinds.includes(kind)) {
    return {
      ok: false,
      error: {
        code: 'bad_type',
        message: `${spec.label} accepts ${spec.kinds.join(' or ')} files only.`,
        fileName,
        detail: file.type || 'unknown type',
      },
    };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: {
        code: 'too_large',
        message: `"${fileName}" is ${formatBytes(file.size)}. The limit for ${spec.label.toLowerCase()} is ${formatBytes(maxBytes)}.`,
        fileName,
        detail: String(file.size),
      },
    };
  }

  // Some browsers leave `type` empty for uncommon formats; fall back to ext.
  if (file.type) {
    if (!mimeTypes.includes(file.type.toLowerCase())) {
      return {
        ok: false,
        error: {
          code: 'bad_type',
          message: `${file.type} is not accepted. Allowed: ${extensions.join(', ')}.`,
          fileName,
          detail: file.type,
        },
      };
    }
  } else {
    const ext = `.${(fileName.split('.').pop() || '').toLowerCase()}`;
    if (!extensions.includes(ext)) {
      return {
        ok: false,
        error: {
          code: 'bad_extension',
          message: `Unsupported file type "${ext}". Allowed: ${extensions.join(', ')}.`,
          fileName,
          detail: ext,
        },
      };
    }
  }

  return { ok: true, kind };
}

/** Accept-list used on <input type="file"> elements. */
export function acceptStringForScope(scope: MediaScope): string {
  const { mimeTypes, extensions } = limitsForScope(scope);
  return [...mimeTypes, ...extensions].join(',');
}

/** Human-readable rule summary rendered under upload widgets. */
export function constraintsHintForScope(scope: MediaScope): string {
  const { maxBytes, extensions, maxFiles } = limitsForScope(scope);
  const list = extensions.join(', ').toUpperCase();
  return maxFiles > 1
    ? `${list} · up to ${formatBytes(maxBytes)} each · max ${maxFiles} files`
    : `${list} · up to ${formatBytes(maxBytes)}`;
}

// ---------------------------------------------------------------------------
// MAGIC-BYTE SNIFFING
//
// `File.type` is supplied by the OS/browser and is trivially spoofable. This is
// a best-effort content check that catches renamed executables and mislabelled
// media before we spend bandwidth uploading them. It is NOT a security control
// on its own — the storage bucket MIME allow-list is.
// ---------------------------------------------------------------------------

export interface SniffResult {
  ok: boolean;
  /** Detected kind, when the header is recognised. */
  kind?: MediaKind;
  message?: string;
}

export async function sniffFileHeader(file: File): Promise<SniffResult> {
  try {
    const header = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(header);
    const ascii = (offset: number, text: string) => {
      for (let i = 0; i < text.length; i += 1) {
        if (bytes[offset + i] !== text.charCodeAt(i)) return false;
      }
      return true;
    };

    // Images
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ok: true, kind: 'image' };
    if (bytes[0] === 0x89 && ascii(1, 'PNG')) return { ok: true, kind: 'image' };
    if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { ok: true, kind: 'image' };
    if (ascii(0, 'GIF8')) return { ok: true, kind: 'image' };
    if (ascii(4, 'ftyp') && (ascii(8, 'avif') || ascii(8, 'avis') || ascii(8, 'mif1'))) {
      return { ok: true, kind: 'image' };
    }
    // Videos: ISO-BMFF (mp4/mov) and Matroska/WebM
    if (ascii(4, 'ftyp')) return { ok: true, kind: 'video' };
    if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
      return { ok: true, kind: 'video' };
    }
    // Documents
    if (ascii(0, '%PDF-')) return { ok: true, kind: 'document' };
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return { ok: true, kind: 'document' }; // zip/docx
    if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
      return { ok: true, kind: 'document' }; // legacy .doc
    }
    return {
      ok: false,
      message: `"${file.name}" does not look like a valid image, video or document.`,
    };
  } catch {
    // Unreadable header — don't block the upload on a sniffing failure.
    return { ok: true };
  }
}

/** Full check: scope rules + magic bytes. */
export async function validateFileDeep(
  file: File | null | undefined,
  scope: MediaScope,
): Promise<MediaValidationResult> {
  const base = validateFileForScope(file, scope);
  if (!base.ok || !file) return base;

  const sniff = await sniffFileHeader(file);
  if (!sniff.ok) {
    return {
      ok: false,
      error: {
        code: 'content_mismatch',
        message: sniff.message || 'File contents do not match its type.',
        fileName: file.name,
      },
    };
  }
  if (sniff.kind && base.kind && sniff.kind !== base.kind) {
    return {
      ok: false,
      error: {
        code: 'content_mismatch',
        message: `"${file.name}" is declared as ${base.kind} but its contents are ${sniff.kind}.`,
        fileName: file.name,
      },
    };
  }
  return base;
}

// ---------------------------------------------------------------------------
// URL HELPERS
// ---------------------------------------------------------------------------

export function supabaseStorageObjectUrl(baseUrl: string, bucket: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

export function supabaseStoragePublicUrl(baseUrl: string, bucket: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

/**
 * Recognise URLs that point at our own Supabase storage. Used by the media
 * pipeline to decide whether an asset needs a signed URL, and by video players
 * to pick native playback over an external-platform embed.
 */
export function parseStorageUrl(
  url: string | null | undefined,
  baseUrl: string,
): { bucket: string; path: string } | null {
  if (!url || !baseUrl) return null;
  const prefix = `${baseUrl.replace(/\/$/, '')}/storage/v1/object/`;
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length);
  const match = rest.match(/^(?:public\/)?([^/]+)\/(.+)$/);
  if (!match) return null;
  return {
    bucket: decodeURIComponent(match[1]),
    path: match[2].split('/').map(decodeURIComponent).join('/'),
  };
}

/**
 * True when a URL points at our own Supabase Storage. Used to switch video
 * surfaces from a platform embed to native playback.
 */
export function isSelfHostedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const baseUrl = ENV.SUPABASE_URL;
  if (!baseUrl) return false;
  return parseStorageUrl(url, baseUrl) !== null;
}

/** Signed URLs expire — this is how long we cache them for. */
export const SIGNED_URL_TTL_SECONDS = 3600;
/** Refresh signed URLs this long before they actually expire. */
export const SIGNED_URL_REFRESH_MARGIN_MS = 5 * 60 * 1000;
