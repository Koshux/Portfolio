// SPEC-002 — /legal/privacy generated output.
//
// The privacy page hosts the Cookie preferences trigger only when a
// measurement ID is configured (AC-9, revised). The inert build
// (no env var) MUST NOT render the trigger anywhere; the active
// build covered by analytics-build.spec.ts asserts it appears on
// the privacy page.
//
// This file pins the inert behaviour against the default vitest
// global-setup output.
import { describe, it, expect } from 'vitest'
import { readGeneratedHtml } from '../_helpers/generated'

describe('/legal/privacy — inert build', () => {
  const html = readGeneratedHtml('legal/privacy/index.html')

  it('renders the privacy notice content', () => {
    // ContentRenderer streams the markdown into the page; the H1
    // ("Privacy notice") comes from the markdown body. Vue inserts
    // comment markers inside element bodies for SSR hydration so we
    // assert with a tolerant regex.
    expect(html).toMatch(/<h1\b[^>]*>[^<]*(?:<!--[^>]*-->)*[^<]*Privacy notice/)
  })

  it('does NOT render the Cookie preferences trigger when no measurement ID is set (AC-9)', () => {
    // The literal string "Cookie preferences" appears in the privacy
    // notice body copy itself, so we assert only on the testid.
    expect(html).not.toContain('data-testid="cookie-preferences-link"')
  })

  it('still surfaces the always-on Privacy link in the header contact menu (AC-26)', () => {
    const headerStart = html.indexOf('<header')
    const headerEnd = html.indexOf('</header>')
    const header = html.slice(headerStart, headerEnd)
    expect(header).toMatch(/href="\/legal\/privacy"/)
  })
})
