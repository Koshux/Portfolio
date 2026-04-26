import { describe, it, expect } from 'vitest'
import { readGeneratedHtml } from './_helpers/generated'

const html = readGeneratedHtml()

describe('generated /index.html — landmarks & headings', () => {
  it('renders the skip link as the first focusable element targeting #main', () => {
    // First <a> in <body>.
    const body = html.slice(html.indexOf('<body'))
    const firstAnchor = body.match(/<a\b[^>]*>/)
    expect(firstAnchor).toBeTruthy()
    expect(firstAnchor![0]).toMatch(/href="#main"/)
  })

  it('renders <header> + <main id="main" tabindex="-1"> landmarks (no sitewide <footer> in iteration-7)', () => {
    expect(html).toMatch(/<header\b/)
    expect(html).toMatch(/<main\b[^>]*\bid="main"[^>]*\btabindex="-1"/)
    // Iteration-7: the sitewide footer was removed; copyright now lives
    // in the contact section aside (see content.spec.ts).
    expect(html).not.toMatch(/<footer\b/)
  })

  it('renders the sticky header (Tailwind sticky top-0)', () => {
    expect(html).toMatch(/<header\b[^>]*\bclass="[^"]*\bsticky\b[^"]*\btop-0\b/)
  })

  it('renders the header right cluster in DOM order: LiveSignal → ContactMenu (GitHub → Email → LinkedIn)', () => {
    const headerStart = html.indexOf('<header')
    const headerEnd = html.indexOf('</header>')
    expect(headerStart).toBeGreaterThan(-1)
    expect(headerEnd).toBeGreaterThan(headerStart)
    const header = html.slice(headerStart, headerEnd)
    const liveSignalIdx = header.search(/role="status"/)
    // ContactMenu uses https://github.com/koshux for the GitHub link.
    const githubIdx = header.search(/href="https:\/\/github\.com\/koshux"/)
    const emailIdx = header.search(/href="mailto:lanzonprojects@gmail\.com"/)
    const linkedinIdx = header.search(/href="https:\/\/www\.linkedin\.com\/in\/jameslanzon"/)
    expect(liveSignalIdx).toBeGreaterThan(-1)
    expect(githubIdx).toBeGreaterThan(liveSignalIdx)
    expect(emailIdx).toBeGreaterThan(githubIdx)
    expect(linkedinIdx).toBeGreaterThan(emailIdx)
  })

  it('exposes exactly one <h1> and four <h2> headings (Experience, Skills, Projects, Contact)', () => {
    const h1Count = (html.match(/<h1\b/g) ?? []).length
    const h2Count = (html.match(/<h2\b/g) ?? []).length
    expect(h1Count).toBe(1)
    expect(h2Count).toBe(4)
  })

  it('emits one <h3> per role plus one per skill group (no level skipped)', () => {
    const h3Count = (html.match(/<h3\b/g) ?? []).length
    expect(h3Count).toBeGreaterThanOrEqual(2)
    // No <h4>, <h5>, or <h6> (heading hierarchy is exactly H1 → H2 → H3).
    expect(html).not.toMatch(/<h4\b/)
    expect(html).not.toMatch(/<h5\b/)
    expect(html).not.toMatch(/<h6\b/)
  })
})
