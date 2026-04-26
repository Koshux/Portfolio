---
id: SPEC-002
title: "Consent-gated Google Analytics 4 (GA4)"
status: draft
created: 2026-04-27
owner: "James Lanzon"
journeys: [JNY-002]
adrs: []
---

# SPEC-002 — Consent-gated Google Analytics 4 (GA4)

## Summary

Restore site-owner observability on `jameslanzon.com` by integrating
**Google Analytics 4** behind an explicit, equal-weight consent prompt
that satisfies GDPR / ePrivacy and the iteration-1 contracts from
[JNY-001](../journeys/JNY-001-portfolio-revamp-iteration-1.md). No
analytics script, cookie, or network request to any Google host
occurs before the visitor actively accepts. The implementation is
**static-only** (no server, no API routes, no edge middleware), runs
inside the existing `nitro.preset = 'github-pages'` static build, and
preserves the JavaScript-disabled experience byte-for-byte: when JS is
off, no consent prompt is rendered and no analytics runs. The GA4
**Measurement ID** is exposed via `runtimeConfig.public.ga.measurementId`,
populated at build time from the `NUXT_PUBLIC_GA_MEASUREMENT_ID` env var
(set in GitHub Actions). When the env var is empty or unset, the
analytics module is fully inert: no consent prompt, no tag, no
imports — the global "kill switch" required by JNY-002. Consent is
persisted in `localStorage` under a versioned key so a future ADR can
invalidate stale consent without nagging returning visitors. The
prompt is reachable forever via a "Cookie preferences" link in the
footer and respects `Sec-GPC: 1` and `navigator.doNotTrack === '1'`
as auto-decline signals. See [JNY-002](../journeys/JNY-002-restore-analytics.md).

## Acceptance criteria

The contract. Each is verifiable by a test or a scripted manual check.

- [ ] **AC-1** — On first visit with a fresh browser profile and no
      stored consent, **zero** network requests are made to
      `*.google-analytics.com`, `*.googletagmanager.com`,
      `*.analytics.google.com`, or `*.g.doubleclick.net` before the
      visitor clicks "Accept". Verified by a Playwright spec that
      records `page.on('request')` and asserts the matching URL set is
      empty until the click.
- [ ] **AC-2** — Before consent, **zero** cookies whose name starts
      with `_ga`, `_gid`, `_gac`, or `__utm` exist on the document.
      Verified by `document.cookie` inspection in Playwright.
- [ ] **AC-3** — The consent prompt is rendered as a **non-modal**
      bottom-anchored region (`<aside role="region" aria-labelledby>`)
      that does not cover the hero on a 360 × 600 mobile viewport. The
      hero `<h1>` containing "James Lanzon" remains visible above the
      prompt without scrolling. Verified at 360 × 600 and 1280 × 800.
- [ ] **AC-4** — The prompt's "Accept" and "Decline" buttons are
      **equal weight**: same component (`<button>`), same Tailwind
      size/padding utilities, same focus ring, no colour-only
      differentiation that fails WCAG 1.4.1 (no dark patterns). Both
      buttons are `<button type="button">`. Verified by a unit test
      asserting both buttons share the same Tailwind class set for
      sizing/padding and by an axe scan with zero violations.
- [ ] **AC-5** — The prompt is keyboard-reachable. Tabbing from the
      skip link reaches the prompt's "Decline" then "Accept" then
      "Cookie preferences" link in DOM order. `Esc` is a no-op (the
      prompt is non-modal and dismissal happens via Decline only — no
      "X" close button, since "X" is a known dark pattern that
      ambiguously implies decline-without-recording). Focus is **not**
      trapped.
- [ ] **AC-6** — The prompt passes axe-core WCAG 2.2 AA scans with
      **zero** `serious` or `critical` violations. The buttons meet
      `≥ 4.5:1` contrast against their background and have a visible
      focus ring (`focus-visible:` Tailwind utilities) that meets
      WCAG 2.2 SC 2.4.13.
- [ ] **AC-7** — Accept / Decline persists across reloads, across
      pages within the site, and across browser restarts. Storage:
      `localStorage` key `jl-consent-v1`; value is the JSON string
      `'{"analytics":"granted","ts":<unix-ms>}'` or
      `'{"analytics":"denied","ts":<unix-ms>}'`. Verified by a
      Playwright spec that reloads twice and asserts the prompt does
      not reappear and the recorded value is unchanged.
