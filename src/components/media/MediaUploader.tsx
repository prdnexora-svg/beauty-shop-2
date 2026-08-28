// ============================================================================
// NEXORA LUXE — MEDIA UPLOADER
// One drag-and-drop uploader used by every media surface (avatars, product
// images, compliance docs, ad creatives, videos, RFQ attachments).
//
// Provides: MIME + size validation, real byte-level progress, cancel,
// preview, replace, delete, error recovery and an honest "local demo" badge
// when no Supabase project is configured.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { MediaScope, acceptStringForScope, constraintsHintForScope, formatBytes, isStorageConfigured } from '../../lib/mediaConfig';
import { MediaAsset } from '../../lib/mediaService';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { SecureImage } from './SecureImage';

export interface MediaUploaderProps {
  ownerId?: string | null;
  scope: MediaScope;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;

  /** Controlled value. Single or multiple depending on `multiple`. */
  value?: MediaAsset | MediaAsset[] | null;
  onChange?: (value: MediaAsset | MediaAsset[] | null) => void;
  multiple?: boolean;
  maxFiles?: number;

  label?: string;
  helperText?: string;
  variant?: 'dropzone' | 'compact' | 'avatar' | 'banner';
  disabled?: boolean;
  /** Hide the built-in preview grid (parent renders its own). */
  hidePreview?: boolean;
  className?: string;
  /**
   * Imperative escape hatch: when supplied, the uploader assigns an
   * "open the file picker" function to it so an existing button elsewhere in
   * the UI can drive it without changing the layout.
   */
  pickerRef?: { current: (() => void) | null };
}

