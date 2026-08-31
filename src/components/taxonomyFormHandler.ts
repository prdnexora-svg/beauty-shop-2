/**
 * Dynamic form handler for the RFQ "Product Details" taxonomy section.
 *
 * Pure state transitions (no React) so the auto-clear + multi-select
 * contracts can be unit tested:
 *
 *   - changing the Primary Category CLEARS all selected subcategories
 *   - subcategory pills are multi-select; the legacy single `subcategory`
 *     field is kept in sync (first selected item) for older consumers
 *   - available pills always come from the taxonomy of the CURRENT
 *     primary category, so selections can never mix categories
 *
 * Backed by the 7-category B2B taxonomy in src/data/categoryTaxonomy.ts
 * (Skincare, Haircare & Styling, Color Cosmetics / Makeup,
 *  Personal Care & Body, Raw Ingredients & Actives, Packaging & Containers,
 *  Salon & Spa Equipment).
 */
import {
  CATEGORY_TAXONOMY,
  getAllCategoryKeys,
  getSubcategoriesForCategoryName
} from '../data/categoryTaxonomy';

export interface TaxonomySelectionState {
  /** chosen primary category name (key of CATEGORY_TAXONOMY) */
  primaryCategory: string;
  /** multi-selected subcategory pills */
  selectedSubcategories: string[];
  /** single legacy field kept in sync (= first selected subcategory) */
  subcategory: string;
}

/** The 7 primary categories supported by the RFQ form. */
export const PRIMARY_CATEGORIES: string[] = getAllCategoryKeys();

export function createInitialTaxonomyState(
  primaryCategory = 'Skincare',
  selectedSubcategories: string[] = []
): TaxonomySelectionState {
  return {
    primaryCategory,
    selectedSubcategories,
    subcategory: selectedSubcategories[0] ?? ''
  };
}

/** Subcategory pills available for a given primary category. */
export function getAvailableSubcategories(primaryCategory: string): string[] {
  return getSubcategoriesForCategoryName(primaryCategory);
}

/**
 * Change the primary category.
 * Selecting a DIFFERENT category auto-clears every previously selected
 * subcategory; re-selecting the same category is a no-op (keeps picks).
 */
export function changePrimaryCategory(
  state: TaxonomySelectionState,
  nextCategory: string
): TaxonomySelectionState {
  if (state.primaryCategory === nextCategory) {
    return state;
  }
  return {
    primaryCategory: nextCategory,
    selectedSubcategories: [],
    subcategory: ''
  };
}

/** Toggle one subcategory pill (multi-select, order-preserving). */
export function toggleSubcategory(
  state: TaxonomySelectionState,
  subcategory: string
): TaxonomySelectionState {
  const isSelected = state.selectedSubcategories.includes(subcategory);
  const selectedSubcategories = isSelected
    ? state.selectedSubcategories.filter((s) => s !== subcategory)
    : [...state.selectedSubcategories, subcategory];

  return {
    ...state,
    selectedSubcategories,
    subcategory: selectedSubcategories[0] ?? ''
  };
}

/** Remove every selected subcategory (the "Clear Selection" action). */
export function clearSelectedSubcategories(state: TaxonomySelectionState): TaxonomySelectionState {
  return {
    ...state,
    selectedSubcategories: [],
    subcategory: ''
  };
}

/** A selection is valid once at least one subcategory pill is picked. */
export function isTaxonomySelectionValid(state: TaxonomySelectionState): boolean {
  return state.selectedSubcategories.length > 0;
}

/**
 * The ordered path rendered by the "Active Taxonomy Path" chip area:
 * primary category first, then each selected subcategory.
 */
export function getActiveTaxonomyPath(state: TaxonomySelectionState): string[] {
  return [state.primaryCategory, ...state.selectedSubcategories];
}

/** Guard: no selected subcategory may belong to another primary category. */
export function hasStraySubcategories(state: TaxonomySelectionState): boolean {
  const allowed = new Set(getAvailableSubcategories(state.primaryCategory));
  return state.selectedSubcategories.some((s) => !allowed.has(s));
}

export { CATEGORY_TAXONOMY };