- [ ] **AC-8** — A persistent footer link with the accessible name
      "Cookie preferences" reopens the prompt on click and on
      `Enter`/`Space` key activation. The reopened prompt is
      pre-selected on the **most recent** decision (visual pre-fill,
      not pre-checked input — there are no checkboxes). Choosing the
      opposite decision and confirming flips the stored value and, if
      flipping `granted → denied`, **also** clears all `_ga*` cookies
      from `document.cookie` and removes the GA4 script element from
      the DOM. **Cookie clearance pattern:** the implementation must
      iterate over every cookie name returned by `document.cookie`
      whose name matches `/^(_ga|_gid|_gac|__utm)/` and overwrite
      each with `name=; max-age=0; path=/; domain=<eTLD+1>` **and**
      `name=; max-age=0; path=/` (no domain attribute) — both forms
      are required because GA4 sets the cookie on the eTLD+1
      (`jameslanzon.com`) but a naive single-form clear leaves
      stragglers on the host-only variant. Verified by Playwright.
- [ ] **AC-9** — When `NUXT_PUBLIC_GA_MEASUREMENT_ID` is unset or
      empty at build time, the generated static HTML for `/` contains
      **no** `<script>` tag whose `src` mentions `googletagmanager`,
      `gtag`, or the literal string `G-`. The "Cookie preferences"
      footer link is also **absent** in this mode (nothing to consent
      to). Verified by an integration test that builds twice — once
      with the env var set to a fixture ID `G-TEST00000`, once unset —
      and greps the generated HTML.
- [ ] **AC-10** — When consent is `granted`, the GA4 tag
      (`https://www.googletagmanager.com/gtag/js?id=<MEASUREMENT_ID>`)
      is injected into the document via `useHead({ script: [...] })`
      with `async: true` and **after** the `load` event of the page
      (post-hydration). It is **never** a render-blocking script. TTI
      regression vs the iteration-1 baseline is ≤ 100 ms on simulated
      4G mobile, measured by `playwright-lighthouse` as a soft budget.
- [ ] **AC-11** — On `gtag('config', '<MEASUREMENT_ID>', cfg)` the
      `cfg` object MUST include
      `{ anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false, transport_type: 'beacon' }`.
      Verified by a unit test on the `useAnalytics` composable's
      generated config object.
- [ ] **AC-12** — When consent is `denied`, no GA4 script is loaded,
      no `gtag` global is created, and no requests fire to any Google
      host. Asserted by Playwright as in AC-1.
- [ ] **AC-13** — When the browser sends `Sec-GPC: 1` (Global Privacy
      Control) **or** `navigator.doNotTrack === '1'`, the consent
      prompt **does not render** and consent is treated as `denied`
      (no script load, no requests, no cookies). The "Cookie
      preferences" footer link is still rendered and clicking it shows
      the prompt with the explanation "Your browser is asking us not
      to track you. We are honouring that. You can override here."
      Verified by Playwright with `await context.setExtraHTTPHeaders({ 'Sec-GPC': '1' })`
      and a separate run that overrides `navigator.doNotTrack` via
      `addInitScript`.
- [ ] **AC-14** — Section-view events fire **at most once per
      section per session** using `IntersectionObserver` with
      `threshold: 0.5`. The five sections (`#hero`, `#overview`,
      `#experience`, `#skills`, `#contact`) emit
      `section_view` events with `{ section_id }` parameters. No
      scroll-pixel debounced handler is permitted (rejected on
      performance grounds — see Edge cases). Verified by a unit test
      on the `useAnalytics` composable that asserts repeated
      observer triggers for the same section produce only one
      `gtag('event', 'section_view', …)` call within a session.
- [ ] **AC-15** — When JavaScript is disabled, the generated
      `index.html` contains **no** consent prompt markup, **no**
      "Cookie preferences" footer link inside a `<noscript>` block,
      and **no** GA tag. The page is identical to iteration 1's
      JS-disabled output other than (a) any new `<noscript>` tags
      explicitly tested for absence and (b) an unchanged DOM. Verified
      by `tests/e2e/no-js.spec.ts` extension.
