import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { cvFrontmatterSchema, liveSignalSchema } from '../../../shared/content-schemas'

const ROOT = process.cwd()

function readFrontmatter(path: string): unknown {
  const raw = readFileSync(resolve(ROOT, path), 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) throw new Error(`No frontmatter found in ${path}`)
  return parseYaml(match[1])
}

describe('content/cv.md schema', () => {
  it('parses against cvFrontmatterSchema with no errors', () => {
    const fm = readFrontmatter('content/cv.md')
    const result = cvFrontmatterSchema.safeParse(fm)
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('uses lanzonprojects@gmail.com (not the legacy address)', () => {
    const fm = readFrontmatter('content/cv.md') as { contact: { email: string } }
    expect(fm.contact.email).toBe('lanzonprojects@gmail.com')
  })

  it('does NOT define a `cv:` block (CV is not downloadable in iteration 1)', () => {
    const fm = readFrontmatter('content/cv.md') as Record<string, unknown>
    expect(fm).not.toHaveProperty('cv')
  })
})

describe('content/live-signal.json schema', () => {
  it('parses against liveSignalSchema (unavailable branch)', () => {
    const raw = readFileSync(resolve(ROOT, 'content/live-signal.json'), 'utf8')
    const json = JSON.parse(raw)
    const result = liveSignalSchema.safeParse(json)
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2))
    }
    expect(result.success).toBe(true)
  })

  it('also accepts a populated commit-data fixture', () => {
    const fixture = {
      repo: 'jameslanzon/Portfolio',
      sha: 'abc1234',
      timestamp: '2026-04-26T12:00:00Z',
      fetchedAt: '2026-04-26T12:05:00Z',
    }
    expect(liveSignalSchema.safeParse(fixture).success).toBe(true)
  })
})
