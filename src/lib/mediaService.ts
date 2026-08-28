// ============================================================================
// NEXORA LUXE — MEDIA SERVICE
//
// The only place in the app that talks to Supabase Storage. Everything above
// it (hooks, uploaders, galleries) goes through these functions, so:
//   * object paths are always owner-scoped,
//   * every stored object gets a matching `media_assets` ledger row,
//   * private assets are only ever handed out as short-lived signed URLs,
//   * failures roll back instead of leaving orphan objects.
//
// Runs entirely in the browser with the anon key — the service-role key is
// never referenced here or anywhere else in `src/`.
// ============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { ENV } from './env';
import {
  MEDIA_BUCKETS,
  MEDIA_SCOPES,
  MediaBucketId,
  MediaKind,
  MediaScope,
  buildObjectPath,
  detectMediaKind,
  isStorageConfigured,
  parseStorageUrl,
  sniffFileHeader,
  supabaseStoragePublicUrl,
  validateFileForScope,
  SIGNED_URL_TTL_SECONDS,
  SIGNED_URL_REFRESH_MARGIN_MS,
} from './mediaConfig';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type MediaAssetStatus = 'uploading' | 'ready' | 'failed' | 'orphaned' | 'deleted';

export interface MediaAsset {
  id: string;
  ownerId: string;
  bucket: MediaBucketId;
  path: string;
  publicUrl: string | null;
  mediaKind: MediaKind;
  visibility: 'public' | 'private';
  scope: MediaScope;
  entityType: string | null;
  entityId: string | null;
  mimeType: string;
  byteSize: number;
  originalName: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  status: MediaAssetStatus;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  /** Demo mode only: a browser-local blob URL. Never a server URL. */
  localUrl?: string | null;
  /** True when this asset only exists in this browser (no Supabase project). */
  isLocal?: boolean;
}

export interface UploadOptions {
  file: File;
  scope: MediaScope;
  ownerId: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  /** Skip the magic-byte content check (used by the self-test). */
  skipContentCheck?: boolean;
}

export interface UploadResult {
  ok: boolean;
  asset?: MediaAsset;
  error?: string;
}

export interface ListMediaOptions {
  ownerId?: string;
  scope?: MediaScope | MediaScope[];
  entityType?: string;
  entityId?: string;
  kind?: MediaKind;
  limit?: number;
}

// ---------------------------------------------------------------------------
// ROW MAPPING
// ---------------------------------------------------------------------------

type MediaRow = Record<string, any>;

function rowToAsset(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    ownerId: row.owner_id,
    bucket: row.bucket as MediaBucketId,
    path: row.path,
    publicUrl: row.public_url ?? null,
    mediaKind: row.media_kind as MediaKind,
    visibility: row.visibility as 'public' | 'private',
    scope: (row.scope || 'general') as MediaScope,
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? null,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size || 0),
    originalName: row.original_name ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    durationSeconds:
      row.duration_seconds === null || row.duration_seconds === undefined
        ? null
        : Number(row.duration_seconds),
    status: row.status as MediaAssetStatus,
    errorMessage: row.error_message ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isLocal: false,
    localUrl: null,
  };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// AUTH TOKEN
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || null;
    const expiresAt = data?.session?.expires_at ? data.session.expires_at * 1000 : Date.now() + 60_000;
    cachedToken = token ? { token, expiresAt } : null;
    return token;
  } catch {
    return null;
  }
}

export function clearTokenCache(): void {
  cachedToken = null;
}

// ---------------------------------------------------------------------------
// PUBLIC / SIGNED URL RESOLUTION
// ---------------------------------------------------------------------------

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function supabaseUrl(): string {
  return ENV.SUPABASE_URL;
}

function anonKey(): string {
  return ENV.SUPABASE_ANON_KEY;
}

/** Public URL for a public-bucket object. No network call. */
export function publicUrlFor(bucket: MediaBucketId, path: string): string {
  return supabaseStoragePublicUrl(supabaseUrl(), bucket, path);
}

/**
 * Short-lived URL for a private object. Results are cached until shortly
 * before expiry so re-renders don't mint a new URL every frame.
 */
