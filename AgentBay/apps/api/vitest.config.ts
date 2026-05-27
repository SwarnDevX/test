import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Run integration tests serially — they share a real DB
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Load test env before any module is imported
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30_000,
  },
  resolve: {
    // Resolve workspace packages as Node.js ESM (avoid browser entry points in viem, etc.)
    conditions: ['import', 'node', 'default'],
  },
});
