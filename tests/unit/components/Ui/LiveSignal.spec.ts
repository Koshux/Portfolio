// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { LiveSignal } from '../../../../app/types/cv'

const state = vi.hoisted(() => ({
  signal: { unavailable: true, fetchedAt: '2026-04-26T12:00:00Z' } as LiveSignal,
}))

mockNuxtImport('useLiveSignal', () => async () => {
  const signalRef = ref<LiveSignal>(state.signal)
  return {
    signal: signalRef,
    isUnavailable: computed(() => 'unavailable' in signalRef.value && signalRef.value.unavailable === true),
  }
})

mockNuxtImport('useMaltaClock', () => () => ref('14:32 CEST'))

const LiveSignal = (await import('../../../../app/components/Ui/LiveSignal.vue')).default

describe('LiveSignal', () => {
  it('renders the unavailable fallback string when signal is unavailable', async () => {
    state.signal = { unavailable: true, fetchedAt: '2026-04-26T12:00:00Z' }
    const wrapper = await mountSuspended(LiveSignal)
    // The chip carries the GitHub mark visually + an aria-label; the
    // visible text only says "recent activity" so it stays compact.
    expect(wrapper.text()).toContain('recent activity')
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toMatch(/GitHub/i)
  })

  it('does not render any commit data when signal is unavailable', async () => {
    state.signal = { unavailable: true, fetchedAt: '2026-04-26T12:00:00Z' }
    const wrapper = await mountSuspended(LiveSignal)
    expect(wrapper.text()).not.toMatch(/jameslanzon\//)
    expect(wrapper.text()).not.toMatch(/ago/)
  })

  it('renders the repo and relative time when commit data is present', async () => {
    state.signal = {
      repo: 'jameslanzon/Portfolio',
      sha: 'abc1234',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      fetchedAt: new Date().toISOString(),
    }
    const wrapper = await mountSuspended(LiveSignal)
    expect(wrapper.text()).toContain('jameslanzon/Portfolio')
    expect(wrapper.text()).toMatch(/ago/)
  })

  it('exposes role="status" with polite live region', async () => {
    const wrapper = await mountSuspended(LiveSignal)
    const root = wrapper.find('[role="status"]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('aria-live')).toBe('polite')
  })

  it('is not focusable (no tabindex, not an anchor or button)', async () => {
    const wrapper = await mountSuspended(LiveSignal)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').attributes('tabindex')).toBeUndefined()
  })

  it('contains a Malta timezone label that survives DST flips', async () => {
    const wrapper = await mountSuspended(LiveSignal)
    // Either the static fallback ("Malta · CES?T") or the live tick
    // ("HH:MM CES?T") satisfies the timezone requirement.
    expect(wrapper.text()).toMatch(/CES?T/)
  })
})
