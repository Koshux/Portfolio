// tests/integration/global-setup.ts
//
// Vitest globalSetup: runs `nuxt generate` once before the integration
// suite so each spec can read `.output/public/index.html` directly. This
// avoids @nuxt/test-utils `setup()` (known to be flaky on Windows) and
// keeps integration tests close to the deployed artefact.
//
// `SKIP_LIVE_SIGNAL_FETCH=1` is passed to keep the seeded
// `content/live-signal.json` (the unavailable fallback) intact.
import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const OUTPUT_HTML = resolve(ROOT, '.output/public/index.html')

export default async function () {
  // Allow opting out (e.g. when a previous spec has already produced the
  // output and we want a fast inner loop).
  if (process.env.SKIP_INT_GENERATE === '1' && existsSync(OUTPUT_HTML)) {
    return
  }

  // Force the inert build for integration: no GA4 measurement ID,
  // regardless of the developer's `.env` or shell. Nuxt's auto-dotenv
  // loader would otherwise bake the real ID into the static output and
  // break the inert-path assertions in
  // `tests/integration/pages/analytics-build.spec.ts`. We point Nuxt
  // at an empty fixture dotenv file (`tests/integration/.env.empty`)
  // to short-circuit `.env` discovery, and explicitly clear the env
  // key as a belt-and-braces guard.
  const env = {
    ...process.env,
    SKIP_LIVE_SIGNAL_FETCH: '1',
    NUXT_PUBLIC_GA_MEASUREMENT_ID: '',
  }
  // Quietly invoke npm run generate so failures bubble up with stdio.
  execSync('npx nuxt generate --dotenv tests/integration/.env.empty', {
    cwd: ROOT,
    env,
    stdio: 'inherit',
  })

  if (!existsSync(OUTPUT_HTML)) {
    throw new Error(`integration global-setup: expected ${OUTPUT_HTML} after npm run generate`)
  }
  const size = statSync(OUTPUT_HTML).size
  if (size < 1000) {
    throw new Error(`integration global-setup: ${OUTPUT_HTML} is suspiciously small (${size} bytes)`)
  }
}
