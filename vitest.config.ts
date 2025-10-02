import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'tests/helpers/**',
      ],
    },
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid filesystem conflicts
      },
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/integration/api.test.ts', // Exclude API tests due to bcrypt native module issues
    ],
  },
  resolve: {
    alias: {
      '@cloutagent/types': path.resolve(__dirname, './packages/types/src'),
      '@cloutagent/backend': path.resolve(__dirname, './apps/backend/src'),
      '@cloutagent/frontend': path.resolve(__dirname, './apps/frontend/src'),
    },
  },
});
