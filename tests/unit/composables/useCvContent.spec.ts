// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { CvDocument } from '../../../app/types/cv'

const fixture: CvDocument = {
  title: 't',
  description: 'd',
  updated: '2026-04-26',
  hero: {
    name: 'James Lanzon',
    title: 'UX Architect',
    employer: 'European Commission',
    tagline: 'tag',
  },
  overview: 'James does the things.',
  experience: [
    { title: 'Older', organisation: 'O', start: '2018', end: '2020', current: false, bullets: ['b1'] },
    { title: 'Newer', organisation: 'N', start: '2024-06', end: null, current: true, bullets: ['b2'] },
    { title: 'Middle', organisation: 'M', start: '2021-03', end: '2024-05', current: false, bullets: ['b3'] },
  ],
  skills: [
    { label: 'Engineering', items: ['TypeScript'] },
    { label: 'UX & Accessibility', items: ['WCAG 2.2 AA'] },
  ],
  contact: { email: 'lanzonprojects@gmail.com', location: 'Malta', social: [] },
  og: { image: 'https://jameslanzon.com/og/og-image.png', url: 'https://jameslanzon.com/' },
}

mockNuxtImport('useAsyncData', () => async (_key: string, fn: () => Promise<unknown>) => {
  const result = await fn()
  return {
    data: { value: result },
    pending: { value: false },
    error: { value: null },
  }
})

mockNuxtImport('queryCollection', () => () => ({
  first: async () => fixture,
}))

const { useCvContent } = await import('../../../app/composables/useCvContent')

describe('useCvContent', () => {
  it('exposes typed refs derived from the cv collection', async () => {
    const cv = await useCvContent()
    expect(cv.hero.value.name).toBe('James Lanzon')
    expect(cv.hero.value.employer).toBe('European Commission')
    expect(cv.overview.value).toContain('James')
    expect(cv.contact.value.email).toBe('lanzonprojects@gmail.com')
    expect(cv.skills.value).toHaveLength(2)
    expect(cv.updated.value).toBe('2026-04-26')
  })

  it('returns experience already sorted reverse-chronologically', async () => {
    const cv = await useCvContent()
    expect(cv.experience.value.map(r => r.title)).toEqual(['Newer', 'Middle', 'Older'])
  })

  it('exposes pending and error refs', async () => {
    const cv = await useCvContent()
    expect(cv.pending.value).toBe(false)
    expect(cv.error.value).toBe(null)
  })
})
