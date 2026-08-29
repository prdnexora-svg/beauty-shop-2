import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Vendor chunks are split by update cadence, not by size:
 *   - react      : runtime + renderer, shared by every route
 *   - supabase   : auth/realtime client (changes rarely, cached for months)
 *   - motion     : animation runtime used by the workspace screens
 *   - icons      : lucide icon set
 * Keeping them out of the entry chunk means a deploy only invalidates the
 * application chunk for most changes.
 */
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules\/(react-dom|react|scheduler)\//.test(id)) return 'react';
  if (id.includes('@supabase')) return 'supabase';
  if (/node_modules\/(framer-motion|motion|motion-dom|motion-utils)\//.test(id)) {
    return 'motion';
  }
  if (id.includes('lucide-react')) return 'icons';
  return 'vendor';
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // `chunkSizeWarningLimit` is intentionally left at Vite's 500 kB default:
      // the entry chunk stays under it through real code-splitting rather than
      // by silencing the warning.
      rollupOptions: {
        output: {
          manualChunks: vendorChunk,
        },
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
