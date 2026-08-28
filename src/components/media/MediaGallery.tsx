// ============================================================================
// NEXORA LUXE — MEDIA GALLERY
// Grid + lightbox viewer with owner/admin-only edit controls.
// Used for product image galleries, supplier portfolios, compliance vaults
// and the timeline post composer.
// ============================================================================

import React, { useCallback, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageOff,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { MediaScope, formatBytes, isStorageConfigured } from '../../lib/mediaConfig';
import { MediaAsset, deleteMedia, resolveMediaUrl } from '../../lib/mediaService';
import { SecureImage } from './SecureImage';
import { MediaPlayer } from './MediaPlayer';
import { MediaUploader } from './MediaUploader';

export interface MediaGalleryProps {
  assets: MediaAsset[];
  ownerId?: string | null;
  /** When true, Add / Replace / Delete controls are rendered. */
  canManage?: boolean;
  isAdmin?: boolean;
  scope?: MediaScope;
  entityType?: string;
  entityId?: string;
  maxFiles?: number;
  emptyLabel?: string;
  columns?: 3 | 4 | 5;
  className?: string;
  onChanged?: () => void;
  onAssetDeleted?: (assetId: string) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  assets,
  ownerId,
  canManage = false,
  isAdmin = false,
  scope = 'general',
  entityType,
  entityId,
  maxFiles = 10,
  emptyLabel = 'No media uploaded yet.',
  columns = 4,
  className = '',
  onChanged,
  onAssetDeleted,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const mayEdit = (asset: MediaAsset) =>
    canManage && (isAdmin || (!!ownerId && asset.ownerId === ownerId));

  const columnClass =
    columns === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : columns === 5
        ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

  const handleDelete = useCallback(
    async (asset: MediaAsset) => {
      setDeletingId(asset.id);
      setError(null);
      const result = await deleteMedia(asset);
      setDeletingId(null);
      if (!result.ok) {
        setError(result.error || 'Could not delete this file.');
        return;
      }
      onAssetDeleted?.(asset.id);
      onChanged?.();
      if (activeIndex !== null) setActiveIndex(null);
    },
    [activeIndex, onAssetDeleted, onChanged],
  );

  const openDownload = useCallback(async (asset: MediaAsset) => {
    const url = await resolveMediaUrl(asset);
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = asset.originalName || 'download';
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, []);

  const active = activeIndex === null ? null : assets[activeIndex];

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {assets.length === 0 && !showUploader && (
        <div className="border-2 border-dashed border-[#E8DEEF] rounded-xl p-8 text-center bg-[#FDFBF7]">
          <ImageOff className="w-6 h-6 text-[#7E6C96] mx-auto mb-1.5" />
          <p className="text-[12px] font-bold text-[#5B4A6E]">{emptyLabel}</p>
        </div>
      )}

      {assets.length > 0 && (
        <div className={`grid ${columnClass} gap-2.5`}>
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              className="group relative aspect-square rounded-xl overflow-hidden border border-[#E8DEEF] bg-[#FDFBF7]"
            >
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="w-full h-full"
                aria-label={`Open ${asset.originalName || 'media'}`}
              >
                {asset.mediaKind === 'video' ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <Video className="w-6 h-6 text-white/80" />
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-mono rounded">
                      {asset.durationSeconds ? `${Math.round(asset.durationSeconds)}s` : 'VIDEO'}
                    </span>
                  </div>
                ) : asset.mediaKind === 'document' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#6B2D8C]">
                    <FileText className="w-6 h-6" />
                    <span className="text-[9px] font-bold uppercase">
                      {(asset.originalName || '').split('.').pop() || 'DOC'}
                    </span>
                  </div>
                ) : (
                  <SecureImage
                    asset={asset}
                    alt={asset.originalName || 'Gallery image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    showSpinner
                  />
                )}
              </button>

              {mayEdit(asset) && (
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    aria-label="Download"
                    onClick={() => void openDownload(asset)}
                    className="p-1.5 rounded-lg bg-white/90 text-[#2A0E3F] hover:bg-white shadow-sm"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    disabled={deletingId === asset.id}
                    onClick={() => void handleDelete(asset)}
                    className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-red-50 shadow-sm disabled:opacity-50"
                  >
                    {deletingId === asset.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}

              {asset.isLocal && (
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded">
                  Demo
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <div className="space-y-2">
          {!showUploader ? (
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              disabled={assets.length >= maxFiles}
              className="w-full py-2.5 border-2 border-dashed border-[#E8DEEF] hover:border-[#6B2D8C] rounded-xl text-[11px] font-black text-[#5B4A6E] hover:text-[#6B2D8C] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {assets.length >= maxFiles ? `Limit reached (${maxFiles})` : 'Add media'}
            </button>
          ) : (
            <div className="border border-[#E8DEEF] rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-[#2A0E3F] uppercase tracking-wide flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#6B2D8C]" /> Add media
                </span>
                <button
                  type="button"
                  onClick={() => setShowUploader(false)}
                  className="text-[#7E6C96] hover:text-[#2A0E3F]"
                  aria-label="Close uploader"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <MediaUploader
                ownerId={ownerId}
                scope={scope}
                entityType={entityType}
                entityId={entityId}
                multiple
                maxFiles={maxFiles}
                variant="compact"
                hidePreview
                onChange={() => {
                  onChanged?.();
                  setShowUploader(false);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            aria-label="Close viewer"
            onClick={() => setActiveIndex(null)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {assets.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i === null ? null : (i - 1 + assets.length) % assets.length));
                }}
                className="absolute left-2 sm:left-6 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i === null ? null : (i + 1) % assets.length));
                }}
                className="absolute right-2 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {active.mediaKind === 'video' ? (
              <MediaPlayer asset={active} aspect="video" controls autoPlay className="rounded-xl overflow-hidden" />
            ) : active.mediaKind === 'document' ? (
              <div className="w-full bg-white rounded-xl p-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-[#6B2D8C] mx-auto" />
                <p className="text-sm font-bold text-[#2A0E3F] break-all">{active.originalName}</p>
                <p className="text-xs text-[#5B4A6E]">{formatBytes(active.byteSize)}</p>
                <button
                  type="button"
                  onClick={() => void openDownload(active)}
                  className="px-4 py-2 bg-[#6B2D8C] text-white rounded-xl text-xs font-bold hover:bg-[#4A2560]"
                >
                  Open / Download
                </button>
              </div>
            ) : (
              <SecureImage
                asset={active}
                alt={active.originalName || 'Media'}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
                showSpinner
              />
            )}

            <div className="text-center text-white/80 text-[11px] font-medium space-y-0.5">
              <p className="text-white font-bold">{active.originalName || 'Untitled'}</p>
              <p>
                {formatBytes(active.byteSize)}
                {active.width && active.height ? ` · ${active.width}×${active.height}` : ''}
                {active.durationSeconds ? ` · ${Math.round(active.durationSeconds)}s` : ''}
                {' · '}
                {activeIndex! + 1}/{assets.length}
              </p>
              {active.isLocal && (
                <p className="text-amber-300 text-[10px]">
                  Local demo asset — {isStorageConfigured() ? 're-upload to persist' : 'Supabase Storage not configured'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
