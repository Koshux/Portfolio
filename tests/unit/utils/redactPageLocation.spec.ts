// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { redactPageLocation } from '../../../app/utils/redactPageLocation'

describe('redactPageLocation', () => {
  it('strips arbitrary query params and the fragment', () => {
    expect(redactPageLocation('https://jameslanzon.com/?email=foo@bar.com&token=abc#hi'))
      .toBe('https://jameslanzon.com/')
  })

  it('keeps the five UTM marketing params', () => {
    expect(redactPageLocation('https://jameslanzon.com/?utm_source=li&email=foo@bar.com#hi'))
      .toBe('https://jameslanzon.com/?utm_source=li')
  })

  it('keeps multiple UTM params and drops everything else', () => {
    const out = redactPageLocation('https://jameslanzon.com/x?utm_source=li&utm_campaign=spring&secret=hi#frag')
    expect(out).toContain('utm_source=li')
    expect(out).toContain('utm_campaign=spring')
    expect(out).not.toContain('secret')
    expect(out).not.toContain('#frag')
  })

  it('handles a referrer with no query params and no fragment', () => {
    expect(redactPageLocation('https://example.com/path/'))
      .toBe('https://example.com/path/')
  })

  it('returns empty string for malformed input', () => {
    expect(redactPageLocation('not a url')).toBe('')
  })

  it('returns the input untouched when empty', () => {
    expect(redactPageLocation('')).toBe('')
  })

  it('strips fragment even when no query params exist', () => {
    expect(redactPageLocation('https://jameslanzon.com/#section'))
      .toBe('https://jameslanzon.com/')
  })

  it('does not pass through utm-prefixed-but-unknown params', () => {
    const out = redactPageLocation('https://jameslanzon.com/?utm_foo=bar&utm_source=li')
    expect(out).toContain('utm_source=li')
    expect(out).not.toContain('utm_foo')
  })
})
