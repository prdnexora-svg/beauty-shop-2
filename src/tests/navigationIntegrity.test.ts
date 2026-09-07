/**
 * Navigation integrity regression tests.
 *
 * The app routes through a single in-memory `currentScreen` state and the
 * access policy in `src/lib/roleAccess.ts`. Every literal screen id passed to a
 * navigation helper must therefore be one of the declared `ScreenId` values; a
 * typo (e.g. "search" or "suppliers" instead of "search-results" /
 * "supplier-directory") would otherwise render a blank page because the App has
 * no matching screen branch.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { SCREEN_ACCESS, type ScreenId } from '../lib/roleAccess';

const VALID_SCREEN_IDS = new Set<string>(Object.keys(SCREEN_ACCESS) as ScreenId[]);
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

const NAV_HELPER_REGEX = /(?:\b(?:onNavigate|handleNavigate|go|setCurrentScreen|navigate)\s*\??\s*\(\s*)'([a-z0-9-]+)'/g;

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function findInvalidNavLiterals(): Array<{ file: string; value: string }> {
  const invalid: Array<{ file: string; value: string }> = [];
  for (const file of collectSourceFiles(path.join(REPO_ROOT, 'src'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(NAV_HELPER_REGEX)) {
      const value = match[1];
      if (!VALID_SCREEN_IDS.has(value)) {
        invalid.push({ file: path.relative(REPO_ROOT, file), value });
      }
    }
  }
  return invalid;
}

test('every hard-coded navigation target is a declared screen', () => {
  const invalid = findInvalidNavLiterals();
  assert.deepEqual(
    invalid,
    [],
    `Found navigation literals that are not declared screens: ${invalid
      .map((item) => `${item.file} -> "${item.value}"`)
      .join(', ')}`,
  );
});

test('declared screens are internally consistent', () => {
  for (const id of Object.keys(SCREEN_ACCESS)) {
    assert.match(id, /^[a-z0-9-]+$/, `${id} must use a url-safe kebab-case id`);
  }
});

test('every declared screen has a render branch in App', () => {
  const appSource = fs.readFileSync(path.join(REPO_ROOT, 'src', 'App.tsx'), 'utf8');
  const missing: string[] = [];
  for (const id of Object.keys(SCREEN_ACCESS)) {
    if (!appSource.includes(`{currentScreen === '${id}' &&`)) {
      missing.push(id);
    }
  }
  assert.deepEqual(missing, [], `App.tsx has no render branch for declared screens: ${missing.join(', ')}`);
});

test('no dead placeholder or empty anchors remain in the UI', () => {
  const offenders: Array<{ file: string; line: number }> = [];
  for (const file of collectSourceFiles(path.join(REPO_ROOT, 'src', 'components'))) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (/\bhref\s*=\s*(?:"#"|'#'|""|'')/.test(line)) {
        offenders.push({ file: path.relative(REPO_ROOT, file), line: index + 1 });
      }
    });
  }
  assert.deepEqual(offenders, [], `Found dead anchors: ${offenders.map((o) => `${o.file}:${o.line}`).join(', ')}`);
});

test('all target="_blank" anchors carry noopener and noreferrer', () => {
  const offenders: Array<{ file: string; line: number }> = [];
  for (const file of collectSourceFiles(path.join(REPO_ROOT, 'src', 'components'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/target="_blank"/g)) {
      const before = source.slice(Math.max(0, match.index - 800), match.index);
      const after = source.slice(match.index, match.index + 800);
      const fragment = `${before}${after}`;
      if (!fragment.includes('noopener') || !fragment.includes('noreferrer')) {
        const line = source.slice(0, match.index).split('\n').length;
        offenders.push({ file: path.relative(REPO_ROOT, file), line });
      }
    }
  }
  assert.deepEqual(offenders, [], `Found target="_blank" without rel safety tokens: ${offenders.map((o) => `${o.file}:${o.line}`).join(', ')}`);
});
