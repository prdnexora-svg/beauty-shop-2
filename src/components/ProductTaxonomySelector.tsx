import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  FolderTree,
  Plus,
  Search,
  X,
  Loader2,
  Database,
  CloudOff
} from 'lucide-react';
import {
  changePrimaryCategory,
  toggleSubcategory,
  clearSelectedSubcategories,
  type TaxonomySelectionState
} from './taxonomyFormHandler';
import { useTaxonomyCatalog } from '../hooks/useTaxonomyCatalog';
import {
  filterTaxonomyCatalog,
  findCategoryByName,
  normalizeSearchQuery
} from '../lib/taxonomyService';

interface ProductTaxonomySelectorProps {
  /** current taxonomy selection (controlled) */
  value: TaxonomySelectionState;
  /** called with the next state on every interaction */
  onChange: (next: TaxonomySelectionState) => void;
  /** set true to surface inline validation (no subcategory picked) */
  showValidationError?: boolean;
  /** optional right-hand column (e.g., visual references) */
  children?: React.ReactNode;
}

/**
 * B2B product taxonomy selector for the RFQ "Product Details" section.
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ ACTIVE TAXONOMY PATH  Skincare › [Serums] [Creams]         │
 *  ├────────────────────────────────────────────────────────────┤
 *  │ 🔎 Search categories & subcategories ...                   │
 *  │ Primary Category ▾      │ Subcategory pills ⬒⬒⬒           │
 *  └────────────────────────────────────────────────────────────┘
 *
 * - Category + subcategory data is fetched live from Supabase.
 * - A real-time search filters both the category list and the pills.
 * - Primary Category dropdown auto-clears subcategory selections.
 * - Subcategory pills are multi-select with live count + checkmarks.
 */
