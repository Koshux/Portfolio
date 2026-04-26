import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { LiveSignal } from '../types/cv'

const FALLBACK: LiveSignal = {
  unavailable: true,
  fetchedAt: '1970-01-01T00:00:00Z',
}

interface UseLiveSignal {
  signal: ComputedRef<LiveSignal>
  isUnavailable: ComputedRef<boolean>
}

/**
 * Wraps `queryCollection('liveSignal').first()` via `useAsyncData`. Pure
 * data composable: no fetch happens at runtime; the JSON is baked into
 * the static build by `scripts/fetch-live-signal.mjs`.
 *
 * Returns the discriminated union (`unavailable: true` or commit data)
 * with a safe fallback while the async data resolves.
 */
export async function useLiveSignal(): Promise<UseLiveSignal> {
  const { data } = await useAsyncData('live-signal', async () => {
    const result = await queryCollection('liveSignal').first()
    return (result as LiveSignal | null) ?? FALLBACK
  })

  const signal = computed<LiveSignal>(() => (data.value as LiveSignal | null) ?? FALLBACK)
  // Treat anything missing the commit-data shape as unavailable. This is
  // robust to the @nuxt/content data-collection envelope (which may add
  // metadata fields and is not guaranteed to round-trip the literal
  // `unavailable: true` flag in v3).
  const isUnavailable = computed(() => !('repo' in signal.value))

  return { signal, isUnavailable }
}
