// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 360, height: 600 },
        // iPhone 13 device descriptor is mobile Safari; coerce headless Chromium
        // by overriding browserName so axe + lighthouse stays single-browser.
        browserName: 'chromium',
        isMobile: true,
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    // Test the *generated* static output. Single source of truth: a fresh
    // clone running `npm run test:e2e` produces .output/public and serves it.
    //
    // SPEC-002 — set a fixture GA4 measurement ID for the e2e build so
    // the active-path tests (consent banner, GA tag injection on
    // accept) have something to inject. The integration suite covers
    // the inert build (env var unset).
    //
    // We FORCE the fixture ID — never inherit from the developer's
    // shell or `.env`. Inheriting would leak the real GA4 ID into
    // screenshots, traces, and the leak-guard test, and would also
    // pollute analytics with synthetic e2e traffic.
    command: 'npm run generate && npm run preview',
    env: {
      NUXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST00000',
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
