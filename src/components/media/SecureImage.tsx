// ============================================================================
// NEXORA LUXE — SECURE IMAGE
// An <img> that knows the difference between a public CDN URL, a private
// object needing a signed URL, and a demo blob. Handles loading, 403 expiry
// (re-signs once) and hard failures with a real fallback instead of a
// permanently broken image icon.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import {
  MediaAsset,
  invalidateSignedUrl,
  refreshSignedUrl,
  resolveMediaUrl,
} from '../../lib/mediaService';

export interface SecureImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Preferred: pass the asset so private buckets get signed automatically. */
  asset?: MediaAsset | null;
  /** Or pass a raw URL (storage URL, external URL, data URL…). */
  src?: string | null;
  /** Shown while resolving/loading. Defaults to a subtle skeleton. */
  showSpinner?: boolean;
  /** Rendered when the image cannot be loaded at all. */
  fallback?: React.ReactNode;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  asset,
  src,
  showSpinner = false,
  fallback,
  className = '',
  alt = '',
  ...rest
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const retriedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus('loading');
    setMessage(null);
    try {
      const resolved = await resolveMediaUrl(asset || src);
      if (!mountedRef.current) return;
      if (!resolved) {
        setStatus('error');
        setMessage('Media unavailable');
        return;
      }
      setUrl(resolved);
    } catch {
      if (!mountedRef.current) return;
      setStatus('error');
      setMessage('Could not resolve media URL');
    }
  }, [asset, src]);

  useEffect(() => {
    retriedRef.current = false;
    void load();
  }, [load]);

  const handleError = useCallback(async () => {
    // A private URL can 403 the moment it expires. Re-sign once before
    // declaring the image broken.
    const bucket = asset?.bucket;
    const path = asset?.path;
    if (bucket && path && !asset?.isLocal && !retriedRef.current) {
      retriedRef.current = true;
      invalidateSignedUrl(bucket, path);
      const fresh = await refreshSignedUrl(bucket, path);
      if (fresh && mountedRef.current) {
        setUrl(fresh);
        setStatus('loading');
        return;
      }
    }
    if (mountedRef.current) {
      setStatus('error');
      setMessage('Image could not be loaded');
    }
  }, [asset]);

  if (status === 'error') {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-[#F7F3FA] text-[#7E6C96] ${className}`}
        role="img"
        aria-label={message || 'Image unavailable'}
      >
        <ImageOff className="w-5 h-5" />
        <span className="text-[10px] font-semibold">{message}</span>
      </div>
    );
  }

  return (
    <>
      {showSpinner && status !== 'loaded' && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-[#F7F3FA]/70 ${className}`}
        >
          <Loader2 className="w-4 h-4 animate-spin text-[#6B2D8C]" />
        </div>
      )}
      {url && (
        <img
          {...rest}
          src={url}
          alt={alt}
          className={className}
          loading={rest.loading ?? 'lazy'}
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={handleError}
        />
      )}
    </>
  );
};

export default SecureImage;
