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
  const isUnavailable = computed(() => 'unavailable' in signal.value && signal.value.unavailable === true)

  return { signal, isUnavailable }
}
