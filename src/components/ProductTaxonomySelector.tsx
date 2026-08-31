import React from 'react';
import { CheckCircle2, ChevronRight, FolderTree, Plus, X } from 'lucide-react';
import {
  PRIMARY_CATEGORIES,
  getAvailableSubcategories,
  changePrimaryCategory,
  toggleSubcategory,
  clearSelectedSubcategories,
  isTaxonomySelectionValid,
  type TaxonomySelectionState
} from './taxonomyFormHandler';

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
 *  ┌────────────────────────────────────────────────────┐
 *  │ ACTIVE TAXONOMY PATH  Skincare › [Serums] [Creams] │  ← chip tracker
 *  ├────────────────────────────────────────────────────┤
 *  │ Primary Category ▾        │ Subcategory pills ⬒⬒⬒  │  ← multi-select
 *  └────────────────────────────────────────────────────┘
 *
 * - Primary Category dropdown auto-clears subcategory selections on change
 * - Subcategory pills are multi-select with live count + checkmarks
 * - Fully controlled, Tailwind-styled, mobile-first responsive
 */
export const ProductTaxonomySelector: React.FC<ProductTaxonomySelectorProps> = ({
  value,
  onChange,
  showValidationError = false,
  children
}) => {
  const availableSubcategories = getAvailableSubcategories(value.primaryCategory);
  const selectionEmpty = value.selectedSubcategories.length === 0;
  const showError = showValidationError && selectionEmpty;

  const handleCategoryChange = (nextCategory: string) => {
    onChange(changePrimaryCategory(value, nextCategory));
  };

  const handleTogglePill = (subItem: string) => {
    onChange(toggleSubcategory(value, subItem));
  };

  return (
    <div className="space-y-6">
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
              Select one or more subcategories below
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
              {PRIMARY_CATEGORIES.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
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
              className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#FDFBF7] border rounded-xl ${
                showError ? 'border-[#E11D48]/60' : 'border-[#E8DEEF]'
              }"
            >
              {availableSubcategories.map((subItem) => {
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
              })}
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
