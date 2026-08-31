import React, { useMemo, useRef, useState, useId } from 'react';
import { Search, X, TrendingUp, CornerDownLeft } from 'lucide-react';
import {
  searchProductTemplates,
  getMatchRanges,
  nextActiveIndex,
  type ProductTemplate
} from '../data/productTemplates';

interface SearchableProductComboboxProps {
  /** current requirement name (controlled) */
  value: string;
  /** free typing always stays allowed */
  onChange: (next: string) => void;
  /** fired when the buyer picks a template from the dropdown */
  onSelectTemplate: (template: ProductTemplate) => void;
  placeholder?: string;
  /** render with the dropdown open (used by tests / storybook-style previews) */
  initiallyOpen?: boolean;
  maxSuggestions?: number;
}

/** Render `text` with every match of `query` wrapped in <mark>. */
const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const ranges = useMemo(() => getMatchRanges(text, query), [text, query]);
  if (ranges.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="bg-[#F5EEF8] text-[#6B2D8C] rounded-sm px-0.5 font-extrabold">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
};

/**
 * B2B product search combobox for the RFQ "Product Name / Specific Requirement"
 * field.
 *
 * - search-as-you-type over a catalog of popular beauty products
 * - keyboard navigation: ↑/↓ move, Enter select, Esc close, Home/End jump
 * - matching text is highlighted; a clear (✕) button wipes the field
 * - free text is always allowed — picking a template is optional
 */
export const SearchableProductCombobox: React.FC<SearchableProductComboboxProps> = ({
  value,
  onChange,
  onSelectTemplate,
  placeholder = 'e.g., Vitamin C Serum, Matte Lipstick, Argan Hair Oil…',
  initiallyOpen = false,
  maxSuggestions = 8
}) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `product-suggestions-${useId()}`;

  const trimmed = value.trim();
  const suggestions = useMemo(
    () => (open ? searchProductTemplates(trimmed, maxSuggestions) : []),
    [open, trimmed, maxSuggestions]
  );
  const showNoMatch = open && trimmed.length > 0 && suggestions.length === 0;

  const handleSelect = (template: ProductTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => nextActiveIndex(e.key, prev, suggestions.length));
      return;
    }
    if (e.key === 'Enter' && open && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
  };

  return (
    <div className="relative" data-testid="product-combobox">
      {/* Input with search icon + clear button */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8B7FA3] pointer-events-none" />
        <input
          ref={inputRef}
          role="combobox"
          type="text"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && suggestions[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
          data-testid="product-combobox-input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20 rounded-xl pl-11 pr-11 py-3.5 text-[14px] font-medium text-[#2A0E3F] outline-none transition-all"
        />
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Clear search text"
            data-testid="product-combobox-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('');
              setActiveIndex(0);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#7E6C96] hover:text-[#2A0E3F] hover:bg-[#F4F0E9] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Product suggestions"
          data-testid="product-combobox-listbox"
          data-suggestion-count={suggestions.length}
          className="absolute z-30 left-0 right-0 mt-2 bg-white border border-[#E8DEEF] rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FDFBF7] border-b border-[#F4F0E9]">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#5B4A6E]">
              {trimmed.length === 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-[#6B2D8C]" />
                  Popular products
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-[#6B2D8C]" />
                  {suggestions.length > 0
                    ? `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} for “${trimmed}”`
                    : `No match for “${trimmed}”`}
                </>
              )}
            </span>
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-[#8B7FA3]">
              <kbd className="px-1.5 py-0.5 bg-[#F4F0E9] rounded border border-[#E8DEEF]">↑↓</kbd>
              navigate
              <kbd className="px-1.5 py-0.5 bg-[#F4F0E9] rounded border border-[#E8DEEF] ml-1">Enter</kbd>
              select
            </span>
          </div>

          {/* Options */}
          {suggestions.length > 0 && (
            <div className="max-h-72 overflow-y-auto py-1.5">
              {suggestions.map((template, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={template.id}
                    id={`${listId}-option-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-testid="product-option"
                    data-template-id={template.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(template)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                      isActive ? 'bg-[#F5EEF8]' : 'bg-white hover:bg-[#FDFBF7]'
                    }`}
                  >
                    <span className="text-xl leading-none shrink-0" aria-hidden="true">
                      {template.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[13.5px] font-bold truncate ${
                          isActive ? 'text-[#6B2D8C]' : 'text-[#2A0E3F]'
                        }`}
                      >
                        <HighlightedText text={template.name} query={trimmed} />
                      </span>
                      <span className="block text-[11px] font-semibold text-[#8B7FA3] truncate">
                        {template.category} › {template.subcategories.join(', ')}
                      </span>
                    </span>
                    {isActive && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-[#6B2D8C] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No match — free text stays valid */}
          {showNoMatch && (
            <div data-testid="product-combobox-no-match" className="px-4 py-5 text-center">
              <p className="text-[13px] font-bold text-[#2A0E3F]">
                No template match — no problem! ✍️
              </p>
              <p className="text-[12px] font-medium text-[#5B4A6E] mt-1">
                Keep your own text “{trimmed}” exactly as typed, or try a shorter word like
                {' '}<em>serum</em>, <em>shampoo</em> or <em>lipstick</em>.
              </p>
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2 bg-[#FDFBF7] border-t border-[#F4F0E9] text-[10.5px] font-semibold text-[#8B7FA3] text-center">
            Picking a suggestion also sets your category &amp; subcategories automatically — or just keep typing your own.
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableProductCombobox;
