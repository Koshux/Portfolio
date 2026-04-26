import { describe, it, expect } from 'vitest'
import { readGeneratedHtml } from './_helpers/generated'

const html = readGeneratedHtml()

describe('generated /index.html — head', () => {
  it('has <html lang="en">', () => {
    expect(html).toMatch(/<html\b[^>]*\blang="en"/)
  })

  it('has a non-empty <title> referencing James Lanzon', () => {
    const m = html.match(/<title>([^<]+)<\/title>/)
    expect(m).toBeTruthy()
    expect(m![1]).toMatch(/James Lanzon/)
  })

  it('emits og:title, og:description, og:image, og:url, og:type meta tags', () => {
    expect(html).toMatch(/<meta[^>]+property="og:title"[^>]+content="[^"]*James Lanzon[^"]*"/)
    expect(html).toMatch(/<meta[^>]+property="og:description"[^>]+content="[^"]+"/)
    expect(html).toMatch(/<meta[^>]+property="og:image"[^>]+content="https:\/\/jameslanzon\.com\/og\/og-image\.png"/)
    expect(html).toMatch(/<meta[^>]+property="og:url"[^>]+content="https:\/\/jameslanzon\.com\/"/)
    expect(html).toMatch(/<meta[^>]+property="og:type"[^>]+content="website"/)
  })

  it('emits twitter:card=summary_large_image and twitter:image', () => {
    expect(html).toMatch(/<meta[^>]+name="twitter:card"[^>]+content="summary_large_image"/)
    expect(html).toMatch(/<meta[^>]+name="twitter:image"[^>]+content="https:\/\/jameslanzon\.com\/og\/og-image\.png"/)
  })

  it('emits the favicon link set and a manifest link', () => {
    expect(html).toMatch(/<link[^>]+rel="icon"[^>]+type="image\/svg\+xml"[^>]+href="\/favicon\.svg"/)
    expect(html).toMatch(/<link[^>]+rel="icon"[^>]+href="\/favicon\.ico"/)
    expect(html).toMatch(/<link[^>]+rel="icon"[^>]+sizes="32x32"[^>]+href="\/favicon-32\.png"/)
    expect(html).toMatch(/<link[^>]+rel="icon"[^>]+sizes="16x16"[^>]+href="\/favicon-16\.png"/)
    expect(html).toMatch(/<link[^>]+rel="apple-touch-icon"[^>]+sizes="180x180"[^>]+href="\/apple-touch-icon\.png"/)
    expect(html).toMatch(/<link[^>]+rel="manifest"[^>]+href="\/site\.webmanifest"/)
  })

  it('emits the theme-color meta tag', () => {
    expect(html).toMatch(/<meta[^>]+name="theme-color"[^>]+content="#0b1020"/)
  })

  it('does not contain the legacy jameslanzon@gmail.com address', () => {
    expect(html).not.toContain('jameslanzon@gmail.com')
  })
})