- [ ] **AC-16** — The `useAnalytics` composable is **SSR-safe**: it
      no-ops on the server (`if (import.meta.server) return`) and only
      registers DOM/observer side effects in `onMounted`. Build-time
      generation of the static HTML must not invoke any `gtag` call
      or read `localStorage`. Verified by a unit test that imports
      the composable in a node environment and asserts no
      side effects occur.
- [ ] **AC-17** — The consent prompt copy is sourced from
      `content/legal/consent.md` (new) via `queryCollection` and
      contains: title (≤ 60 chars), one-paragraph explanation
      (≤ 280 chars) naming "Google Analytics 4" explicitly, a link
      to `/legal/privacy` (new content page), and the two button
      labels. No copy is hard-coded in `app/components/Ui/`.
- [ ] **AC-18** — A new content page `/legal/privacy` exists, is
      reachable from the footer, and lists: what data is collected
      (page path, referrer, device category, country), what is **not**
      collected (precise IP, advertising IDs, cross-site identifiers),
      retention (default GA4: 14 months), and how to opt out
      ("Cookie preferences" link plus browser DNT/Sec-GPC notes).
      The page is statically generated from `content/legal/privacy.md`
      and follows the iteration-1 typography conventions.
- [ ] **AC-19** — Lighthouse Performance score on the home route
      (`/`) under `mobile` configuration with throttling preset
      `Slow 4G` is **≥ 90** in **both** consent states (granted and
      denied). Verified by `playwright-lighthouse` runs that
      pre-seed `localStorage` before navigation.
- [ ] **AC-20** — A CI smoke step (`tests/e2e/ga-leak.spec.ts`)
      records all outbound network requests against the **production
      build** and **fails** if any request to a Google host is
      observed before consent on a fresh-context page load.
