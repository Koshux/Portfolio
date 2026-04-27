// app/composables/useAnalytics.ts
//
// SPEC-002 — consent-gated GA4 wrapper.
//
// SSR-safe: every side effect is gated behind `import.meta.client` and
// only fires once the visitor has explicitly granted consent. The
// composable subscribes to `useConsent`'s effective state and:
//
//  1. injects the gtag.js script with the privacy-first config flags
//     (anonymize_ip, no Signals, no ad personalization, beacon),
//  2. emits `page_view` events on every router navigation,
//  3. exposes `track()` for arbitrary events (no-op until granted),
//  4. exposes `observeSection()` for one-shot `section_view` events
//     via IntersectionObserver, deduped per session per id.
//
// Revoking consent (granted → denied) tears down the script tag and
// clears the `_ga*` cookies; the script reload happens cleanly on a
// subsequent re-grant.
//
// Lazy-loading: the script element is appended to <head> on demand;
// nothing about GA4 is bundled into the static HTML.

import type { ComputedRef } from 'vue'
import { computed, watch } from 'vue'
import { redactPageLocation } from '../utils/redactPageLocation'
import { useConsent, clearAnalyticsCookies } from './useConsent'

interface UseAnalytics {
  ready: ComputedRef<boolean>
  hasMeasurementId: ComputedRef<boolean>
  measurementId: ComputedRef<string>
  track: (event: string, params?: Record<string, unknown>) => void
  observeSection: (el: HTMLElement, id: string) => void
  /** Build the GA4 config object. Exposed for unit tests (AC-11). */
  buildConfig: () => Record<string, unknown>
}

const SCRIPT_ID = 'ga4-tag'

interface GtagWindow extends Window {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

function getMeasurementId(): string {
  try {
    const cfg = useRuntimeConfig() as { public?: { ga?: { measurementId?: string } } }
    return cfg.public?.ga?.measurementId ?? ''
  }
  catch {
    return ''
  }
}

export function buildAnalyticsConfig(): Record<string, unknown> {
  return {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    transport_type: 'beacon',
    // We emit page_view ourselves on every navigation (router.afterEach)
    // to handle SPA routing uniformly. AC-22.
    send_page_view: false,
  }
}

function ensureGtagShim(): (...args: unknown[]) => void {
  const w = window as GtagWindow
  if (!w.dataLayer) w.dataLayer = []
  if (!w.gtag) {
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer!.push(args)
    }
  }
  return w.gtag
}

function injectScript(measurementId: string): void {
  if (document.getElementById(SCRIPT_ID)) return
  const s = document.createElement('script')
  s.id = SCRIPT_ID
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(s)
}

function removeScript(): void {
  const s = document.getElementById(SCRIPT_ID)
  if (s && s.parentNode) s.parentNode.removeChild(s)
  const w = window as GtagWindow
  // Reset the queue so a future re-grant starts cleanly.
  delete w.gtag
  delete w.dataLayer
}

// Per-session dedupe set for section_view events. Lives in module
// scope; cleared on full reload.
const seenSections = new Set<string>()

let initialised = false
let routerHookInstalled = false

function fireInitial(measurementId: string): void {
  const gtag = ensureGtagShim()
  gtag('js', new Date())
  gtag('set', {
    page_location: redactPageLocation(window.location.href),
    page_referrer: redactPageLocation(document.referrer || ''),
  })
  gtag('config', measurementId, buildAnalyticsConfig())
  // Emit the first page_view manually since send_page_view is false.
  gtag('event', 'page_view', {
    page_path: window.location.pathname + window.location.search,
    page_location: redactPageLocation(window.location.href),
    page_title: document.title,
  })
}

function installRouterHook(measurementId: string): void {
  if (routerHookInstalled) return
  routerHookInstalled = true
  try {
    const router = useRouter()
    router.afterEach((to) => {
      const w = window as GtagWindow
      if (!w.gtag) return
      // Re-set page_location on every navigation so any subsequent
      // event picks up the redacted URL.
      w.gtag('set', {
        page_location: redactPageLocation(window.location.href),
      })
      w.gtag('event', 'page_view', {
        page_path: to.fullPath,
        page_location: redactPageLocation(window.location.href),
        page_title: document.title,
      })
      // Reference measurementId so the linter doesn't flag it as
      // unused — kept in scope for future per-call config overrides.
      void measurementId
    })
  }
  catch {
    // Router not available (test envs). Acceptable.
  }
}

export function useAnalytics(): UseAnalytics {
  const consent = useConsent()
  const measurementId = computed(() => getMeasurementId())
  const hasMeasurementId = computed(() => !!measurementId.value)
  const ready = computed(() => consent.isGranted.value && hasMeasurementId.value)

  // Activate / deactivate side effects based on the effective state.
  if (import.meta.client) {
    watch(
      ready,
      (isReady) => {
        if (isReady && !initialised) {
          initialised = true
          injectScript(measurementId.value)
          fireInitial(measurementId.value)
          installRouterHook(measurementId.value)
        }
        else if (!isReady && initialised) {
          initialised = false
          seenSections.clear()
          removeScript()
          clearAnalyticsCookies()
        }
      },
      { immediate: true },
    )
  }

  function track(event: string, params?: Record<string, unknown>): void {
    if (!import.meta.client) return
    if (!ready.value) return
    const w = window as GtagWindow
    if (!w.gtag) return
    w.gtag('event', event, params ?? {})
  }

  function observeSection(el: HTMLElement, id: string): void {
    if (!import.meta.client) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenSections.has(id)) {
            seenSections.add(id)
            track('section_view', { section_id: id })
          }
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
  }

  return {
    ready,
    hasMeasurementId,
    measurementId,
    track,
    observeSection,
    buildConfig: buildAnalyticsConfig,
  }
}

// Test-only helpers — exported so unit tests can reset module-scoped
// state between cases. Not part of the public API.
export function __resetAnalyticsForTests(): void {
  initialised = false
  routerHookInstalled = false
  seenSections.clear()
}
