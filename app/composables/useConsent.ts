// app/composables/useConsent.ts
//
// SPEC-002 — single source of truth for analytics consent.
//
// State is stored in a Nuxt `useState` so the same value is shared
// across the layout, page, and any component that calls this
// composable. SSR-safe: on the server the state is `'unknown'` and no
// localStorage / navigator access happens. On the client, the first
// call (`onMounted`) hydrates from `localStorage` and detects the
// GPC / DNT auto-decline signals.
//
// `respectsGpc` is `true` when the visitor's browser is asking us not
// to track them. We honour that even over a previously stored
// `granted` decision (without overwriting the stored value, so
// disabling GPC restores the previous choice).

import type { ComputedRef, Ref } from 'vue'
import { computed, onMounted } from 'vue'

export type ConsentDecision = 'granted' | 'denied'
export type ConsentState = 'unknown' | ConsentDecision

export interface ConsentRecord {
  analytics: ConsentDecision
  ts: number
}

interface UseConsent {
  state: Ref<ConsentState>
  effective: ComputedRef<ConsentState>
  respectsGpc: ComputedRef<boolean>
  isUnknown: ComputedRef<boolean>
  isGranted: ComputedRef<boolean>
  isDenied: ComputedRef<boolean>
  hydrated: Ref<boolean>
  /**
   * Monotonically incremented every time `requestReopen()` is called.
   * The default layout watches this signal and toggles the prompt
   * back on so any component (e.g. the privacy page) can re-open the
   * consent prompt without owning its visibility state.
   */
  reopenSignal: Ref<number>
  requestReopen: () => void
  accept: () => void
  decline: () => void
  reset: () => void
}

const COOKIE_PATTERN = /^(_ga|_gid|_gac|__utm)/

function getStorageKey(): string {
  // Read from `useAppConfig` so the test suite can override via a
  // fresh app-config — but tolerate missing config (Vitest happy-dom).
  try {
    const cfg = useAppConfig() as { analytics?: { consentStorageKey?: string } }
    return cfg.analytics?.consentStorageKey ?? 'jl-consent-v1'
  }
  catch {
    return 'jl-consent-v1'
  }
}

function readRecord(key: string): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    if (parsed && (parsed.analytics === 'granted' || parsed.analytics === 'denied')
      && typeof parsed.ts === 'number') {
      return { analytics: parsed.analytics, ts: parsed.ts }
    }
    return null
  }
  catch {
    return null
  }
}

function writeRecord(key: string, decision: ConsentDecision): void {
  if (typeof window === 'undefined') return
  try {
    const record: ConsentRecord = { analytics: decision, ts: Date.now() }
    window.localStorage.setItem(key, JSON.stringify(record))
  }
  catch {
    // Storage disabled (Safari ITP private mode etc.) — fail closed.
  }
}

function clearRecord(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  }
  catch {
    // ignore
  }
}

function detectGpc(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.globalPrivacyControl === true) return true
  if (nav.doNotTrack === '1') return true
  return false
}

function getEtldPlusOne(): string {
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname
  if (!host) return ''
  // Crude eTLD+1: last two labels (works for jameslanzon.com — single
  // public suffix). Localhost / IP literals fall back to host-only.
  const parts = host.split('.')
  if (parts.length < 2) return host
  return parts.slice(-2).join('.')
}

/**
 * Iterate over every cookie name and overwrite each `_ga*`, `_gid`,
 * `_gac*`, `__utm*` cookie in BOTH host-only and eTLD+1 forms (AC-8).
 */
export function clearAnalyticsCookies(): void {
  if (typeof document === 'undefined') return
  const etld = getEtldPlusOne()
  const cookieNames = document.cookie
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter((n): n is string => !!n && COOKIE_PATTERN.test(n))
  for (const name of cookieNames) {
    document.cookie = `${name}=; max-age=0; path=/`
    if (etld) {
      document.cookie = `${name}=; max-age=0; path=/; domain=${etld}`
      document.cookie = `${name}=; max-age=0; path=/; domain=.${etld}`
    }
  }
}

export function useConsent(): UseConsent {
  const state = useState<ConsentState>('jl-consent-state', () => 'unknown')
  const respectsGpcRef = useState<boolean>('jl-consent-gpc', () => false)
  const hydrated = useState<boolean>('jl-consent-hydrated', () => false)
  // Cross-component re-open signal (Issue 1 — privacy page hosts the
  // Cookie preferences trigger; the layout owns prompt visibility).
  const reopenSignal = useState<number>('jl-consent-reopen', () => 0)

  const respectsGpc = computed(() => respectsGpcRef.value)
  // GPC short-circuits to denied for the session even if a stored
  // grant exists; the stored value is left untouched so the user can
  // disable GPC later and restore their choice.
  const effective = computed<ConsentState>(() =>
    respectsGpcRef.value ? 'denied' : state.value,
  )

  function hydrate(): void {
    if (hydrated.value) return
    hydrated.value = true
    const key = getStorageKey()
    const record = readRecord(key)
    if (record) {
      state.value = record.analytics
    }
    respectsGpcRef.value = detectGpc()
  }

  // Defer hydration to mount so SSG output never depends on
  // localStorage / navigator state.
  onMounted(() => {
    hydrate()
  })

  function accept(): void {
    const key = getStorageKey()
    writeRecord(key, 'granted')
    state.value = 'granted'
  }

  function decline(): void {
    const key = getStorageKey()
    writeRecord(key, 'denied')
    state.value = 'denied'
    // Tear down any GA4 cookies left from a previous granted session
    // (AC-8). Script removal is handled by `useAnalytics`.
    clearAnalyticsCookies()
  }

  function reset(): void {
    const key = getStorageKey()
    clearRecord(key)
    state.value = 'unknown'
  }

  function requestReopen(): void {
    reopenSignal.value = reopenSignal.value + 1
  }

  return {
    state,
    effective,
    respectsGpc,
    isUnknown: computed(() => effective.value === 'unknown'),
    isGranted: computed(() => effective.value === 'granted'),
    isDenied: computed(() => effective.value === 'denied'),
    hydrated,
    reopenSignal,
    requestReopen,
    accept,
    decline,
    reset,
  }
}