export async function createSignedUrl(
  bucket: MediaBucketId,
  path: string,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!isStorageConfigured()) return null;
  const key = `${bucket}/${path}`;
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > Date.now() + SIGNED_URL_REFRESH_MARGIN_MS) {
    return cached.url;
  }
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
    if (error || !data?.signedUrl) return null;
    signedUrlCache.set(key, {
      url: data.signedUrl,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** Force-refresh a signed URL (used after a 403 on playback). */
export async function refreshSignedUrl(bucket: MediaBucketId, path: string): Promise<string | null> {
  signedUrlCache.delete(`${bucket}/${path}`);
  return createSignedUrl(bucket, path);
}

export function invalidateSignedUrl(bucket: MediaBucketId, path: string): void {
  signedUrlCache.delete(`${bucket}/${path}`);
}

/**
 * Resolve an asset (or a raw storage URL) to something renderable.
 * Public bucket  -> permanent CDN URL.
 * Private bucket -> fresh signed URL.
 * Anything else  -> returned untouched (external/Unsplash/data URLs).
 */
export async function resolveMediaUrl(
  assetOrUrl: MediaAsset | string | null | undefined,
): Promise<string | null> {
  if (!assetOrUrl) return null;

  if (typeof assetOrUrl === 'object') {
    if (assetOrUrl.isLocal && assetOrUrl.localUrl) return assetOrUrl.localUrl;
    if (assetOrUrl.visibility === 'private') {
      return createSignedUrl(assetOrUrl.bucket, assetOrUrl.path);
    }
    return assetOrUrl.publicUrl || publicUrlFor(assetOrUrl.bucket, assetOrUrl.path);
  }

  const url = assetOrUrl;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  const parsed = parseStorageUrl(url, supabaseUrl());
  if (!parsed) return url;
  const bucket = parsed.bucket as MediaBucketId;
  const spec = MEDIA_BUCKETS[bucket];
  if (!spec) return url;
  if (spec.visibility === 'private') return createSignedUrl(bucket, parsed.path);
  return url;
}

// ---------------------------------------------------------------------------
// CLIENT-SIDE METADATA PROBING
// ---------------------------------------------------------------------------

export interface MediaProbe {
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export function probeImage(file: File): Promise<MediaProbe> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

export function probeVideo(file: File): Promise<MediaProbe> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    // iOS Safari needs this to allow metadata loading without user gesture.
    (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
    const done = (result: MediaProbe) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };
    video.onloadedmetadata = () => {
      done({
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        durationSeconds:
          Number.isFinite(video.duration) && video.duration > 0
            ? Number(video.duration.toFixed(2))
            : null,
      });
    };
    video.onerror = () => done({});
    setTimeout(() => done({}), 8000);
    video.src = url;
  });
}

export async function probeMedia(file: File, kind: MediaKind): Promise<MediaProbe> {
  if (kind === 'image') return probeImage(file);
  if (kind === 'video') return probeVideo(file);
  return {};
}

/**
 * Poster frame from an already-uploaded video URL. Used when a self-hosted
 * video arrives without a thumbnail: reels and ad cards need an image.
 * Best-effort — returns null when the browser cannot decode the video.
 */
export function capturePosterFromUrl(url: string, maxWidth = 720): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

    let settled = false;
    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    video.onerror = () => finish(null);
    setTimeout(() => finish(null), 12000);

    video.onloadeddata = () => {
      try {
        const target = Number.isFinite(video.duration)
          ? Math.min(0.2, Math.max(0, video.duration / 2))
          : 0.1;
        video.onseeked = () => {
          try {
            const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round((video.videoWidth || maxWidth) * scale));
            canvas.height = Math.max(1, Math.round((video.videoHeight || maxWidth) * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return finish(null);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            finish(canvas.toDataURL('image/jpeg', 0.82));
          } catch {
            finish(null);
          }
        };
        video.currentTime = target;
      } catch {
        finish(null);
      }
    };

    video.src = url;
  });
}

/**
 * Grab a poster frame from a video so reels/ad creatives get a thumbnail even
 * when the user never uploads one. Best-effort: returns null on any failure.
 */
