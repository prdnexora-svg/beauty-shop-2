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
    build: {
      rollupOptions: {
        output: {
          // Split the vendor libraries out of the app chunk. Without this the
          // whole bundle ships as one ~1.8 MB file, which trips Vite's 500 kB
          // chunk advisory on every build and defeats HTTP caching: one line of
          // app code invalidates React, Supabase and the icon set with it.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('/motion/') || id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          },
        },
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
  };
});
