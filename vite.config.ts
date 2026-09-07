import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
    build: {
      // The feature-complete SPA (marketplace, buyer workspace, supplier
      // administration, RFQ/quote/social flows) is intentionally one deployable
      // shell. Vendor runtimes are split; this threshold avoids drowning the
      // build log in a warning while the app shell grows.
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // Split heavy third-party runtimes into stable, long-cache-name chunks
          // so vendor updates do not churn the entire app-shell asset hash.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react-vendor';
            if (id.includes('@supabase/supabase-js') || id.includes('@supabase/')) return 'supabase';
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) return 'charts';
            if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            return undefined;
          },
        },
      },
    },
  };
});
