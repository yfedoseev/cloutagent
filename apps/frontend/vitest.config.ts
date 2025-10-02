import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true, // Enable CSS processing for CSS variable tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.ts',
        'src/test/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@cloutagent/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
