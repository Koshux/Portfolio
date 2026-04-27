// SPEC-002 — analytics build modes (AC-9, AC-24, AC-26) — revised.
//
// Verifies the static HTML produced by `nuxt generate` in two
// configurations:
//   1. **inert** — no `NUXT_PUBLIC_GA_MEASUREMENT_ID` env var (default
//      vitest globalSetup state). The build must contain no GA tag,
//      no Cookie preferences trigger anywhere, and (still) the
//      always-on Privacy link in the header contact menu.
//   2. **active** — env var set to a fixture ID. The build must
//      *still* contain no GA tag in the static HTML (the script is
//      injected only after the visitor accepts), and the Cookie
//      preferences trigger MUST live on `/legal/privacy` only — never
//      on `/`. The Privacy link is in the header contact menu in both
//      modes.
//
// AC-24 — the consent prompt MUST NOT appear in the static HTML
// regardless of mode (it is wrapped in <ClientOnly>).
import { afterAll, beforeAll, describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const OUTPUT_HOME = resolve(ROOT, '.output/public/index.html')
const OUTPUT_PRIVACY = resolve(ROOT, '.output/public/legal/privacy/index.html')

function readOutput(file: string = OUTPUT_HOME): string {
  return readFileSync(file, 'utf8')
}

function runGenerate(env: Record<string, string | undefined>): void {
  const fullEnv = { ...process.env, ...env, SKIP_LIVE_SIGNAL_FETCH: '1' } as NodeJS.ProcessEnv
  execSync('npm run generate', { cwd: ROOT, env: fullEnv, stdio: 'inherit' })
}

describe('analytics build — inert (no env var)', () => {
  // The vitest globalSetup already produced an inert build.
  const inertHome = readOutput(OUTPUT_HOME)
  const inertPrivacy = readOutput(OUTPUT_PRIVACY)

  it('home: does not contain a googletagmanager script tag', () => {
    expect(inertHome).not.toMatch(/googletagmanager/i)
    expect(inertHome).not.toMatch(/<script[^>]+gtag\/js/)
    expect(inertHome).not.toMatch(/G-[A-Z0-9]{6,}/)
  })

  it('home: does not render the Cookie preferences trigger anywhere', () => {
    expect(inertHome).not.toContain('data-testid="cookie-preferences-link"')
    expect(inertHome).not.toContain('Cookie preferences')
  })

  it('home: renders the always-on Privacy link in the header contact menu (AC-26)', () => {
    // The Privacy link lives inside the <header> contact menu now.
    const headerStart = inertHome.indexOf('<header')
    const headerEnd = inertHome.indexOf('</header>')
    expect(headerStart).toBeGreaterThan(-1)
    const header = inertHome.slice(headerStart, headerEnd)
    expect(header).toMatch(/href="\/legal\/privacy"/)
  })

  it('home: does not render a sitewide <footer> (AC-26 revised)', () => {
    expect(inertHome).not.toMatch(/<footer\b/)
  })

  it('home: does not render the consent prompt markup (AC-24, ClientOnly)', () => {
    expect(inertHome).not.toContain('id="consent-title"')
    expect(inertHome).not.toContain('data-testid="consent-prompt"')
    expect(inertHome).not.toContain('btn-consent')
  })

  it('privacy page: does NOT render the Cookie preferences trigger when no measurement ID is set (AC-9)', () => {
    expect(inertPrivacy).not.toContain('data-testid="cookie-preferences-link"')
  })
})

describe('analytics build — active (env var set)', () => {
  let activeHome = ''
  let activePrivacy = ''

  beforeAll(() => {
    runGenerate({ NUXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST00000' })
    activeHome = readOutput(OUTPUT_HOME)
    activePrivacy = readOutput(OUTPUT_PRIVACY)
  }, 180_000)

  afterAll(() => {
    // Restore the inert build so subsequent specs in this suite see a
    // measurement-id-free `.output/public`.
    runGenerate({ NUXT_PUBLIC_GA_MEASUREMENT_ID: '' })
  }, 180_000)

  it('home: still does not embed a GA script tag in the static HTML', () => {
    // The script is consent-gated, never injected at build time.
    expect(activeHome).not.toMatch(/<script[^>]+gtag\/js/)
  })

  it('home: does NOT render the Cookie preferences trigger (it lives only on /legal/privacy)', () => {
    expect(activeHome).not.toContain('data-testid="cookie-preferences-link"')
  })

  it('home: still does not contain the consent prompt markup (AC-24)', () => {
    expect(activeHome).not.toContain('id="consent-title"')
    expect(activeHome).not.toContain('data-testid="consent-prompt"')
  })

  it('home: still does not render a sitewide <footer> (AC-26 revised)', () => {
    expect(activeHome).not.toMatch(/<footer\b/)
  })

  it('home: still renders the Privacy link in the header contact menu (AC-26)', () => {
    const headerStart = activeHome.indexOf('<header')
    const headerEnd = activeHome.indexOf('</header>')
    const header = activeHome.slice(headerStart, headerEnd)
    expect(header).toMatch(/href="\/legal\/privacy"/)
  })

  it('privacy page: renders the Cookie preferences trigger when measurement ID is set (AC-9)', () => {
    expect(activePrivacy).toContain('data-testid="cookie-preferences-link"')
  })
})
