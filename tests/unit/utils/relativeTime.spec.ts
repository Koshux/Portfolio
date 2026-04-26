import { describe, it, expect } from 'vitest'
import { relativeTime } from '../../../app/utils/relativeTime'

const NOW = Date.parse('2026-04-26T12:00:00Z')

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

describe('relativeTime', () => {
  it('returns "just now" for a 0ms diff', () => {
    expect(relativeTime(ago(0), NOW)).toBe('just now')
  })

  it('returns "just now" for less than 45 seconds', () => {
    expect(relativeTime(ago(44_000), NOW)).toBe('just now')
  })

  it('flips to minutes at the 45s boundary', () => {
    expect(relativeTime(ago(45_000), NOW)).toBe('1 minute ago')
  })

  it('formats minutes', () => {
    expect(relativeTime(ago(5 * 60_000), NOW)).toBe('5 minutes ago')
  })

  it('flips to hours at 60 minutes', () => {
    expect(relativeTime(ago(60 * 60_000), NOW)).toBe('1 hour ago')
  })

  it('formats hours', () => {
    expect(relativeTime(ago(3 * 60 * 60_000), NOW)).toBe('3 hours ago')
  })

  it('flips to days at 24 hours', () => {
    expect(relativeTime(ago(24 * 60 * 60_000), NOW)).toBe('1 day ago')
  })

  it('formats days', () => {
    expect(relativeTime(ago(3 * 24 * 60 * 60_000), NOW)).toBe('3 days ago')
  })

  it('flips to weeks at 7 days', () => {
    expect(relativeTime(ago(7 * 24 * 60 * 60_000), NOW)).toBe('1 week ago')
  })

  it('formats weeks', () => {
    expect(relativeTime(ago(2 * 7 * 24 * 60 * 60_000), NOW)).toBe('2 weeks ago')
  })

  it('flips to months at ~30 days', () => {
    expect(relativeTime(ago(30 * 24 * 60 * 60_000), NOW)).toBe('1 month ago')
  })

  it('formats months', () => {
    expect(relativeTime(ago(6 * 30 * 24 * 60 * 60_000), NOW)).toBe('6 months ago')
  })

  it('flips to years at ~365 days', () => {
    expect(relativeTime(ago(365 * 24 * 60 * 60_000), NOW)).toBe('1 year ago')
  })

  it('formats years', () => {
    expect(relativeTime(ago(3 * 365 * 24 * 60 * 60_000), NOW)).toBe('3 years ago')
  })

  it('falls back to "just now" for future timestamps', () => {
    const future = new Date(NOW + 60 * 60_000).toISOString()
    expect(relativeTime(future, NOW)).toBe('just now')
  })

  it('falls back to "just now" for an unparseable string', () => {
    expect(relativeTime('not-a-date', NOW)).toBe('just now')
  })

  it('accepts a Date for the `now` parameter', () => {
    expect(relativeTime(ago(5 * 60_000), new Date(NOW))).toBe('5 minutes ago')
  })

  it('uses Date.now() by default', () => {
    // Sanity: the function should not throw without a `now` argument.
    expect(typeof relativeTime(new Date().toISOString())).toBe('string')
  })
})