export function captureVideoPoster(file: File, maxWidth = 720): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

    let settled = false;
    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };

    video.onerror = () => finish(null);
    setTimeout(() => finish(null), 10000);

    video.onloadeddata = () => {
      try {
        const target = Number.isFinite(video.duration)
          ? Math.min(0.2, Math.max(0, video.duration / 2))
          : 0.1;
        video.onseeked = () => {
          try {
            const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round((video.videoWidth || maxWidth) * scale);
            canvas.height = Math.round((video.videoHeight || maxWidth) * scale);
            const ctx = canvas.getContext('2d');
            if (!ctx) return finish(null);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            finish(canvas.toDataURL('image/jpeg', 0.82));
          } catch {
            finish(null);
          }
        };
        video.currentTime = target;
      } catch {
        finish(null);
      }
    };

    video.src = url;
  });
}

// ---------------------------------------------------------------------------
// UPLOAD — XHR so we get real byte-level progress (supabase-js has none)
// ---------------------------------------------------------------------------

interface XhrUploadArgs {
  bucket: MediaBucketId;
  path: string;
  file: File;
  accessToken: string | null;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

function xhrUpload({
  bucket,
  path,
  file,
  accessToken,
  onProgress,
  signal,
}: XhrUploadArgs): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const endpoint = `${supabaseUrl().replace(/\/$/, '')}/storage/v1/object/${bucket}/${path
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken || anonKey()}`);
    xhr.setRequestHeader('apikey', anonKey());
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('cache-control', 'max-age=3600');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(percent);
      };
    }

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        resolve({ ok: false, error: 'Upload cancelled.' });
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ ok: true });
        return;
      }
      let message = `Upload failed (HTTP ${xhr.status}).`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        message = parsed?.message || parsed?.error || message;
      } catch {
        if (xhr.responseText) message = xhr.responseText.slice(0, 200);
      }
      resolve({ ok: false, error: message });
    };

    xhr.onerror = () =>
      resolve({ ok: false, error: 'Network error during upload. Check your connection.' });
    xhr.ontimeout = () => resolve({ ok: false, error: 'Upload timed out.' });
    xhr.onabort = () => resolve({ ok: false, error: 'Upload cancelled.' });

    xhr.timeout = 10 * 60 * 1000; // 10 min — large videos on slow Indian mobile networks
    xhr.send(file);
  });
}

// ---------------------------------------------------------------------------
// DEMO (LOCAL) STORE
//
// With no Supabase project configured, uploads still need to behave like real
// uploads for demos: preview, progress, replace, delete. Blobs live in
// IndexedDB so they survive a reload, and every asset is flagged `isLocal`
// so the UI can label it honestly instead of claiming it was uploaded.
// ---------------------------------------------------------------------------

const DEMO_DB_NAME = 'nexora_media_demo';
const DEMO_STORE = 'blobs';
const DEMO_INDEX_KEY = 'nexora_media_demo_index';

let demoDbPromise: Promise<IDBDatabase | null> | null = null;

function openDemoDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (demoDbPromise) return demoDbPromise;
  demoDbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DEMO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DEMO_STORE)) db.createObjectStore(DEMO_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return demoDbPromise;
}

