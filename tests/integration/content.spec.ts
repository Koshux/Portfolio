import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { readGeneratedHtml } from './_helpers/generated'
import { cvFrontmatterSchema } from '../../shared/content-schemas'

const html = readGeneratedHtml()
// Vue/SSR escapes &, <, >, " in text nodes — decode the few entities we care
// about so we can match plain UTF-8 strings from the source markdown.
const decoded = html
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
const cvRaw = readFileSync(resolve(process.cwd(), 'content/cv.md'), 'utf8')
const cvFm = parseYaml(cvRaw.match(/^---\r?\n([\s\S]*?)\r?\n---/)![1]) as unknown
const cv = cvFrontmatterSchema.parse(cvFm)

describe('generated /index.html — content from content/cv.md', () => {
  it('renders every role title in the rendered HTML', () => {
    for (const role of cv.experience) {
      expect(decoded).toContain(role.title)
    }
  })

  it('renders role titles in reverse-chronological order', () => {
    const sorted = [...cv.experience].sort((a, b) => {
      const norm = (s: string) => (/^\d{4}$/.test(s) ? `${s}-01` : s)
      return norm(a.start) < norm(b.start) ? 1 : -1
    })
    let cursor = 0
    for (const role of sorted) {
      const idx = decoded.indexOf(role.title, cursor)
      expect(idx).toBeGreaterThan(-1)
      cursor = idx + role.title.length
    }
  })

  it('renders every skill group label and at least one item per group', () => {
    for (const group of cv.skills) {
      expect(decoded).toContain(group.label)
      expect(decoded).toContain(group.items[0]!)
    }
  })

  it('renders the email address exactly once (visible) and the mailto link', () => {
    expect(html).toContain('mailto:lanzonprojects@gmail.com')
    expect(html).toContain('lanzonprojects@gmail.com')
  })

  it('renders the literal "CV available on request" line', () => {
    expect(html).toContain('CV available on request')
  })

  it('renders the live-signal chip with role="status" and aria-live="polite"', () => {
    expect(html).toMatch(/role="status"[^>]*aria-live="polite"|aria-live="polite"[^>]*role="status"/)
  })

  it('renders the unavailable fallback string when live-signal.json is unavailable', () => {
    expect(html).toContain('GitHub · recent activity')
  })

  it('does not contain the legacy jameslanzon@gmail.com address', () => {
    expect(html).not.toContain('jameslanzon@gmail.com')
  })
})
