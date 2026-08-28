// ============================================================================
// NEXORA LUXE — MEDIA LIBRARY / PICKER
// Browse previously uploaded assets for the signed-in user and pick one (or
// many). Saves re-uploading the same creative across campaigns.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Check, FileText, Loader2, Search, Video, X } from 'lucide-react';
import { MediaKind, MediaScope } from '../../lib/mediaConfig';
import { MediaAsset } from '../../lib/mediaService';
import { useMediaLibrary } from '../../hooks/useMediaLibrary';
import { SecureImage } from './SecureImage';

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId?: string | null;
  /** Restrict to a media kind (e.g. only images for a banner slot). */
  kind?: MediaKind;
  scope?: MediaScope | MediaScope[];
  multiple?: boolean;
  onSelect: (assets: MediaAsset[]) => void;
  title?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  ownerId,
  kind,
  scope,
  multiple = false,
  onSelect,
  title = 'Media library',
}) => {
  const { assets, isLoading, error } = useMediaLibrary({
    ownerId,
    kind,
    scope,
    enabled: isOpen,
  });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => (a.originalName || '').toLowerCase().includes(q) || a.scope.includes(q));
  }, [assets, query]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return multiple ? [...prev, id] : [id];
    });
  };

  const confirm = () => {
    const chosen = assets.filter((a) => selected.includes(a.id));
    onSelect(chosen);
    setSelected([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-[#E8DEEF] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F4F0E9]">
          <div>
            <h3 className="text-base font-black text-[#2A0E3F]">{title}</h3>
            <p className="text-[11px] text-[#7E6C96] font-medium">
              {assets.length} uploaded asset{assets.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media library"
            className="w-8 h-8 rounded-lg hover:bg-[#FDFBF7] flex items-center justify-center text-[#5B4A6E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#F4F0E9]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#7E6C96] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file name…"
              className="w-full pl-9 pr-3 py-2 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl text-xs text-[#2A0E3F] focus:outline-none focus:border-[#C9A961]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-[#7E6C96]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {!isLoading && error && (
            <p className="text-xs font-bold text-red-600 text-center py-8">{error}</p>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <p className="text-xs font-bold text-[#7E6C96] text-center py-12">
              {ownerId ? 'No matching assets yet.' : 'Sign in to see your uploaded media.'}
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filtered.map((asset) => {
              const isSelected = selected.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggle(asset.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected ? 'border-[#6B2D8C] ring-2 ring-[#6B2D8C]/20' : 'border-[#E8DEEF] hover:border-[#C9A961]'
                  }`}
                >
                  {asset.mediaKind === 'image' ? (
                    <SecureImage asset={asset} alt={asset.originalName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#FDFBF7] text-[#6B2D8C]">
                      {asset.mediaKind === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                  )}
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#6B2D8C] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold truncate px-1 py-0.5">
                    {asset.originalName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#F4F0E9] flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-[#7E6C96]">
            {selected.length} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8DEEF] text-[12px] font-bold text-[#5B4A6E] hover:bg-[#FDFBF7]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={selected.length === 0}
              className="px-5 py-2 rounded-xl bg-[#6B2D8C] text-white text-[12px] font-bold hover:bg-[#4A2560] disabled:opacity-50"
            >
              {multiple ? 'Add selected' : 'Use selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibraryModal;
