// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { LiveSignal } from '../../../app/types/cv'

const collectionData: { value: LiveSignal | null } = { value: null }

mockNuxtImport('useAsyncData', () => async (_key: string, fn: () => Promise<unknown>) => {
  const result = await fn()
  return { data: { value: result } }
})

mockNuxtImport('queryCollection', () => () => ({
  first: async () => collectionData.value,
}))

const { useLiveSignal } = await import('../../../app/composables/useLiveSignal')

describe('useLiveSignal', () => {
  it('narrows the unavailable branch of the discriminated union', async () => {
    collectionData.value = { unavailable: true, fetchedAt: '2026-04-26T12:00:00Z' }
    const { signal, isUnavailable } = await useLiveSignal()
    expect(isUnavailable.value).toBe(true)
    if ('unavailable' in signal.value) {
      expect(signal.value.unavailable).toBe(true)
      expect(signal.value.fetchedAt).toBe('2026-04-26T12:00:00Z')
    }
    else {
      throw new Error('expected unavailable branch')
    }
  })

  it('narrows the commit-data branch of the discriminated union', async () => {
    collectionData.value = {
      repo: 'jameslanzon/Portfolio',
      sha: 'abc1234',
      timestamp: '2026-04-26T11:00:00Z',
      fetchedAt: '2026-04-26T12:00:00Z',
    }
    const { signal, isUnavailable } = await useLiveSignal()
    expect(isUnavailable.value).toBe(false)
    if ('repo' in signal.value) {
      expect(signal.value.repo).toBe('jameslanzon/Portfolio')
      expect(signal.value.sha).toBe('abc1234')
    }
    else {
      throw new Error('expected commit-data branch')
    }
  })

  it('falls back to the unavailable branch when the collection returns null', async () => {
    collectionData.value = null
    const { isUnavailable } = await useLiveSignal()
    expect(isUnavailable.value).toBe(true)
  })
})
