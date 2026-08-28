// ============================================================================
// NEXORA LUXE — MEDIA PLAYER
// One component for every video surface in the app. It:
//   * resolves private objects to signed URLs (and re-signs on expiry),
//   * plays self-hosted MP4/WebM natively (works offline-ish, no third party),
//   * falls back to a YouTube/Vimeo iframe for external platform URLs,
//   * is mobile-safe: playsInline, muted autoplay option, native controls,
//     poster support and a real error state instead of a black rectangle.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2, Play, RotateCcw } from 'lucide-react';
import {
  MediaAsset,
  invalidateSignedUrl,
  refreshSignedUrl,
  resolveMediaUrl,
} from '../../lib/mediaService';

export interface MediaPlayerProps {
  /** Preferred: the stored asset (handles private buckets + posters). */
  asset?: MediaAsset | null;
  /** Or a raw URL — storage URL, external MP4, YouTube/Vimeo link. */
  src?: string | null;
  poster?: string | null;
  /** Asset/URL for the poster image (private objects get signed too). */
  posterAsset?: MediaAsset | null;
  title?: string;
  className?: string;
  /** 9:16 reels vs 16:9 landscape. */
  aspect?: 'video' | 'reel' | 'square';
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  /** Fired on first play — used for sponsored-video analytics. */
  onPlay?: () => void;
  onEnded?: () => void;
}

function toEmbedUrl(url: string): string | null {
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}?rel=0&modestbranding=1`;
  }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  asset,
  src,
  poster,
  posterAsset,
  title,
  className = '',
  aspect = 'video',
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  onPlay,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
  const retriedRef = useRef(false);
  const playFiredRef = useRef(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const rawSrc = asset ? null : src || null;

  const embedUrl = useMemo(() => {
    if (asset) return null;
    return rawSrc ? toEmbedUrl(rawSrc) : null;
  }, [asset, rawSrc]);

  const resolve = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus('loading');
    setErrorMessage(null);
    retriedRef.current = false;

    const resolvedVideo = await resolveMediaUrl(asset || rawSrc);
    if (!mountedRef.current) return;
    const resolvedPoster = await resolveMediaUrl(posterAsset || poster || null);

    if (!resolvedVideo) {
      setStatus('error');
      setErrorMessage('This video is no longer available.');
      return;
    }
    setVideoUrl(resolvedVideo);
    setPosterUrl(resolvedPoster || null);
    // `ready` is set by onCanPlay; `idle` keeps the poster visible until then.
    setStatus('idle');
  }, [asset, poster, posterAsset, rawSrc]);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  const handleError = useCallback(async () => {
    const bucket = asset?.bucket;
    const path = asset?.path;
    if (bucket && path && !asset?.isLocal && !retriedRef.current) {
      retriedRef.current = true;
      invalidateSignedUrl(bucket, path);
      const fresh = await refreshSignedUrl(bucket, path);
      if (fresh && mountedRef.current) {
        setVideoUrl(fresh);
        setStatus('idle');
        return;
      }
    }
    if (mountedRef.current) {
      setStatus('error');
      setErrorMessage('Playback failed. The file may be missing, expired, or an unsupported format.');
    }
  }, [asset]);

  const aspectClass =
    aspect === 'reel'
      ? 'aspect-[9/16]'
      : aspect === 'square'
        ? 'aspect-square'
        : 'aspect-video';

  const handlePlay = () => {
    if (playFiredRef.current) return;
    playFiredRef.current = true;
    onPlay?.();
  };

  if (status === 'error') {
    return (
      <div
        className={`relative w-full ${aspectClass} bg-black text-white flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`}
      >
        {posterUrl && (
          <img src={posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}
        <div className="relative z-10 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-xs font-semibold max-w-xs">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void resolve()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <div className={`relative w-full ${aspectClass} bg-black ${className}`}>
        <iframe
          src={`${embedUrl}${autoPlay ? (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&mute=1' : ''}`}
          title={title || 'Video player'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onLoad={() => setStatus('ready')}
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} bg-black ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="w-6 h-6 animate-spin text-white/70" />
        </div>
      )}

      {status === 'idle' && !autoPlay && (
        <button
          type="button"
          aria-label={title ? `Play ${title}` : 'Play video'}
          onClick={() => {
            const el = videoRef.current;
            if (!el) return;
            void el.play().catch(() => undefined);
          }}
          className="absolute inset-0 z-10 flex items-center justify-center group"
        >
          {posterUrl && (
            <img src={posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <span className="absolute inset-0 bg-black/25" />
          <span className="relative w-14 h-14 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#6B2D8C] transition-all">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </span>
        </button>
      )}

      <video
        ref={videoRef}
        src={videoUrl || undefined}
        poster={posterUrl || undefined}
        className="w-full h-full object-contain"
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted || autoPlay}
        playsInline
        preload="metadata"
        controlsList="nodownload"
        onCanPlay={() => setStatus('ready')}
        onPlaying={() => setStatus('ready')}
        onError={handleError}
        onPlay={handlePlay}
        onEnded={onEnded}
      />
    </div>
  );
};

export default MediaPlayer;