- [ ] **AC-21** — **PII redaction in `page_location`.** Before any
      `gtag('config', …)` or `gtag('event', …)` call, the composable
      MUST normalise the URL via
      `gtag('set', { page_location: redactPageLocation(location.href) })`
      where `redactPageLocation` strips the entire query string
      **except** the marketing UTM params
      (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`,
      `utm_content`) and strips the URL fragment. The same redaction
      is applied to `page_referrer`. Verified by a unit test on
      `redactPageLocation('https://jameslanzon.com/?utm_source=li&email=foo@bar.com#hi')`
      → `'https://jameslanzon.com/?utm_source=li'`.
- [ ] **AC-22** — **SPA `page_view` on route change.** When consent
      is `granted`, every `vue-router` navigation (e.g.
      `/` → `/legal/privacy`) MUST fire exactly one
      `gtag('event', 'page_view', { page_path, page_location, page_title })`
      call after the navigation completes. Implemented via
      `router.afterEach`. Verified by a unit test that mocks the
      router and asserts one event per navigation, and by an e2e
      test that intercepts requests to
      `*.google-analytics.com/g/collect` and asserts `en=page_view`
      fires twice across a `/` → `/legal/privacy` round trip.
- [ ] **AC-23** — **A `page_view` event actually reaches GA4 on
      accept.** Within 5 s of clicking "Accept" on a fresh visit, a
      request to `https://*.google-analytics.com/g/collect?...&en=page_view`
      is observed in `page.on('request')`. Verified by
      `tests/e2e/ga-consent.spec.ts`. Without this AC, AC-10
      (script loaded) and AC-11 (config flags correct) can both
      pass while no data ever reaches Google.
- [ ] **AC-24** — **No SSR flash of the consent prompt.** The
      generated static `index.html` for `/` MUST NOT contain the
      `ConsentPrompt` markup. The prompt renders only after client
      mount (e.g. via `<ClientOnly>` or a mounted ref guard).
      Verified by an integration test that greps the generated HTML
      and asserts the absence of the prompt's `aria-labelledby`
      anchor (`consent-title`) and the `.btn-consent` class.
      Returning visitors with a stored decision therefore never see
      a one-frame flash of the prompt during hydration.
- [ ] **AC-25** — **TTI budget under decline state.** With consent
      `denied` (pre-seeded `localStorage`), Time to Interactive on
      simulated `Slow 4G` mobile MUST be **≤ the SPEC-001 AC-12
      revised budget of 2500 ms** (not the original 1800 ms target,
      which SPEC-001 itself softened). Under `LIGHTHOUSE_STRICT=1`,
      the same 1800 ms strict budget from SPEC-001 applies. Under
      consent `granted`, TTI MUST be ≤ decline-state TTI **+ 100 ms**
      (delta budget per AC-10).
- [ ] **AC-26** — **`/legal/privacy` is reachable from the footer**
      via a `<NuxtLink to="/legal/privacy">` with the accessible name
      "Privacy". This link is rendered **regardless** of whether the
      measurement ID is configured (the privacy notice is harmless
      and useful even in the inert build), unlike the
      `CookiePreferencesLink` which is hidden in inert mode (AC-9).
      Verified by an integration test asserting the link is present
      in both build modes.

## Non-goals

- Self-hosted analytics (Plausible, Umami, Matomo). Out of scope per
  [JNY-002 §Out of scope](../journeys/JNY-002-restore-analytics.md).
- Google Tag Manager. Direct `gtag.js` only — no GTM container.
- Server-side GA / Measurement Protocol. The site is static.
- Advertising cookies, remarketing, conversion tags, Google Signals.
- A/B testing, heatmaps, session recording, error telemetry (Sentry).
- Custom domain analytics (`stats.jameslanzon.com`) — directly use
  `googletagmanager.com` even though it costs us a `Sec-Fetch-Site`
  signal; the privacy gain of consent gating > the cost.
- Analytics in `docs/legacy/` (reference-only directory).
- A backend admin dashboard or any in-site analytics surface.

## Design

### Affected areas

| Path | Change |
|---|---|
| `nuxt.config.ts` | Add `runtimeConfig.public.ga = { measurementId: '' }` so it is populated at build time from `NUXT_PUBLIC_GA_MEASUREMENT_ID`. No new modules. |
| `app.config.ts` | Add `analytics: { consentStorageKey: 'jl-consent-v1' }` for stable, lint-friendly key reference. |
| `app/composables/useConsent.ts` | **New.** Reads/writes the `localStorage` consent record. Exposes `state: Ref<'unknown'\|'granted'\|'denied'>`, `accept()`, `decline()`, `reset()`, and `respectsGpc: ComputedRef<boolean>`. SSR-safe (returns `state.value = 'unknown'` on server, hydrates in `onMounted`). Reacts to `Sec-GPC`/`DNT` once on mount and short-circuits state to `'denied'` (without writing to localStorage so the visitor can override). |
| `app/composables/useAnalytics.ts` | **New.** Consumes `useConsent`. When `state === 'granted'` and a measurement ID is configured, lazily imports a tiny loader that injects the `gtag.js` script (`async`, `defer`) and calls `gtag('js', new Date()); gtag('set', { page_location: redactPageLocation(location.href), page_referrer: redactPageLocation(document.referrer) }); gtag('config', id, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false, transport_type: 'beacon', send_page_view: false })` (we set `send_page_view: false` and emit `page_view` ourselves so SPA navigations and the initial view are uniformly handled). Registers a single `router.afterEach` that fires `gtag('event', 'page_view', { page_path, page_location: redactPageLocation(...), page_title })` (AC-22). Exposes `track(eventName: string, params?: Record<string, unknown>): void` which is a no-op until granted. Implements the `IntersectionObserver`-based `observeSection(el, id)` helper used by `app/pages/index.vue`. |
| `app/utils/redactPageLocation.ts` | **New.** Pure helper: `(url: string) => string` returning a URL with all query params removed except the five `utm_*` marketing params and with the URL fragment removed. Independently unit-tested (AC-21). |
| `app/components/Ui/ConsentPrompt.vue` | **New.** Renders the non-modal `<aside role="region" aria-labelledby="consent-title">` with copy from `content/legal/consent.md`. Two `<button>`s sharing identical Tailwind classes (`.btn-consent`). Emits `decline` / `accept`; the parent layout wires those to `useConsent`. Includes a `<NuxtLink to="/legal/privacy">` reference. |
| `app/components/Ui/CookiePreferencesLink.vue` | **New.** Renders a `<button type="button">` (it triggers an in-page UI, not a navigation, so it must not be an anchor). Accessible name "Cookie preferences". Emits an event the layout listens for to re-show `ConsentPrompt`. Hidden via `v-if` when no measurement ID is configured (AC-9). |
| `app/layouts/default.vue` | Mount `<ClientOnly><ConsentPrompt v-if="showPrompt" /></ClientOnly>` (AC-24 — no SSR flash) and add a footer `<NuxtLink to="/legal/privacy">Privacy</NuxtLink>` (AC-26, always present) plus `<CookiePreferencesLink>` (hidden when no measurement ID, AC-9). Manage the `showPrompt` ref derived from `useConsent().state` and the GPC/DNT short-circuit. |
| `app/pages/index.vue` | Call `useAnalytics().observeSection(el, id)` on each section ref via `onMounted` template refs. No content changes. |
| `content/legal/consent.md` | **New.** Frontmatter: `title`, `body` (paragraph), `acceptLabel`, `declineLabel`, `privacyHref` (defaults to `/legal/privacy`). |
| `content/legal/privacy.md` | **New.** Privacy notice page body. |
| `content.config.ts` | Add a `legal` collection (`type: 'page'`, source `legal/**.md`) with a `consent` schema (title/body/labels) and a generic page schema for `privacy.md`. |
| `app/pages/legal/privacy.vue` | **New.** Renders `<ContentRenderer>` for `content/legal/privacy.md`. Plain typography; reuses `prose` Tailwind utilities. |
| `tailwind.config.js` | Add a single `.btn-consent` component class (or a Tailwind `@apply` block in `app/assets/css/tailwind.css`) to enforce identical sizing for both buttons. |
| `app/assets/css/tailwind.css` | Add `@layer components { .btn-consent { @apply ... } }`. |
| `tests/unit/composables/useConsent.spec.ts` | **New.** Mocks `localStorage`, asserts state transitions, GPC/DNT short-circuit, and that `accept()` after a previous `decline()` flips the stored value. |
| `tests/unit/composables/useAnalytics.spec.ts` | **New.** Asserts the gtag config object includes the four required flags **plus** `send_page_view: false` (AC-11, AC-22), asserts `track()` is a no-op when denied, asserts `observeSection` fires only once per id (AC-14), asserts `router.afterEach` fires exactly one `page_view` per navigation (AC-22), asserts `gtag('set', …)` is called with redacted `page_location` / `page_referrer` (AC-21). |
| `tests/unit/utils/redactPageLocation.spec.ts` | **New.** Pure tests for the redaction helper (AC-21). |
| `tests/unit/components/Ui/ConsentPrompt.spec.ts` | **New.** Renders both copy variants (consent.md fixture); asserts both buttons share the Tailwind class set (AC-4); asserts `role="region"` and `aria-labelledby`. |
| `tests/unit/components/Ui/CookiePreferencesLink.spec.ts` | **New.** Asserts `<button>` element (not anchor), accessible name, and emit. |
| `tests/integration/pages/analytics-build.spec.ts` | **New.** Builds with and without the env var (using `process.env` overrides between two `setup({ build: true })` calls or two separate generate runs orchestrated via the test) and greps the generated HTML for the GA4 tag and the "Cookie preferences" link (AC-9). |
| `tests/integration/content/legal-schema.spec.ts` | **New.** Validates `content/legal/consent.md` and `content/legal/privacy.md` against the new collection schemas. |
| `tests/e2e/ga-consent.spec.ts` | **New.** Full journey across mobile + desktop: AC-1 (no requests pre-consent), AC-2 (no cookies pre-consent), AC-7 (persistence across reload), AC-8 (footer reopen + flip), AC-12 (decline = silent), AC-13 (Sec-GPC + DNT short-circuit), AC-14 (one section_view per section). |
| `tests/e2e/ga-leak.spec.ts` | **New.** AC-20 leak guard. |
| `tests/e2e/no-js.spec.ts` | **Extend.** Assert no consent prompt, no cookie-preferences link, no `gtag` script appear with JS disabled (AC-15). |
| `playwright.config.ts` | _No change_ (existing `mobile` + `desktop` projects already cover the new specs). |
| `.github/workflows/deploy-pages.yml` | Wire `NUXT_PUBLIC_GA_MEASUREMENT_ID` from a repo secret into the `nuxt generate` step's env. Documented in §Risks. |
| `.github/workflows/ci.yml` | _No change_ — CI runs without the env var, exercising the inert-build path (AC-9). |
| `README.md` | Document the env var and how to set the GitHub Actions secret. Document that **CI deliberately runs without the secret** so the unset-path is exercised on every PR. |

### Data shapes

#### `runtimeConfig` shape

```ts
// nuxt.config.ts (excerpt)
runtimeConfig: {
  public: {
    ga: {
      // Empty string = analytics disabled. Populated from
      // NUXT_PUBLIC_GA_MEASUREMENT_ID at build time.
      measurementId: '',
    },
  },
},
```

#### Consent record

```ts
// app/composables/useConsent.ts
type ConsentDecision = 'granted' | 'denied'
type ConsentState = 'unknown' | ConsentDecision

interface ConsentRecord {
  analytics: ConsentDecision
  ts: number // unix ms
}

const STORAGE_KEY = 'jl-consent-v1' // bump version to invalidate
```

#### `useAnalytics` public surface

```ts
interface UseAnalytics {
  ready: ComputedRef<boolean>          // granted && measurementId set
  track: (event: string, params?: Record<string, unknown>) => void
  observeSection: (el: HTMLElement, id: string) => void
}
```

#### Content schemas

```ts
// content.config.ts (excerpt)
const consent = z.object({
  title: z.string().max(60),
  body: z.string().max(280),
  acceptLabel: z.string().max(20),
  declineLabel: z.string().max(20),
  privacyHref: z.string().default('/legal/privacy'),
})
```

### Routing / pages

- New static route: `/legal/privacy` (generated from
  `app/pages/legal/privacy.vue` + `content/legal/privacy.md`).
- No other route changes.

### Component tree (additions only)

```
app/layouts/default.vue
├── <header>… (unchanged)
├── <main>… (unchanged)
├── <footer>
│   ├── existing LinkedIn link
│   └── <CookiePreferencesLink v-if="hasMeasurementId" @open="showPrompt = true" />
└── <ConsentPrompt v-if="showPrompt" @accept @decline />
```

### State / composables

- `useConsent` — single source of truth for consent state; reads
  `localStorage` once on mount, writes on every decision.
- `useAnalytics` — depends on `useConsent`; lazily injects gtag once,
  exposes `track` and `observeSection`.
- No Pinia store; refs/computeds via `useState` so the value is shared
  between the layout and `index.vue`.

## Edge cases

- **GPC/DNT after a previous accept.** A returning visitor previously
  accepted; later they enable GPC. We honour GPC: even though the
  stored record says `granted`, on mount the composable detects GPC,
  sets `state.value = 'denied'` for this session **without** writing
  to localStorage, and tears down any GA4 script element. The
  recorded preference is preserved so disabling GPC restores the
  previous decision. Tested.
- **`localStorage` disabled / Safari ITP private mode.** Reads and
  writes are wrapped in `try/catch`. On failure, `state` stays
  `'unknown'`, the prompt remains shown for the session, and the
  GA tag is not loaded — fail-closed.
- **Visitor accepts then immediately reloads.** The accept path
  writes to `localStorage` synchronously *before* injecting the
  gtag script, so a reload picks up the granted state without a
  prompt flash.
- **`IntersectionObserver` unavailable.** Old browsers (none of the
  iteration-1 baseline supports listed lacks IO, but defensive). If
  `'IntersectionObserver' in window` is false, `observeSection` is a
  no-op. No fallback scroll handler — the data loss is acceptable;
  performance regression risk is not.
- **Kill switch via env var.** Setting the env var to the empty
  string (or unsetting it) and rebuilding produces a build with no
  consent prompt, no footer link, and no analytics. Asserted by
  AC-9.
- **Consent across subdomains.** Out of scope — site is single-host.
  If `www.` is later canonicalised separately (see SPEC-003), each
  origin keeps its own `localStorage` and re-prompts; acceptable.
- **GitHub Pages caching of `gtag.js`.** Not our concern — the script
  is fetched from `googletagmanager.com`. Our HTML is cached by
  GitHub Pages but contains only the runtime-config-injected
  measurement ID, which is a public string anyway.
- **Multiple tabs.** A second tab opened mid-session reads
  `localStorage` and renders the correct state without a re-prompt.
  We do **not** subscribe to the `storage` event in iteration 2 — a
  tab that flipped consent in another tab will pick up the change on
  next navigation; cross-tab live sync is over-engineering.
- **`prefers-reduced-motion`.** The prompt is rendered without
  animation by default (no slide-up). A `motion-safe:transition-…`
  utility may add a fade-in only when motion is allowed — verified
  by extending the existing **SPEC-001 AC-20** reduced-motion e2e
  test (note: in this spec, `AC-20` is the leak guard — the
  reduced-motion AC lives in SPEC-001).
- **SSR hydration flash.** `useConsent.state` is `'unknown'` on the
  server. Without mitigation, SSR would render the prompt every
  time and hydration would remove it for returning visitors,
  producing a one-frame flash. The `<ClientOnly>` wrapper around
  `<ConsentPrompt>` (AC-24) prevents this by deferring all prompt
  markup to the client.
- **Cookie clearance must cover both eTLD+1 and host-only forms.**
  GA4 sets `_ga` on `domain=jameslanzon.com` (eTLD+1). A naive
  `document.cookie = '_ga=; max-age=0'` only clears the host-only
  variant. AC-8 mandates clearing both forms.

## Test plan

| Layer | Test | Covers AC |
|---|---|---|
| unit | `tests/unit/utils/redactPageLocation.spec.ts` | AC-21 |
| unit | `tests/unit/composables/useConsent.spec.ts` | AC-7, AC-13 |
| unit | `tests/unit/composables/useAnalytics.spec.ts` | AC-11, AC-12, AC-14, AC-16, AC-21, AC-22 |
| unit | `tests/unit/components/Ui/ConsentPrompt.spec.ts` | AC-3, AC-4, AC-6, AC-17 |
| unit | `tests/unit/components/Ui/CookiePreferencesLink.spec.ts` | AC-8 |
| integration | `tests/integration/pages/analytics-build.spec.ts` | AC-9, AC-24, AC-26 |
| integration | `tests/integration/content/legal-schema.spec.ts` | AC-17, AC-18 |
| integration | `tests/integration/pages/head.spec.ts` (extend) | AC-10 (presence under granted), AC-15 (absence under no-JS) |
| e2e | `tests/e2e/ga-consent.spec.ts` | AC-1, AC-2, AC-5, AC-7, AC-8, AC-12, AC-13, AC-14, AC-22, AC-23 |
| e2e | `tests/e2e/ga-leak.spec.ts` | AC-20 |
| e2e | `tests/e2e/no-js.spec.ts` (extend) | AC-15 |
| e2e (lighthouse) | `tests/e2e/JNY-001-recruiter-scan.spec.ts` (extend) | AC-19, AC-25 |

## Task breakdown

Ordered checklist the implementer ticks as they go.

- [ ] **T1** — Add `runtimeConfig.public.ga.measurementId` to
      `nuxt.config.ts`; document the `NUXT_PUBLIC_GA_MEASUREMENT_ID`
      env var in [README.md](../../README.md).
- [ ] **T2** — Add `analytics.consentStorageKey` to `app.config.ts`.
- [ ] **T3** — Create the `legal` content collection in
      `content.config.ts`, including the `consent` Zod schema.
- [ ] **T4** — Author `content/legal/consent.md` and
      `content/legal/privacy.md`.
- [ ] **T5** — Implement `app/composables/useConsent.ts` (SSR-safe,
      GPC/DNT aware, try/catch around storage). Unit-test alongside.
- [ ] **T6a** — Implement `app/utils/redactPageLocation.ts` and
      its unit test (AC-21). Pure helper, written first because the
      analytics composable depends on it.
- [ ] **T6** — Implement `app/composables/useAnalytics.ts`
      (gtag config flags from AC-11, `send_page_view: false`,
      `gtag('set', …)` with redacted location, `router.afterEach`
      `page_view` emitter, lazy script injection, `observeSection`).
      Unit-test alongside.
- [ ] **T7** — Implement `app/components/Ui/ConsentPrompt.vue` and
      `app/components/Ui/CookiePreferencesLink.vue`. Unit-test
      alongside.
- [ ] **T8** — Wire mounts in `app/layouts/default.vue`: wrap
      `<ConsentPrompt>` in `<ClientOnly>` (AC-24); add the always-on
      footer `<NuxtLink to="/legal/privacy">Privacy</NuxtLink>`
      (AC-26); add `<CookiePreferencesLink>` next to it (hidden in
      inert mode, AC-9). Wire section observers in
      `app/pages/index.vue`.
- [ ] **T9** — Add the `/legal/privacy` route page. Set
      `useSeoMeta({ robots: 'noindex,follow' })` on it (resolves the
      open question below).
- [ ] **T10** — Add `.btn-consent` Tailwind component class.
- [ ] **T11** — Write the integration tests
      (`analytics-build.spec.ts`, `legal-schema.spec.ts`, head extend).
- [ ] **T12** — Write the e2e tests
      (`ga-consent.spec.ts`, `ga-leak.spec.ts`, `no-js.spec.ts`
      extension, recruiter-scan Lighthouse extension).
- [ ] **T13** — Update
      [.github/workflows/deploy-pages.yml](../../.github/workflows/deploy-pages.yml)
      to inject `NUXT_PUBLIC_GA_MEASUREMENT_ID` from a repo secret on
      the `generate` step. **Do not** add it to
      [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — CI
      must exercise the inert path.
- [ ] **T14** — Run `npm run typecheck && npm run lint && npm test`.
      All green.
- [ ] **T15** — Append a log under `docs/logs/YYYY-MM-DD-spec-002-*.md`.

## Risks & rollback

- **Risk: Measurement ID leaks into a fork.** GA4 measurement IDs are
  public (they appear in any browser's network tab) and confer no
  write access — exposure is annoying, not catastrophic. *Mitigation:*
  if a fork pollutes the property, add an **IP / referrer filter** in
  GA4 (admin → data filters) excluding any `page_location` whose host
  is not `jameslanzon.com`. No code change required.
- **Risk: `gtag.js` URL changes.** Google has historically been
  stable here. *Mitigation:* the URL lives in one composable; a one-
  line change rotates it. The leak-guard test will fail loudly if
  the host changes silently.
- **Risk: Consent storage schema bump breaks returning visitors.**
  *Mitigation:* the `jl-consent-v1` key is versioned. Bumping to
  `v2` means a re-prompt — acceptable and documented.
- **Risk: Section observer fires during the consent prompt being
  visible.** Acceptable — observation is registered post-mount and
  events are queued (no-op) until consent is granted, then flushed.
  The composable explicitly does **not** flush queued events
  retroactively in iteration 2 (privacy-by-default: events that
  occurred pre-consent are dropped, not stored-and-replayed).
- **Risk: Soft-dark-pattern audit failure.** Regulators increasingly
  scrutinise "Accept/Decline" balance. *Mitigation:* AC-4 enforces
  identical Tailwind classes; reviewer subagent should re-run an
  axe + manual contrast check at PR time.
- **Rollback:** `git revert` the implementation commit and redeploy.
  The `localStorage` key remains on visitors' devices but is harmless
  (read by no code). On the next forward-deploy the key is consulted
  again and respected.

## Open questions (resolved at spec time)

- **Single GA4 property vs shared.** Resolved: **single property**
  for `jameslanzon.com` only. The legacy and any future personal
  projects will get their own properties to keep audience data
  clean. The measurement ID env var is therefore portfolio-specific.
- **`/legal/privacy` `noindex`.** Resolved: **yes** — set
  `useSeoMeta({ robots: 'noindex,follow' })` on the privacy page
  (T9). The page is boilerplate and would dilute search results for
  the home route.
- **Outbound click tracking** (mailto, GitHub, LinkedIn). Out of
  scope for SPEC-002; raise as a future spec.
- **`consent_choice` event** recording the accept/decline decision.
  Out of scope; borderline meta-tracking, raise as a future ADR if
  the data turns out to be valuable.
