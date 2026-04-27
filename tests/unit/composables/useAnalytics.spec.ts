// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// Stub the runtime config so the analytics composable believes a
// measurement ID has been configured.
mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { ga: { measurementId: 'G-TEST00000' } },
}))

// Stub the router so we can capture `afterEach` callbacks.
const afterEachCallbacks: Array<(to: { fullPath: string }) => void> = []
mockNuxtImport('useRouter', () => () => ({
  afterEach: (cb: (to: { fullPath: string }) => void) => {
    afterEachCallbacks.push(cb)
  },
}))

const {
  buildAnalyticsConfig,
  useAnalytics,
  __resetAnalyticsForTests,
} = await import('../../../app/composables/useAnalytics')
const { useConsent } = await import('../../../app/composables/useConsent')

beforeEach(() => {
  __resetAnalyticsForTests()
  afterEachCallbacks.length = 0
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    // Tear down any prior gtag state.
    const w = window as Window & { gtag?: unknown, dataLayer?: unknown }
    delete w.gtag
    delete w.dataLayer
    document.querySelectorAll('script#ga4-tag').forEach(s => s.remove())
  }
})

describe('buildAnalyticsConfig (AC-11, AC-22)', () => {
  it('returns the four privacy flags + send_page_view:false', () => {
    expect(buildAnalyticsConfig()).toEqual({
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      transport_type: 'beacon',
      send_page_view: false,
    })
  })
})

describe('useAnalytics — denied state (AC-12, AC-16)', () => {
  it('does not inject the GA4 script while consent is denied', () => {
    const consent = useConsent()
    consent.decline()
    const a = useAnalytics()
    expect(a.ready.value).toBe(false)
    expect(document.getElementById('ga4-tag')).toBeNull()
    const w = window as Window & { gtag?: unknown }
    expect(w.gtag).toBeUndefined()
  })

  it('track() is a no-op when denied', () => {
    const consent = useConsent()
    consent.decline()
    const a = useAnalytics()
    expect(() => a.track('section_view', { section_id: 'hero' })).not.toThrow()
    const w = window as Window & { dataLayer?: unknown[] }
    expect(w.dataLayer).toBeUndefined()
  })
})

describe('useAnalytics — granted state (AC-10, AC-22)', () => {
  it('injects the gtag.js script and registers a router.afterEach hook', async () => {
    const consent = useConsent()
    consent.accept()
    useAnalytics()
    // The init runs inside a watcher with `immediate: true`, but the
    // watcher schedules in microtasks; flush.
    await Promise.resolve()
    await Promise.resolve()
    const script = document.getElementById('ga4-tag') as HTMLScriptElement | null
    expect(script).toBeTruthy()
    expect(script!.src).toContain('googletagmanager.com/gtag/js')
    expect(script!.src).toContain('G-TEST00000')
    expect(script!.async).toBe(true)
    expect(afterEachCallbacks.length).toBe(1)
  })

  it('fires page_view on every router navigation (AC-22)', async () => {
    const consent = useConsent()
    consent.accept()
    useAnalytics()
    await Promise.resolve()
    await Promise.resolve()
    const w = window as Window & { dataLayer?: unknown[][] }
    // The initial page_view fires on init.
    const initialPageViews = (w.dataLayer ?? []).filter(
      args => args[0] === 'event' && args[1] === 'page_view',
    ).length
    expect(initialPageViews).toBe(1)

    afterEachCallbacks[0]({ fullPath: '/legal/privacy' })
    afterEachCallbacks[0]({ fullPath: '/' })

    const pageViews = (w.dataLayer ?? []).filter(
      args => args[0] === 'event' && args[1] === 'page_view',
    )
    expect(pageViews.length).toBe(3) // initial + two navigations
  })

  it('redacts page_location on every set/page_view (AC-21)', async () => {
    // Simulate a URL with a junk query param.
    history.replaceState({}, '', '/?email=foo@bar.com#hash')
    const consent = useConsent()
    consent.accept()
    useAnalytics()
    await Promise.resolve()
    await Promise.resolve()
    const w = window as Window & { dataLayer?: unknown[][] }
    const setCalls = (w.dataLayer ?? []).filter(args => args[0] === 'set')
    expect(setCalls.length).toBeGreaterThan(0)
    for (const args of setCalls) {
      const payload = args[1] as { page_location?: string, page_referrer?: string }
      if (payload.page_location !== undefined) {
        expect(payload.page_location).not.toContain('email=')
        expect(payload.page_location).not.toContain('#')
      }
    }
  })
})

describe('useAnalytics.observeSection (AC-14)', () => {
  it('fires section_view at most once per id within a session', async () => {
    const consent = useConsent()
    consent.accept()
    const a = useAnalytics()
    await Promise.resolve()
    await Promise.resolve()
    const w = window as Window & { dataLayer?: unknown[][] }

    let observerCb: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null
    const fakeObserver = vi.fn().mockImplementation((cb: (e: Array<{ isIntersecting: boolean }>) => void) => {
      observerCb = cb
      return { observe: vi.fn(), disconnect: vi.fn() }
    })
    // @ts-expect-error overriding for the test
    window.IntersectionObserver = fakeObserver

    const el = document.createElement('div')
    a.observeSection(el, 'hero')
    a.observeSection(el, 'hero') // a second observer for the same id

    observerCb!([{ isIntersecting: true }])
    observerCb!([{ isIntersecting: true }]) // second intersection
    observerCb!([{ isIntersecting: true }]) // third

    const sectionViews = (w.dataLayer ?? []).filter(
      args => args[0] === 'event' && args[1] === 'section_view',
    )
    expect(sectionViews.length).toBe(1)
    const params = sectionViews[0][2] as { section_id: string }
    expect(params.section_id).toBe('hero')
  })
})
