// ============================================================================
// NEXORA LUXE — MEDIA COMPONENT RENDER SMOKE TESTS
//
// Server-renders the media components with React 19's `renderToString` to
// prove they mount without crashing, show the right controls, and respect
// permissions. No browser required — these catch broken imports, bad hooks
// and gating regressions that unit tests on pure logic cannot see.
//
// Run with: npm run test:media (executed after tests/media.test.ts)
// ============================================================================

import React from 'react';
import { renderToString } from 'react-dom/server';

import { MediaUploader } from '../src/components/media/MediaUploader';
import { MediaGallery } from '../src/components/media/MediaGallery';
import { MediaPlayer } from '../src/components/media/MediaPlayer';
import { SecureImage } from '../src/components/media/SecureImage';
import { MediaLibraryModal } from '../src/components/media/MediaLibraryModal';
import { StorageHealthPanel } from '../src/components/media/StorageHealthPanel';
import type { MediaAsset } from '../src/lib/mediaService';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function render(element: React.ReactElement): string {
  return renderToString(element);
}

const OWNER = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    ownerId: OWNER,
    bucket: 'product-media',
    path: `${OWNER}/product/2026/08/serum.png`,
    publicUrl: null,
    mediaKind: 'image',
    visibility: 'public',
    scope: 'product',
    entityType: 'product',
    entityId: 'product-1',
    mimeType: 'image/png',
    byteSize: 204800,
    originalName: 'serum.png',
    width: 1200,
    height: 1200,
    durationSeconds: null,
    status: 'ready',
    errorMessage: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocal: true,
    localUrl: null,
    ...overrides,
  };
}

console.log('\n\x1b[1mComponent render smoke tests\x1b[0m');

// ---------------------------------------------------------------------------
try {
  const html = render(
    React.createElement(MediaUploader, {
      ownerId: OWNER,
      scope: 'compliance',
      variant: 'dropzone',
    }),
  );
  check('MediaUploader renders', html.length > 0);
  check('uploader shows a dropzone affordance', /upload|drag/i.test(html));
  check('uploader shows the scope constraint hint', /PDF|MB/i.test(html));
} catch (error: any) {
  check('MediaUploader renders', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(
    React.createElement(MediaUploader, {
      ownerId: null,
      scope: 'compliance',
      variant: 'dropzone',
      value: asset(),
    }),
  );
  check('uploader renders with an existing asset', html.includes('serum.png'));
  check('uploader offers Replace and Remove', /Replace/.test(html) && /Remove|aria-label="Remove file"/.test(html));
} catch (error: any) {
  check('uploader renders with an existing asset', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(
    React.createElement(MediaGallery, {
      assets: [asset(), asset({ id: 'asset-2', mediaKind: 'video', mimeType: 'video/mp4', originalName: 'tour.mp4', durationSeconds: 42 })],
      ownerId: OWNER,
      canManage: true,
    }),
  );
  check('MediaGallery renders', html.length > 0);
  check('gallery renders an image tile', html.includes('serum.png'));
  check('gallery renders a video tile', html.includes('tour.mp4'));
  check('gallery exposes delete controls to the owner', html.includes('Delete') || html.includes('aria-label="Delete"'));
  check('gallery offers "Add media" to a manager', html.includes('Add media'));
} catch (error: any) {
  check('MediaGallery renders', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  // A non-owner must NOT get edit controls.
  const html = render(
    React.createElement(MediaGallery, {
      assets: [asset()],
      ownerId: 'someone-else',
      canManage: true,
    }),
  );
  check('gallery hides delete from non-owners', !html.includes('aria-label="Delete"'));
} catch (error: any) {
  check('gallery hides delete from non-owners', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(
    React.createElement(MediaPlayer, {
      src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Facility tour',
    }),
  );
  check('MediaPlayer renders', html.length > 0);
  check('MediaPlayer uses a YouTube iframe for platform URLs', html.includes('youtube.com/embed'));
} catch (error: any) {
  check('MediaPlayer renders', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(
    React.createElement(MediaPlayer, {
      asset: asset({ mediaKind: 'video', mimeType: 'video/mp4', bucket: 'videos', scope: 'video' }),
      title: 'Reel',
      aspect: 'reel',
    }),
  );
  check('MediaPlayer renders self-hosted video', html.length > 0);
  check('MediaPlayer keeps mobile-safe attributes', html.includes('playsinline') || html.includes('playsInline'));
} catch (error: any) {
  check('MediaPlayer renders self-hosted video', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(React.createElement(SecureImage, { src: 'https://example.com/a.png', alt: 'A' }));
  check('SecureImage renders without throwing', typeof html === 'string');
} catch (error: any) {
  check('SecureImage renders without throwing', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(
    React.createElement(MediaLibraryModal, {
      isOpen: true,
      onClose: () => {},
      ownerId: null,
      onSelect: () => {},
    }),
  );
  check('MediaLibraryModal renders', html.length > 0);
  check('library prompts sign-in when there is no owner', /sign in/i.test(html));
} catch (error: any) {
  check('MediaLibraryModal renders', false, error?.message);
}

// ---------------------------------------------------------------------------
try {
  const html = render(React.createElement(StorageHealthPanel, {}));
  check('StorageHealthPanel renders', html.length > 0);
  check('panel lists all five buckets', ['avatars', 'product-media', 'ad-creatives', 'videos', 'documents'].every((b) => html.includes(b)));
  check('panel offers the self-test action', /self-test/i.test(html));
  check('panel reports demo mode when unconfigured', /demo mode/i.test(html));
} catch (error: any) {
  check('StorageHealthPanel renders', false, error?.message);
}

// ---------------------------------------------------------------------------
console.log(`\n  passed: \x1b[32m${passed}\x1b[0m  failed: \x1b[31m${failed}\x1b[0m`);
if (failed > 0) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
