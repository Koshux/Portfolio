// vitest.integration.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.spec.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.output/**', '.nuxt/**', 'dist/**'],
    globalSetup: ['tests/integration/global-setup.ts'],
    // `nuxt generate` is the heavy lifter; allow generous per-test timeouts.
    testTimeout: 30_000,
    hookTimeout: 180_000,
    // Specs share the `.output/public` directory and `content/live-signal.json`,
    // so they must run serially.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
})
