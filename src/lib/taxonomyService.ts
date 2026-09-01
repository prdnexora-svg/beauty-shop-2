// ============================================================================
// NEXORA LUXE — DYNAMIC CATEGORY / SUBCATEGORY TAXONOMY SERVICE
// ============================================================================
// This module is the single bridge between:
//
//   1. Supabase (`categories` + `subcategories` tables) — the live source of
//      truth when the project is configured, and
//   2. the static dev/demo taxonomy in `src/data/categoryTaxonomy.ts` — used
//      only as an offline fallback so the RFQ form never renders empty.
//
// The component only consumes `TaxonomyCatalog`, so replacing the fallback
// with the Supabase fetch is invisible to React.
// ============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { CATEGORY_TAXONOMY } from '../data/categoryTaxonomy';

/** One row from the `subcategories` table (or an offline fallback row). */
export interface TaxonomySubcategory {
  id: string | null;
  category_id: string | null;
  name: string;
  slug: string;
  created_at: string;
}

/** One row from the `categories` table (or an offline fallback row). */
export interface TaxonomyCategoryNode {
  id: string | null;
  name: string;
  slug: string;
  icon_url: string | null;
  created_at: string;
  subcategories: TaxonomySubcategory[];
}

/** A ready-to-render taxonomy tree, always available (never throws to UI). */
export interface TaxonomyCatalog {
  categories: TaxonomyCategoryNode[];
  source: 'supabase' | 'fallback';
  loaded: boolean;
  error?: string;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build a deterministic offline/demo catalog from the static taxonomy.
 * Used before Supabase responds and as a graceful fallback on any error.
 */
export function createFallbackCatalog(): TaxonomyCatalog {
  const categories: TaxonomyCategoryNode[] = Object.entries(CATEGORY_TAXONOMY).map(
    ([name, subcategoryNames], categoryIndex) => {
      const categorySlug = slugify(name);
      const subcategories: TaxonomySubcategory[] = subcategoryNames.map((subName, subIndex) => ({
        id: null,
        category_id: `static-${categorySlug}`,
        name: subName,
        slug: `${categorySlug}-${slugify(subName)}`,
        created_at: new Date(Date.UTC(2026, 0, 1 + categoryIndex, 0, subIndex)).toISOString()
      }));

      return {
        id: null,
        name,
        slug: categorySlug,
        icon_url: null,
        created_at: new Date(Date.UTC(2026, 0, 1 + categoryIndex)).toISOString(),
        subcategories
      };
    }
  );

  return {
    categories,
    source: 'fallback',
    loaded: false
  };
}

/**
 * Group flat Supabase rows into a nested `TaxonomyCatalog`.
 * Ordering is preserved from the query (which sorts by `created_at`), so the
 * seed order (Skincare → Haircare → Makeup → ... ) is kept.
 */
export function buildTaxonomyCatalog(
  categoryRows: TaxonomyCategoryNode[],
  subcategoryRows: TaxonomySubcategory[]
): TaxonomyCatalog {
  const grouped = categoryRows.map((category) => ({
    ...category,
    subcategories: subcategoryRows.filter((sub) => sub.category_id === category.id)
  }));

  return {
    categories: grouped,
    source: 'supabase' as const,
    loaded: true
  };
}

/**
 * Fetch the live taxonomy from Supabase.
 *
 * Throws when Supabase is not configured or either query fails so the
 * consuming hook can fall back to the offline catalog.
 */
export async function fetchTaxonomyCatalogFromSupabase(): Promise<TaxonomyCatalog> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const [categoryResult, subcategoryResult] = await Promise.all([
    supabase.from('categories').select('*').order('created_at', { ascending: true }),
    supabase.from('subcategories').select('*').order('created_at', { ascending: true })
  ]);

  if (categoryResult.error) {
    throw new Error(`Failed to load categories: ${categoryResult.error.message}`);
  }
  if (subcategoryResult.error) {
    throw new Error(`Failed to load subcategories: ${subcategoryResult.error.message}`);
  }

  const categoryRows = (categoryResult.data ?? []) as TaxonomyCategoryNode[];
  const subcategoryRows = (subcategoryResult.data ?? []) as TaxonomySubcategory[];
  return buildTaxonomyCatalog(categoryRows, subcategoryRows);
}

export function normalizeSearchQuery(value: string): string {
  return (value || '').toLowerCase().trim();
}

/**
 * Real-time search filter across BOTH categories and subcategories.
 *
 * - A category is kept when its name OR any of its subcategory names matches.
 * - When a category is kept because of a subcategory match, only the matching
 *   subcategories are returned so the pills area directly answers the query.
 */
export function filterTaxonomyCatalog(
  catalog: TaxonomyCatalog,
  query: string
): TaxonomyCatalog {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return catalog;

  const categories = catalog.categories
    .map((category) => {
      const categoryMatches = category.name.toLowerCase().includes(normalized);
      const matchedSubcategories = category.subcategories.filter((sub) =>
        sub.name.toLowerCase().includes(normalized)
      );

      if (!categoryMatches && matchedSubcategories.length === 0) return null;
      return {
        ...category,
        subcategories: categoryMatches ? category.subcategories : matchedSubcategories
      };
    })
    .filter((category): category is TaxonomyCategoryNode => Boolean(category));

  return {
    ...catalog,
    categories
  };
}

/** Case-insensitive exact-match lookup used to map a selected name to a row. */
export function findCategoryByName(
  catalog: TaxonomyCatalog,
  name: string
): TaxonomyCategoryNode | undefined {
  const normalized = normalizeSearchQuery(name);
  return catalog.categories.find((category) => normalizeSearchQuery(category.name) === normalized);
}

/** All subcategory names for a category, optionally filtered by search text. */
export function getSubcategoryNamesForCategory(
  catalog: TaxonomyCatalog,
  categoryName: string,
  query = ''
): string[] {
  const category = findCategoryByName(catalog, categoryName);
  if (!category) return [];
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return category.subcategories.map((sub) => sub.name);
  return category.subcategories
    .filter((sub) => sub.name.toLowerCase().includes(normalized))
    .map((sub) => sub.name);
}

/** Convenience used by the form handler with the static fallback. */
export function getFallbackCategoryNames(): string[] {
  return createFallbackCatalog().categories.map((category) => category.name);
}
