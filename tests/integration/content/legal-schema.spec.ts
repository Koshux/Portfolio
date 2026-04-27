// SPEC-002 — content schema validation for the legal collection.
//
// Verifies `content/legal/consent.md` and `content/legal/privacy.md`
// each parse against the consent frontmatter schema (which has all
// fields optional except `title`, so the privacy doc is also valid).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { consentFrontmatterSchema } from '../../../shared/content-schemas'

const ROOT = process.cwd()

function readFrontmatter(path: string): unknown {
  const raw = readFileSync(resolve(ROOT, path), 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) throw new Error(`No frontmatter found in ${path}`)
  return parseYaml(match[1])
}

describe('content/legal/consent.md schema', () => {
  it('parses against consentFrontmatterSchema', () => {
    const fm = readFrontmatter('content/legal/consent.md')
    const result = consentFrontmatterSchema.safeParse(fm)
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('mentions Google Analytics 4 in the prompt copy (AC-17)', () => {
    const fm = readFrontmatter('content/legal/consent.md') as { prompt: string }
    expect(fm.prompt).toMatch(/Google Analytics 4/i)
  })

  it('declares both an acceptLabel and a declineLabel (≤ 20 chars each)', () => {
    const fm = readFrontmatter('content/legal/consent.md') as {
      acceptLabel: string
      declineLabel: string
    }
    expect(fm.acceptLabel.length).toBeLessThanOrEqual(20)
    expect(fm.declineLabel.length).toBeLessThanOrEqual(20)
  })

  it('points privacyHref at /legal/privacy', () => {
    const fm = readFrontmatter('content/legal/consent.md') as { privacyHref: string }
    expect(fm.privacyHref).toBe('/legal/privacy')
  })
})

describe('content/legal/privacy.md schema', () => {
  it('parses against consentFrontmatterSchema (optional fields all absent)', () => {
    const fm = readFrontmatter('content/legal/privacy.md')
    const result = consentFrontmatterSchema.safeParse(fm)
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('lists the privacy-flag categories collected and not-collected (AC-18)', () => {
    const raw = readFileSync(resolve(ROOT, 'content/legal/privacy.md'), 'utf8')
    expect(raw).toMatch(/page path/i)
    expect(raw).toMatch(/referrer/i)
    expect(raw).toMatch(/14 months/i)
    expect(raw).toMatch(/anonymise|anonymize/i)
    expect(raw).toMatch(/Cookie preferences/i)
    expect(raw).toMatch(/(Sec-GPC|Global Privacy Control|doNotTrack)/i)
  })
})
