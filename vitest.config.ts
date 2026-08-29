import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Test configuration reuses the application Vite config (aliases, React plugin)
 * and layers a jsdom test environment on top.
 */
export default defineConfig(async (env) => {
  const base = typeof viteConfig === 'function' ? await viteConfig(env) : viteConfig;

  return mergeConfig(
    base,
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        // CSS is not asserted in these tests; skipping it keeps the suite fast.
        css: false,
        restoreMocks: true,
      },
    }),
  );
});