function KindIcon({ kind, className }: { kind: MediaAsset['mediaKind']; className?: string }) {
  if (kind === 'image') return <ImageIcon className={className} />;
  if (kind === 'video') return <Video className={className} />;
  return <FileText className={className} />;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  ownerId,
  scope,
  entityType,
  entityId,
  metadata,
  value,
  onChange,
  multiple = false,
  maxFiles,
  label,
  helperText,
  variant = 'dropzone',
  disabled = false,
  hidePreview = false,
  className = '',
  pickerRef,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!pickerRef) return;
    pickerRef.current = () => inputRef.current?.click();
    return () => {
      pickerRef.current = null;
    };
  }, [pickerRef]);

  const current: MediaAsset[] = Array.isArray(value)
    ? value
    : value
      ? [value as MediaAsset]
      : [];

  const { tasks, isUploading, uploadMany, cancel, removeUploaded } = useMediaUpload({
    ownerId,
    scope,
    entityType,
    entityId,
    metadata,
    onError: (message) => setLocalError(message),
    onUploaded: (asset) => {
      setLocalError(null);
      const next = multiple ? [...current, asset].slice(0, maxFiles ?? 10) : [asset];
      onChange?.(multiple ? next : (next[0] ?? null));
    },
  });

  const hint = helperText ?? constraintsHintForScope(scope);
  const accept = acceptStringForScope(scope);
  const configured = isStorageConfigured();
  const limit = maxFiles ?? (multiple ? 5 : 1);
  const isFull = current.length >= limit;

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      setLocalError(null);
      if (!files || files.length === 0) return;
      const list = Array.from(files);

      if (!ownerId) {
        setLocalError('Please sign in before uploading media.');
        return;
      }
      if (!multiple && list.length > 1) {
        setLocalError('Only one file can be uploaded here.');
        return;
      }
      if (current.length + list.length > limit) {
        setLocalError(`You can upload at most ${limit} file${limit === 1 ? '' : 's'} here.`);
        return;
      }
      await uploadMany(list);
      if (inputRef.current) inputRef.current.value = '';
    },
    [current.length, limit, multiple, ownerId, uploadMany],
  );

  const handleRemove = useCallback(
    async (asset: MediaAsset) => {
      const result = await removeUploaded(asset);
      if (!result.ok) {
        setLocalError(result.error || 'Could not remove the file.');
        return;
      }
      const next = current.filter((a) => a.id !== asset.id);
      onChange?.(multiple ? next : (next[0] ?? null));
    },
    [current, multiple, onChange, removeUploaded],
  );

  const activeTask = tasks.find((t) => t.status === 'uploading' || t.status === 'queued');

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      className="hidden"
      disabled={disabled || isUploading}
      onChange={(e) => void handleFiles(e.target.files)}
    />
  );

  const demoBadge = !configured && current.length > 0 && (
    <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
      Local demo preview — not uploaded to a server. Configure Supabase Storage to persist media.
    </p>
  );

  if (variant === 'avatar') {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <p className="text-[11px] font-bold text-[#5B4A6E] uppercase">{label}</p>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-[#E8DEEF] hover:border-[#6B2D8C] bg-[#FDFBF7] overflow-hidden flex items-center justify-center transition-colors disabled:opacity-60"
            aria-label={label || 'Upload image'}
          >
            {current[0] ? (
              <SecureImage
                asset={current[0]}
                alt="Preview"
                className="w-full h-full object-cover"
                showSpinner
              />
            ) : (
              <Upload className="w-4 h-4 text-[#7E6C96]" />
            )}
            {isUploading && (
              <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[#6B2D8C]" />
              </span>
            )}
          </button>

          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isUploading}
                className="px-3 py-1.5 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl text-[11px] font-black text-[#2A0E3F] hover:bg-white transition-all disabled:opacity-60"
              >
                {current[0] ? 'Change' : 'Upload'}
              </button>
              {current[0] && (
                <button
                  type="button"
                  onClick={() => void handleRemove(current[0])}
                  className="px-3 py-1.5 border border-red-100 text-red-600 rounded-xl text-[11px] font-black hover:bg-red-50 transition-all"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#7E6C96] font-medium">{hint}</p>
          </div>
        </div>
        {input}
        {localError && (
          <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {localError}
          </p>
        )}
        {demoBadge}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <p className="text-[11px] font-bold text-[#5B4A6E] uppercase">{label}</p>}
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          className="relative h-32 rounded-xl border-2 border-dashed border-[#E8DEEF] hover:border-[#6B2D8C] bg-[#FDFBF7] overflow-hidden cursor-pointer transition-colors"
        >
          {current[0] ? (
            <SecureImage asset={current[0]} alt="Cover preview" className="w-full h-full object-cover" showSpinner />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#7E6C96]">
              <ImageIcon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Upload cover banner</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#6B2D8C]" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-[#7E6C96] font-medium">{hint}</p>
          {current[0] && (
            <button
              type="button"
              onClick={() => void handleRemove(current[0])}
              className="text-[10px] font-bold text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        {input}
        {localError && (
          <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {localError}
          </p>
        )}
        {demoBadge}
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <p className="text-[11px] font-bold text-[#5B4A6E] uppercase">{label}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isFull) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (disabled || isFull) return;
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !isFull && !isUploading && inputRef.current?.click()}
        className={`${
          isCompact ? 'p-3' : 'p-6'
        } border-2 border-dashed rounded-xl text-center transition-all ${
          disabled || isFull
            ? 'border-[#E8DEEF] bg-[#FDFBF7] opacity-60 cursor-not-allowed'
            : isDragOver
              ? 'border-[#6B2D8C] bg-[#F5EEF8]/40'
              : 'border-[#E8DEEF] bg-[#FDFBF7] hover:border-[#6B2D8C] cursor-pointer'
        }`}
      >
        {isUploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#2A0E3F]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6B2D8C]" />
              <span className="truncate max-w-[200px]">{activeTask?.fileName}</span>
              <span className="text-[#6B2D8C]">{activeTask?.percent ?? 0}%</span>
            </div>
            <div className="w-full bg-[#E8DEEF] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#6B2D8C] h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${activeTask?.percent ?? 0}%` }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cancel();
              }}
              className="text-[10px] font-bold text-[#7E6C96] hover:text-red-600"
            >
              Cancel upload
            </button>
          </div>
        ) : (
          <>
            <CloudUpload className={`${isCompact ? 'w-5 h-5' : 'w-7 h-7'} mx-auto text-[#6B2D8C] mb-1.5`} />
            <p className={`${isCompact ? 'text-[11px]' : 'text-[13px]'} font-bold text-[#2A0E3F]`}>
              {isFull ? 'Maximum files reached' : 'Click to upload or drag & drop'}
            </p>
            {!isCompact && <p className="text-[11px] text-[#5B4A6E] font-medium mt-0.5">{hint}</p>}
          </>
        )}
      </div>

      {isCompact && !isUploading && <p className="text-[10px] text-[#7E6C96] font-medium">{hint}</p>}

      {input}

      {localError && (
        <div className="flex items-start gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Uploaded files */}
      {!hidePreview && current.length > 0 && (
        <div className="space-y-2">
          {current.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center gap-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl p-2.5"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F5EEF8] flex items-center justify-center text-[#6B2D8C] shrink-0">
                {asset.mediaKind === 'image' ? (
                  <SecureImage asset={asset} alt={asset.originalName || ''} className="w-full h-full object-cover" />
                ) : (
                  <KindIcon kind={asset.mediaKind} className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#2A0E3F] truncate">
                  {asset.originalName || 'Uploaded file'}
                </p>
                <p className="text-[9.5px] text-[#7E6C96] font-medium">
                  {formatBytes(asset.byteSize)}
                  {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
                  {asset.durationSeconds ? ` · ${Math.round(asset.durationSeconds)}s` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    inputRef.current?.click();
                  }}
                  className="text-[10px] font-bold text-[#6B2D8C] hover:underline"
                >
                  Replace
                </a>
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={() => void handleRemove(asset)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {demoBadge}

      {tasks.some((t) => t.status === 'error') && (
        <div className="space-y-1">
          {tasks
            .filter((t) => t.status === 'error')
            .map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5"
              >
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="flex-1">
                  {t.fileName}: {t.error}
                </span>
                <button
                  type="button"
                  onClick={() => void handleFiles(null)}
                  className="shrink-0 text-[#7E6C96] hover:text-[#2A0E3F]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
        </div>
      )}

      {current.length > 0 && configured && (
        <p className="text-[9.5px] text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Stored in Supabase Storage
        </p>
      )}
    </div>
  );
};

export default MediaUploader;
