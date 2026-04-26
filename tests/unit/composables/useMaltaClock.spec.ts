// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useMaltaClock } from '../../../app/composables/useMaltaClock'

describe('useMaltaClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a non-empty formatted Malta time string', () => {
    const time = useMaltaClock()
    expect(typeof time.value).toBe('string')
    expect(time.value.length).toBeGreaterThan(0)
    // Format is HH:mm <tz>; tz on Europe/Malta is CET or CEST.
    expect(time.value).toMatch(/^\d{2}:\d{2} CES?T$/)
  })

  it('updates the value every second', async () => {
    const time = useMaltaClock()
    const initial = time.value

    vi.setSystemTime(new Date('2026-04-26T12:01:00Z'))
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(time.value).not.toBe(initial)

    const oneMinuteLater = time.value
    vi.setSystemTime(new Date('2026-04-26T12:02:00Z'))
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(time.value).not.toBe(oneMinuteLater)
  })

  it('clears the interval when the consuming scope is disposed', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const scope = effectScope()
    scope.run(() => {
      useMaltaClock()
    })
    scope.stop()
    expect(clearSpy).toHaveBeenCalled()
  })
})
