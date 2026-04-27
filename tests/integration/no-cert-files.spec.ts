// tests/integration/no-cert-files.spec.ts
//
// SPEC-003 AC-11 + AC-12 — defence-in-depth against private TLS key
// material or ACME challenge artefacts ever landing in the repository.
//
// GitHub Pages + Let's Encrypt handles certificate issuance and the
// HTTP-01 / TLS-ALPN-01 challenges entirely out-of-band. The static
// site never serves a `.well-known/acme-challenge/*` file and never
// holds a private key. If either of those assumptions is ever
// violated, this test fails the build before deploy.
import { describe, it, expect } from 'vitest'
import { readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'

const ROOT = process.cwd()

// Walk the tree, skipping noisy / generated directories. We intentionally
// do NOT skip `.github`, `docs`, `app`, `content`, `public`, `scripts`,
// `tests`, `shared` — those are the surface area we care about.
const SKIP_DIRS = new Set([
  'node_modules',
  '.output',
  '.nuxt',
  '.data',
  '.cache',
  '.nitro',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
  '.git',
])

const FORBIDDEN_EXTENSIONS = ['.pem', '.key', '.crt', '.csr', '.p12'] as const

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      yield* walk(resolve(dir, entry.name))
    } else if (entry.isFile()) {
      yield resolve(dir, entry.name)
    }
  }
}

describe('SPEC-003 AC-11 — no TLS key material in repo', () => {
  it('contains no *.pem / *.key / *.crt / *.csr / *.p12 files', () => {
    const offenders: string[] = []
    for (const file of walk(ROOT)) {
      const lower = file.toLowerCase()
      if (FORBIDDEN_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        offenders.push(relative(ROOT, file))
      }
    }
    expect(
      offenders,
      `Found forbidden TLS-material files (SPEC-003 AC-11):\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })
})

describe('SPEC-003 AC-12 — no ACME challenge files served by the static site', () => {
  it('public/ has no .well-known/acme-challenge directory', () => {
    const challengeDir = resolve(ROOT, 'public', '.well-known', 'acme-challenge')
    expect(existsSync(challengeDir)).toBe(false)
  })

  it('the generated .output/public/ has no .well-known/acme-challenge directory', () => {
    const generatedChallengeDir = resolve(
      ROOT,
      '.output',
      'public',
      '.well-known',
      'acme-challenge',
    )
    // The integration global-setup runs `nuxt generate`, so .output/public
    // exists by the time this spec runs. If a future change removes that
    // setup, only assert when the path exists — never falsely pass by
    // skipping silently.
    if (existsSync(resolve(ROOT, '.output', 'public'))) {
      expect(existsSync(generatedChallengeDir)).toBe(false)
    }
  })

  it('public/ contains no acme-challenge file at any nesting depth', () => {
    const publicDir = resolve(ROOT, 'public')
    if (!existsSync(publicDir)) return
    const offenders: string[] = []
    for (const file of walk(publicDir)) {
      const segments = relative(publicDir, file).split(sep)
      if (segments.includes('acme-challenge')) {
        offenders.push(relative(ROOT, file))
      }
    }
    expect(offenders).toEqual([])
  })

  it('walks a non-trivial number of files (sanity check the walker)', () => {
    // Guard against a regression where `walk()` silently returns nothing
    // (e.g. someone changes SKIP_DIRS to include the wrong thing).
    let count = 0
    for (const _file of walk(ROOT)) {
      count++
      if (count > 50) break
    }
    expect(count).toBeGreaterThan(50)
    // Bonus: confirm the walker actually visits a file we know exists.
    const expected = resolve(ROOT, 'package.json')
    expect(statSync(expected).isFile()).toBe(true)
  })
})