export const ProductTaxonomySelector: React.FC<ProductTaxonomySelectorProps> = ({
  value,
  onChange,
  showValidationError = false,
  children
}) => {
  const { catalog, loading, isLive, error, reload } = useTaxonomyCatalog();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = useMemo(
    () => filterTaxonomyCatalog(catalog, searchQuery),
    [catalog, searchQuery]
  );

  const visibleCategories = filteredCatalog.categories;
  const selectedCategoryNode = findCategoryByName(catalog, value.primaryCategory);
  const selectedInFiltered = findCategoryByName(filteredCatalog, value.primaryCategory);

  const availableSubcategories = useMemo(
    () => (selectedInFiltered ? selectedInFiltered.subcategories.map((sub) => sub.name) : []),
    [selectedInFiltered]
  );

  const selectOptions = useMemo(() => {
    const visibleHasSelected = visibleCategories.some((c) => c.name === value.primaryCategory);
    if (visibleHasSelected || !selectedCategoryNode) return visibleCategories;
    return [selectedCategoryNode, ...visibleCategories];
  }, [visibleCategories, selectedCategoryNode, value.primaryCategory]);

  const selectionEmpty = value.selectedSubcategories.length === 0;
  const showError = showValidationError && selectionEmpty;
  const hasQuery = normalizeSearchQuery(searchQuery).length > 0;

  const handleCategoryChange = (nextCategory: string) => {
    onChange(changePrimaryCategory(value, nextCategory));
  };

  const handleTogglePill = (subItem: string) => {
    onChange(toggleSubcategory(value, subItem));
  };

  const noVisibleCategories = visibleCategories.length === 0;
  const noMatchingPills = hasQuery && availableSubcategories.length === 0;
  const noMatchingAnything = hasQuery && noVisibleCategories;

  return (
    <div className="space-y-6">
      {/* ---------- Live / fallback taxonomy status ---------- */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-bold">
        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-[#6B2D8C]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Syncing live taxonomy from Supabase…
          </span>
        ) : isLive ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <Database className="w-3.5 h-3.5" />
            Live Supabase taxonomy
            <button
              type="button"
              onClick={reload}
              className="ml-1 text-[#6B2D8C] hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </span>
        ) : error ? (
          <span className="inline-flex items-center gap-1.5 text-[#93000a]">
            <CloudOff className="w-3.5 h-3.5" />
            Supabase unavailable — using local demo taxonomy
            <button
              type="button"
              onClick={reload}
              className="ml-1 text-[#6B2D8C] hover:underline cursor-pointer"
            >
              Retry
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[#8B7FA3]">
            <CloudOff className="w-3.5 h-3.5" />
            Local demo taxonomy (connect Supabase to make it fully dynamic)
          </span>
        )}
        <span className="text-[#8B7FA3] font-semibold">
          {visibleCategories.length} of {catalog.categories.length} categories
        </span>
      </div>

      {/* ---------- Real-time taxonomy search ---------- */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7FA3]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories & subcategories…"
          aria-label="Search categories and subcategories"
          data-testid="taxonomy-search-input"
          className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl pl-10 pr-9 py-3 text-[13.5px] font-medium text-[#2A0E3F] outline-none transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear taxonomy search"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#8B7FA3] hover:text-[#2A0E3F] hover:bg-[#F4F0E9] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {noMatchingAnything && (
        <p className="text-[12.5px] font-bold text-[#93000a]">
          No categories or subcategories match “{searchQuery.trim()}”. Clear the search to see the full taxonomy.
        </p>
      )}

      {/* ---------- Active Taxonomy Path chip area ---------- */}
      <div
        data-testid="active-taxonomy-path"
        className="bg-[#F5EEF8] border border-[#F0D5E3] rounded-2xl p-4 space-y-2 transition-all"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[11.5px] font-extrabold text-[#5B4A6E] tracking-wider uppercase">
            <FolderTree className="w-4 h-4 text-[#6B2D8C]" />
            <span>Active Taxonomy Path</span>
          </div>
          {!selectionEmpty && (
            <button
              type="button"
              onClick={() => onChange(clearSelectedSubcategories(value))}
              className="text-[11px] font-bold text-[#6B2D8C] hover:underline cursor-pointer"
            >
              Clear Selection ({value.selectedSubcategories.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[13px]" data-selected-count={value.selectedSubcategories.length}>
          <span className="bg-white text-[#6B2D8C] font-extrabold px-3 py-1.5 rounded-lg border border-[#f0d5e3] shadow-2xs flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-[#6B2D8C]" />
            {value.primaryCategory}
          </span>
          <ChevronRight className="w-4 h-4 text-[#6B2D8C]/60 shrink-0" />
          {selectionEmpty ? (
            <span className="text-[#8B7FA3] text-[12.5px] italic font-medium">
              {noMatchingPills
                ? `No subcategories match “${searchQuery.trim()}”`
                : 'Select one or more subcategories below'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5 items-center">
              {value.selectedSubcategories.map((subItem) => (
                <span
                  key={subItem}
                  data-testid="taxonomy-path-chip"
                  className="bg-[#6B2D8C] text-white font-bold px-3 py-1 rounded-lg text-[12px] flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  {subItem}
                  <button
                    type="button"
                    aria-label={`Remove ${subItem}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePill(subItem);
                    }}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Pickers ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Primary Category dropdown (auto-clears subcategories) */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#2A0E3F] flex items-center justify-between">
              <span>
                Primary Category <span className="text-[#E11D48]">*</span>
              </span>
              <span className="text-[11px] font-semibold text-[#8B7FA3]">Auto-clears subcategories on change</span>
            </label>
            <select
              value={value.primaryCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Primary Category"
              data-testid="primary-category-select"
              className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl px-4 py-3.5 text-[14px] font-medium text-[#2A0E3F] outline-none cursor-pointer transition-all"
            >
              {selectOptions.length === 0 && (
                <option value={value.primaryCategory}>{value.primaryCategory}</option>
              )}
              {selectOptions.map((catOption) => (
                <option key={catOption.id || catOption.name} value={catOption.name}>
                  {catOption.name}
                </option>
              ))}
            </select>
            {hasQuery && !noVisibleCategories && !selectOptions.some((c) => c.name === value.primaryCategory) && (
              <p className="text-[11px] font-semibold text-[#8B7FA3]">
                Current category doesn’t match the search — pick a highlighted match below.
              </p>
            )}
          </div>

          {/* Subcategory Multi-Select pills */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#2A0E3F] flex items-center justify-between">
              <span>
                Subcategory Multi-Select <span className="text-[#E11D48]">*</span>
              </span>
              <span
                className={`text-[11px] font-extrabold ${
                  selectionEmpty ? (showError ? 'text-[#93000a]' : 'text-[#8B7FA3]') : 'text-[#6B2D8C]'
                }`}
              >
                {selectionEmpty ? (showError ? 'Pick at least 1' : '0 Selected') : `${value.selectedSubcategories.length} Selected`}
              </span>
            </label>

            <div
              data-testid="subcategory-pill-group"
              data-available-count={availableSubcategories.length}
              className={`flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#FDFBF7] border rounded-xl ${
                showError ? 'border-[#E11D48]/60' : 'border-[#E8DEEF]'
              }`}
            >
              {availableSubcategories.length === 0 ? (
                <span className="text-[12px] font-semibold text-[#8B7FA3] italic">
                  {noMatchingPills
                    ? `No subcategory matches “${searchQuery.trim()}”.`
                    : 'Select a primary category to see its subcategories.'}
                </span>
              ) : (
                availableSubcategories.map((subItem) => {
                  const isSelected = value.selectedSubcategories.includes(subItem);
                  return (
                    <button
                      key={subItem}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleTogglePill(subItem)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#6B2D8C] text-white shadow-2xs border border-[#6B2D8C]'
                          : 'bg-white text-[#2A0E3F] border border-[#E8DEEF] hover:border-[#6B2D8C] hover:bg-[#F5EEF8]'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-[#8B7FA3] shrink-0" />
                      )}
                      <span>{subItem}</span>
                    </button>
                  );
                })
              )}
            </div>

            {showError && (
              <p className="text-[12px] font-bold text-[#93000a]">
                Please pick at least one subcategory so suppliers can match your request.
              </p>
            )}
          </div>
        </div>

        {/* Optional right column (visual references, etc.) */}
        {children && <div className="space-y-2">{children}</div>}
      </div>
    </div>
  );
};

export default ProductTaxonomySelector;
