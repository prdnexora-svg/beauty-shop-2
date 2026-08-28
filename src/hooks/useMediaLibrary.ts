// ============================================================================
// NEXORA LUXE — MEDIA LIBRARY HOOK
// Reads the `media_assets` ledger for the signed-in user (or a specific
// entity) and keeps it fresh when uploads happen elsewhere in the app.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { MediaKind, MediaScope } from '../lib/mediaConfig';
import { MediaAsset, hydrateDemoAssets, listMedia } from '../lib/mediaService';

const DEMO_EVENT = 'nexora_media_demo_updated';

interface UseMediaLibraryArgs {
  ownerId?: string | null;
  scope?: MediaScope | MediaScope[];
  entityType?: string;
  entityId?: string;
  kind?: MediaKind;
  enabled?: boolean;
}

export function useMediaLibrary({
  ownerId,
  scope,
  entityType,
  entityId,
  kind,
  enabled = true,
}: UseMediaLibraryArgs) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serialised into a string so the effect doesn't re-run on array identity.
  const scopeKey = Array.isArray(scope) ? scope.join('|') : scope || '';

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listMedia({
        ownerId: ownerId || undefined,
        scope: scopeKey ? (scopeKey.split('|') as MediaScope[]) : undefined,
        entityType,
        entityId,
        kind,
      });
      setAssets(await hydrateDemoAssets(result));
    } catch (err: any) {
      setError(err?.message || 'Could not load media.');
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, entityId, entityType, kind, ownerId, scopeKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(DEMO_EVENT, refresh);
    return () => window.removeEventListener(DEMO_EVENT, refresh);
  }, [refresh]);

  const addAsset = useCallback((asset: MediaAsset) => {
    setAssets((prev) => (prev.some((a) => a.id === asset.id) ? prev : [asset, ...prev]));
  }, []);

  const removeAsset = useCallback((assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  }, []);

  return { assets, isLoading, error, refresh, addAsset, removeAsset };
}

export default useMediaLibrary;
