import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // Playwright specs live in tests/e2e and are run by `npm run test:e2e`.
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` throws outside a React Server Component; unit tests run
      // server modules directly in Node, so it is stubbed here only.
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
    },
  },
});
