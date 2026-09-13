/**
 * Brand Directory — dedicated empty-state regression guards.
 *
 * When the live supplier fetch finishes and the current search query /
 * category filters match zero brands, the Brand Directory & Search page must
 * show a dedicated empty state ("No brands found" / "Try another search or
 * select a different category") instead of a bare grid. The state must not
 * flash while the initial fetch is still loading, and it must offer a working
 * recovery action that resets every active filter.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const SCREEN_PATH = path.join(
  REPO_ROOT,
  'src',
  'components',
  'BrandDirectoryDetailScreen.tsx'
);
const source = fs.readFileSync(SCREEN_PATH, 'utf8');

test('renders the required empty-state copy', () => {
  assert.ok(
    source.includes('No brands found'),
    'empty state must display the heading "No brands found"'
  );
  assert.ok(
    source.includes('Try another search or select a different category'),
    'empty state must display the hint "Try another search or select a different category"'
  );
});

test('the legacy empty-state heading has been removed', () => {
  assert.ok(
    !source.includes('No formulation brands found'),
    'old "No formulation brands found" copy should be replaced by the dedicated empty state'
  );
});

test('empty state is gated behind the loaded flag so it never flashes during fetch', () => {
  assert.ok(
    /!isLoadingBrands\s*&&\s*filteredBrands\.length\s*===\s*0/.test(source),
    'empty state must render only when loading has finished with zero matches'
  );
});

test('empty state is exposed to assistive tech and tests', () => {
  assert.ok(
    source.includes('data-testid="brand-directory-empty-state"'),
    'empty state needs a stable testid hook'
  );
  assert.ok(
    /role="status"/.test(source) && /aria-live="polite"/.test(source),
    'empty state should announce itself as a polite live region'
  );
});

test('offers a one-click recovery that resets both the search and category filters', () => {
  // handleClearFilters must reset every filter that can cause a zero-result view.
  const handlerMatch = source.match(
    /const handleClearFilters[\s\S]*?\n  \};/
  );
  assert.ok(handlerMatch, 'a handleClearFilters handler must be defined');
  const handlerBody = handlerMatch![0];
  assert.ok(handlerBody.includes("setSearchQuery('')"), 'handler must clear the search query');
  assert.ok(
    handlerBody.includes("setSelectedCategory('All')"),
    'handler must reset the category back to All'
  );
  assert.ok(
    handlerBody.includes("setSortBy('Relevance')"),
    'handler must reset sorting to the default'
  );
  assert.ok(
    /onClick=\{handleClearFilters\}/.test(source),
    'the clear-filters action must be wired to a real button'
  );
});
