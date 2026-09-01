// ============================================================================
// NEXORA LUXE — DYNAMIC TAXONOMY CATALOG HOOK
// ============================================================================
// Loads `categories` + `subcategories` from Supabase on mount and exposes a
// always-usable `TaxonomyCatalog`. The static dev taxonomy is used as the
// initial/fallback value so the RFQ form is never blank.
// ============================================================================

import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  createFallbackCatalog,
  fetchTaxonomyCatalogFromSupabase,
  type TaxonomyCatalog
} from '../lib/taxonomyService';

export interface TaxonomyCatalogState {
  /** Always populated — Supabase when available, otherwise the fallback. */
  catalog: TaxonomyCatalog;
  loading: boolean;
  /** true when the displayed taxonomy came from Supabase. */
  isLive: boolean;
  /** Non-null only when a Supabase fetch was attempted and failed. */
  error: string | null;
  /** Re-run the live fetch (useful after admin adds a category). */
  reload: () => void;
}

export function useTaxonomyCatalog(): TaxonomyCatalogState {
  const firstRenderIsConfigured = isSupabaseConfigured();
  const [catalog, setCatalog] = useState<TaxonomyCatalog>(createFallbackCatalog);
  const [loading, setLoading] = useState(firstRenderIsConfigured);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!isSupabaseConfigured()) {
        if (active) {
          setCatalog(createFallbackCatalog());
          setLoading(false);
          setIsLive(false);
          setError(null);
        }
        return;
      }

      try {
        const loaded = await fetchTaxonomyCatalogFromSupabase();
        if (active) {
          setCatalog(loaded);
          setLoading(false);
          setIsLive(true);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setCatalog(createFallbackCatalog());
          setLoading(false);
          setIsLive(false);
          setError(err instanceof Error ? err.message : 'Failed to load taxonomy from Supabase.');
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return {
    catalog,
    loading,
    isLive,
    error,
    reload: () => setReloadKey((key) => key + 1)
  };
}