async function demoPutBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDemoDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(DEMO_STORE, 'readwrite');
      tx.objectStore(DEMO_STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function demoGetBlob(id: string): Promise<Blob | null> {
  const db = await openDemoDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DEMO_STORE, 'readonly');
      const req = tx.objectStore(DEMO_STORE).get(id);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function demoDeleteBlob(id: string): Promise<void> {
  const db = await openDemoDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(DEMO_STORE, 'readwrite');
      tx.objectStore(DEMO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

const demoObjectUrls = new Map<string, string>();

function demoIndex(): MediaAsset[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEMO_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoIndex(assets: MediaAsset[]): void {
  try {
    localStorage.setItem(DEMO_INDEX_KEY, JSON.stringify(assets));
  } catch {
    // Quota exceeded — drop the oldest half and retry once.
    try {
      localStorage.setItem(DEMO_INDEX_KEY, JSON.stringify(assets.slice(0, Math.floor(assets.length / 2))));
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new CustomEvent('nexora_media_demo_updated'));
}

/** Re-attach blob URLs for demo assets after a page reload. */
export async function hydrateDemoAssets(assets: MediaAsset[]): Promise<MediaAsset[]> {
  return Promise.all(
    assets.map(async (asset) => {
      if (!asset.isLocal) return asset;
      if (asset.localUrl && asset.localUrl.startsWith('blob:')) return asset;
      const blob = await demoGetBlob(asset.id);
      if (!blob) return asset;
      const url = URL.createObjectURL(blob);
      demoObjectUrls.set(asset.id, url);
      return { ...asset, localUrl: url };
    }),
  );
}

// ---------------------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------------------

export async function uploadMedia(options: UploadOptions): Promise<UploadResult> {
  const { file, scope, ownerId, entityType, entityId, metadata, onProgress, signal } = options;

  if (!file) return { ok: false, error: 'No file provided.' };
  if (!ownerId) {
    return { ok: false, error: 'You must be signed in to upload media.' };
  }

  const validation = validateFileForScope(file, scope);
  if (!validation.ok) return { ok: false, error: validation.error?.message || 'Invalid file.' };

  if (!options.skipContentCheck) {
    const sniff = await sniffFileHeader(file);
    if (!sniff.ok) return { ok: false, error: sniff.message || 'File contents look invalid.' };
  }
  if (signal?.aborted) return { ok: false, error: 'Upload cancelled.' };

  const spec = MEDIA_SCOPES[scope] ?? MEDIA_SCOPES.general;
  const bucketId = spec.bucket;
  const bucketSpec = MEDIA_BUCKETS[bucketId];
  const kind = validation.kind || detectMediaKind(file) || 'document';
  const path = buildObjectPath({ ownerId, scope, fileName: file.name, mimeType: file.type });

  onProgress?.(0);

  // ---- Demo mode -------------------------------------------------------
  if (!isStorageConfigured()) {
    const probe = await probeMedia(file, kind);
    const id = newId();
    await demoPutBlob(id, file);
    const localUrl = URL.createObjectURL(file);
    demoObjectUrls.set(id, localUrl);
    onProgress?.(100);

    const asset: MediaAsset = {
      id,
      ownerId,
      bucket: bucketId,
      path,
      publicUrl: null,
      mediaKind: kind,
      visibility: bucketSpec.visibility,
      scope,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      mimeType: file.type || 'application/octet-stream',
      byteSize: file.size,
      originalName: file.name,
      width: probe.width ?? null,
      height: probe.height ?? null,
      durationSeconds: probe.durationSeconds ?? null,
      status: 'ready',
      errorMessage: null,
      metadata: metadata ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      localUrl,
      isLocal: true,
    };
    writeDemoIndex([asset, ...demoIndex()]);
    return { ok: true, asset };
  }

  // ---- Real upload -----------------------------------------------------
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { ok: false, error: 'Your session expired. Please sign in again to upload.' };
  }

  const upload = await xhrUpload({ bucket: bucketId, path, file, accessToken, onProgress, signal });
  if (!upload.ok) return { ok: false, error: upload.error || 'Upload failed.' };

  const probe = await probeMedia(file, kind);
  const publicUrl = bucketSpec.visibility === 'public' ? publicUrlFor(bucketId, path) : null;

  const insertPayload = {
    owner_id: ownerId,
    bucket: bucketId,
    path,
    public_url: publicUrl,
    media_kind: kind,
    visibility: bucketSpec.visibility,
    scope,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    mime_type: file.type || 'application/octet-stream',
    byte_size: file.size,
    original_name: file.name,
    width: probe.width ?? null,
    height: probe.height ?? null,
    duration_seconds: probe.durationSeconds ?? null,
    status: 'ready',
    metadata: metadata ?? {},
  };

  const { data, error } = await supabase
    .from('media_assets')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    // The object landed but the ledger row did not: remove it so we never
    // leave unreferenced bytes in the bucket.
    await supabase.storage.from(bucketId).remove([path]).catch(() => undefined);
    return {
      ok: false,
      error: error?.message
        ? `Upload succeeded but the media record could not be saved: ${error.message}. Run migration 0005_media_storage.sql.`
        : 'Upload succeeded but the media record could not be saved.',
    };
  }

  invalidateSignedUrl(bucketId, path);
  return { ok: true, asset: rowToAsset(data) };
}

/**
 * A URL safe to persist in a profile/record (localStorage, DB text column).
 *
 * Real uploads return the permanent CDN URL. Demo uploads live in IndexedDB
 * behind a blob: URL that dies with the page, so for small images we embed a
 * downscaled data URL instead — the preview still works after a reload, and
 * the UI labels it as local demo media.
 */
export function persistableUrl(asset: MediaAsset, maxDimension = 512): Promise<string | null> {
  if (!asset.isLocal) return Promise.resolve(asset.publicUrl);
  if (asset.mediaKind !== 'image') return Promise.resolve(asset.localUrl ?? null);

  return demoGetBlob(asset.id).then(
    (blob) =>
      new Promise<string | null>((resolve) => {
        if (!blob) return resolve(asset.localUrl ?? null);
        const url = URL.createObjectURL(blob);
        downscaleToDataUrl(url, maxDimension)
          .then((dataUrl) => resolve(dataUrl || asset.localUrl || null))
          .catch(() => resolve(asset.localUrl ?? null))
          .finally(() => URL.revokeObjectURL(url));
      }),
  );
}

/** Draw an image URL into a canvas and return a JPEG data URL. */
function downscaleToDataUrl(url: string, maxDimension: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas unavailable');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export interface DeleteResult {
  ok: boolean;
  /** True when the object could not be removed and the row was flagged. */
  orphaned?: boolean;
  error?: string;
}

export async function deleteMedia(asset: MediaAsset): Promise<DeleteResult> {
  if (!asset) return { ok: false, error: 'No media selected.' };

  if (asset.isLocal) {
    const url = demoObjectUrls.get(asset.id);
    if (url) {
      URL.revokeObjectURL(url);
      demoObjectUrls.delete(asset.id);
    }
    await demoDeleteBlob(asset.id);
    writeDemoIndex(demoIndex().filter((a) => a.id !== asset.id));
    return { ok: true };
  }

  const { error: storageError } = await supabase.storage.from(asset.bucket).remove([asset.path]);

  if (storageError) {
    // Keep the row but flag it — an honest failure beats silent data loss.
    await supabase
      .from('media_assets')
      .update({
        status: 'orphaned',
        error_message: storageError.message,
      })
      .eq('id', asset.id);
    return {
      ok: false,
      orphaned: true,
      error: `Could not remove the file from storage: ${storageError.message}`,
    };
  }

  const { error: rowError } = await supabase.from('media_assets').delete().eq('id', asset.id);
  invalidateSignedUrl(asset.bucket, asset.path);
  if (rowError) {
    return { ok: true, orphaned: true, error: `File removed but record delete failed: ${rowError.message}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// REPLACE
// ---------------------------------------------------------------------------

export interface ReplaceResult {
  ok: boolean;
  asset?: MediaAsset;
  error?: string;
}

/**
 * Upload `file` and, once it is safely stored, retire `previous`.
 * The new file is always uploaded to a fresh path so the old object stays
 * readable until it is explicitly removed — no window where a profile shows
 * a broken image.
 */
export async function replaceMedia(
  previous: MediaAsset | null | undefined,
  options: UploadOptions,
): Promise<ReplaceResult> {
  const uploaded = await uploadMedia(options);
  if (!uploaded.ok || !uploaded.asset) {
    return { ok: false, error: uploaded.error || 'Replacement upload failed.' };
  }
  if (!previous) return { ok: true, asset: uploaded.asset };

  if (previous.isLocal) {
    await deleteMedia(previous);
  } else {
    try {
      const { error } = await supabase.rpc('mark_media_replaced', {
        p_old_asset_id: previous.id,
        p_new_asset_id: uploaded.asset.id,
      });
      // Fall back to a plain delete if the helper is missing.
      if (error) await deleteMedia(previous);
    } catch {
      await deleteMedia(previous);
    }
  }
  return { ok: true, asset: uploaded.asset };
}

// ---------------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------------

export async function listMedia(options: ListMediaOptions = {}): Promise<MediaAsset[]> {
  const { scope, entityType, entityId, kind, limit = 200, ownerId } = options;

  if (!isStorageConfigured()) {
    let assets = demoIndex().filter((a) => a.status !== 'deleted');
    if (ownerId) assets = assets.filter((a) => a.ownerId === ownerId);
    return hydrateDemoAssets(assets);
  }

  let query = supabase.from('media_assets').select('*').is('deleted_at', null);

  const activeScope = scope ?? (entityType ? undefined : undefined);
  if (activeScope) {
    if (Array.isArray(activeScope)) query = query.in('scope', activeScope);
    else query = query.eq('scope', activeScope);
  }
  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);
  if (kind) query = query.eq('media_kind', kind);
  if (ownerId) query = query.eq('owner_id', ownerId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[mediaService] listMedia failed:', error.message);
    return [];
  }
  return (data || []).map(rowToAsset);
}

// ---------------------------------------------------------------------------
// UPDATE (metadata / entity linkage)
// ---------------------------------------------------------------------------

export async function updateMedia(
  assetId: string,
  patch: Partial<Pick<MediaAsset, 'entityType' | 'entityId' | 'scope' | 'metadata' | 'status'>>,
): Promise<{ ok: boolean; error?: string }> {
  if (!isStorageConfigured()) {
    const assets = demoIndex();
    const idx = assets.findIndex((a) => a.id === assetId);
    if (idx >= 0) {
      assets[idx] = { ...assets[idx], ...patch, updatedAt: new Date().toISOString() } as MediaAsset;
      writeDemoIndex(assets);
    }
    return { ok: true };
  }

  const payload: Record<string, unknown> = {};
  if (patch.entityType !== undefined) payload.entity_type = patch.entityType;
  if (patch.entityId !== undefined) payload.entity_id = patch.entityId;
  if (patch.scope !== undefined) payload.scope = patch.scope;
  if (patch.metadata !== undefined) payload.metadata = patch.metadata;
  if (patch.status !== undefined) payload.status = patch.status;

  const { error } = await supabase.from('media_assets').update(payload).eq('id', assetId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---------------------------------------------------------------------------
// DIAGNOSTICS — end-to-end self test used by the in-app Storage panel
// ---------------------------------------------------------------------------

export interface SelfTestStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  detail?: string;
  durationMs?: number;
}

export interface SelfTestReport {
  configured: boolean;
  steps: SelfTestStep[];
  passed: number;
  failed: number;
}

const SELF_TEST_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Runs a real round-trip against the configured project:
 * auth -> upload -> ledger row -> read back -> signed URL -> delete.
 * Safe to run repeatedly; it cleans up after itself.
 */
export async function runStorageSelfTest(ownerId: string | null): Promise<SelfTestReport> {
  const steps: SelfTestStep[] = [
    { id: 'config', label: 'Supabase credentials present', status: 'pending' },
    { id: 'auth', label: 'Authenticated session', status: 'pending' },
    { id: 'bucket', label: 'Buckets reachable', status: 'pending' },
    { id: 'upload', label: 'Upload object to storage', status: 'pending' },
    { id: 'record', label: 'Media ledger row written', status: 'pending' },
    { id: 'read', label: 'Object readable back', status: 'pending' },
    { id: 'signed', label: 'Signed URL issued (private bucket)', status: 'pending' },
    { id: 'rls', label: 'Cross-user write blocked by RLS', status: 'pending' },
    { id: 'delete', label: 'Object + record removed', status: 'pending' },
  ];

  const mark = (id: string, status: SelfTestStep['status'], detail?: string, durationMs?: number) => {
    const step = steps.find((s) => s.id === id);
    if (step) {
      step.status = status;
      step.detail = detail;
      step.durationMs = durationMs;
    }
  };

  const report = (): SelfTestReport => ({
    configured: isStorageConfigured(),
    steps,
    passed: steps.filter((s) => s.status === 'passed').length,
    failed: steps.filter((s) => s.status === 'failed').length,
  });

  // 1. Config
  if (!isStorageConfigured()) {
    mark('config', 'failed', 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.');
    steps.filter((s) => s.id !== 'config').forEach((s) => (s.status = 'skipped'));
    return report();
  }
  mark('config', 'passed', supabaseUrl());

  // 2. Auth
  const token = await getAccessToken();
  if (!token || !ownerId) {
    mark('auth', 'failed', 'No active session — sign in to run the storage test.');
    steps.filter((s) => !['config', 'auth'].includes(s.id)).forEach((s) => (s.status = 'skipped'));
    return report();
  }
  mark('auth', 'passed', `uid ${ownerId.slice(0, 8)}…`);

  // 3. Buckets
  const t0 = performance.now();
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    mark('bucket', 'failed', bucketError.message);
    steps.filter((s) => !['config', 'auth', 'bucket'].includes(s.id)).forEach((s) => (s.status = 'skipped'));
    return report();
  }
  const missing = (Object.keys(MEDIA_BUCKETS) as MediaBucketId[]).filter(
    (id) => !(buckets || []).some((b) => b.id === id),
  );
  if (missing.length) {
    mark('bucket', 'failed', `Missing bucket(s): ${missing.join(', ')}. Run 0005_media_storage.sql.`);
    steps.filter((s) => !['config', 'auth', 'bucket'].includes(s.id)).forEach((s) => (s.status = 'skipped'));
    return report();
  }
  mark('bucket', 'passed', `${(buckets || []).length} buckets found`, Math.round(performance.now() - t0));

  // 4. Upload + 5. Ledger row
  const blob = base64ToBlob(SELF_TEST_PNG_BASE64, 'image/png');
  const testFile = new File([blob], `selftest-${Date.now()}.png`, { type: 'image/png' });
  let created: MediaAsset | null = null;
  try {
    const result = await uploadMedia({
      file: testFile,
      scope: 'general',
      ownerId,
      metadata: { selfTest: true },
      skipContentCheck: true,
    });
    if (!result.ok || !result.asset) {
      mark('upload', 'failed', result.error || 'Upload rejected by storage policy.');
      mark('record', 'skipped', 'Skipped — upload failed.');
    } else {
      mark('upload', 'passed', result.asset.path);
      mark('record', 'passed', `media_assets row ${result.asset.id.slice(0, 8)}…`);
      created = result.asset;
    }
  } catch (err: any) {
    mark('upload', 'failed', err?.message || 'Unexpected error.');
    mark('record', 'skipped');
  }

  if (!created) {
    ['read', 'signed', 'rls', 'delete'].forEach((id) => mark(id, 'skipped'));
    return report();
  }

  // 6. Read back
  const readUrl = await resolveMediaUrl(created);
  if (!readUrl) {
    mark('read', 'failed', 'Could not resolve a URL for the uploaded object.');
  } else {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 8000);
      img.src = readUrl;
    });
    mark('read', ok ? 'passed' : 'failed', ok ? 'Object served over CDN' : 'Object URL did not load');
  }

  // 7. Signed URL on a private bucket
  const signedPath = `${ownerId}/general/selftest-${Date.now()}.png`;
  const signedUpload = await xhrUpload({
    bucket: 'documents',
    path: signedPath,
    file: testFile,
    accessToken: token,
  });
  if (!signedUpload.ok) {
    mark('signed', 'failed', `Private-bucket upload rejected: ${signedUpload.error}`);
  } else {
    const signed = await createSignedUrl('documents', signedPath, 60);
    mark(
      'signed',
      signed ? 'passed' : 'failed',
      signed ? 'Signed URL issued with 60s TTL' : 'createSignedUrl returned nothing',
    );
    await supabase.storage.from('documents').remove([signedPath]).catch(() => undefined);
  }

  // 8. RLS — writing into another user's folder must be denied
  const foreignPath = `00000000-0000-4000-8000-000000000000/general/rls-probe.png`;
  const rlsResult = await xhrUpload({
    bucket: 'avatars',
    path: foreignPath,
    file: testFile,
    accessToken: token,
  });
  mark(
    'rls',
    rlsResult.ok ? 'failed' : 'passed',
    rlsResult.ok
      ? 'SECURITY: a write into another user folder succeeded!'
      : 'Write into a foreign folder was rejected',
  );
  if (rlsResult.ok) {
    await supabase.storage.from('avatars').remove([foreignPath]).catch(() => undefined);
  }

  // 9. Cleanup
  const deleted = await deleteMedia(created);
  mark(
    'delete',
    deleted.ok ? 'passed' : 'failed',
    deleted.ok ? 'Object and ledger row removed' : deleted.error || 'Delete failed',
  );

  return report();
}
