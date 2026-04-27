<script setup lang="ts">
// SPEC-002 — /legal/privacy (revised, hand-built layout).
//
// We previously rendered the privacy notice from `content/legal/privacy.md`
// via `<ContentRenderer>`. That gave us a dense wall of text. The notice
// is short, stable, and high-stakes (legal/UX-critical), so we now lay
// it out by hand with structured cards, semantic landmarks, and clear
// visual hierarchy — easier to scan, easier to comply with WCAG 2.2.
//
// `noindex,follow` per resolved open question in SPEC-002 (page is
// boilerplate; we don't want it diluting search results for `/`).
//
// Hosts the Cookie preferences trigger (AC-9 — minimum-legal
// withdrawal control). The trigger only renders when a measurement ID
// is configured (otherwise there is nothing to consent to). Clicking
// it calls `useConsent().requestReopen()` which the default layout
// watches to surface the consent prompt.

const consent = useConsent()
const analytics = useAnalytics()
const hasMeasurementId = computed(() => analytics.hasMeasurementId.value)

// Title is still sourced from the content collection so the markdown
// file remains the editorial source of truth for the page title.
const { data } = await useAsyncData('legal-privacy', () =>
  queryCollection('legal').path('/legal/privacy').first(),
)

const title = computed(() => {
  const d = data.value as { title?: string } | null
  return d?.title ?? 'Privacy notice'
})

useSeoMeta({
  title: () => `${title.value} — James Lanzon`,
  description: () => 'How jameslanzon.com handles consent-gated Google Analytics 4.',
  robots: 'noindex,follow',
})

function onOpenPrompt() {
  consent.requestReopen()
}

// Last-updated date: kept here so the editorial source (markdown) and
// this view can diverge cleanly. Update by hand when the policy changes.
const lastUpdated = '27 April 2026'

const collected = [
  ['Page path you visited (e.g. ', '/', ', ', '/legal/privacy', ') and page title — query strings stripped except ', 'utm_*', ' attribution.'],
  ['Referring URL (HTTP referrer), with query strings and fragments removed.'],
  ['Country derived from your IP. Your IP itself is anonymised before storage (', 'anonymize_ip: true', ').'],
  ['Device category (mobile / desktop / tablet) and browser family.'],
  ['A first-party ', '_ga', ' cookie used to attribute return visits.'],
] as const

// Token rule: even-indexed entries are plain text, odd-indexed entries
// are rendered as inline <code>. Keeps markup safe (no v-html) while
// preserving the visual highlight on identifiers.
function isCode(i: number) { return i % 2 === 1 }

const notCollected = [
  'Your precise IP address.',
  'Advertising identifiers — Google Signals and ad personalization are disabled at the SDK level.',
  'Cross-site identifiers, fingerprints, or third-party tracking.',
  'Form input, scroll positions, mouse movements, session recordings, or heatmaps.',
  'Email addresses or any URL query parameters that might contain personal data.',
]

const controls = [
  {
    title: 'Change your decision anytime',
    body: 'Use the Cookie preferences button at the top of this page to re-open the prompt and accept or decline.',
  },
  {
    title: 'Revoke clears everything',
    body: 'Declining immediately removes the GA4 script, clears `_ga*` cookies on this domain (host-only and eTLD+1), and stops all subsequent analytics calls.',
  },
  {
    title: 'GPC and DNT are honoured',
    body: 'If your browser sends `Sec-GPC: 1` or `navigator.doNotTrack === \'1\'`, the prompt is hidden by default and the GA tag never loads.',
  },
  {
    title: 'Content blockers welcome',
    body: 'We do not detect or circumvent ad blockers, privacy extensions, or tracker-protection lists.',
  },
]
</script>

<template>
  <article class="px-4 py-12 sm:px-6 sm:py-16">
    <div class="mx-auto max-w-3xl text-paper-white">

      <!-- Page header -->
      <header class="mb-10">
        <p class="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-nuxt-green">
          <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
          Legal
        </p>
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy notice
        </h1>
        <p class="mt-3 text-base text-paper-white/80">
          How <span class="font-mono text-paper-white">jameslanzon.com</span> handles consent-gated Google Analytics 4.
        </p>
        <p class="mt-2 text-xs text-paper-white/50">
          Last updated <time :datetime="'2026-04-27'">{{ lastUpdated }}</time>
        </p>

        <!-- Cookie preferences action — only when GA is configured -->
        <div v-if="hasMeasurementId" class="mt-6 rounded-2xl border border-nuxt-green/40 bg-nuxt-green/5 p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-paper-white">
                Manage your analytics consent
              </p>
              <p class="mt-1 text-sm text-paper-white/70">
                Re-open the prompt to accept or revoke at any time.
              </p>
            </div>
            <UiCookiePreferencesLink class="shrink-0" @open="onOpenPrompt" />
          </div>
        </div>
      </header>

      <!-- TL;DR -->
      <section aria-labelledby="tldr-heading" class="mb-10 rounded-2xl border border-paper-white/10 bg-paper-white/5 p-5 sm:p-6">
        <h2 id="tldr-heading" class="text-sm font-semibold uppercase tracking-widest text-nuxt-green">
          In short
        </h2>
        <p class="mt-3 text-base text-paper-white/90">
          This site is a static portfolio. The only optional analytics is
          <strong class="font-semibold text-paper-white">Google Analytics 4</strong> — and it loads
          <strong class="font-semibold text-paper-white">only after</strong> you click
          <em class="not-italic font-semibold text-nuxt-green">Accept</em> on the consent prompt.
          Decline once and nothing is sent. Ever.
        </p>
      </section>

      <!-- What we collect / What we don't — two-column grid -->
      <section aria-labelledby="data-heading" class="mb-12">
        <h2 id="data-heading" class="sr-only">Data collection summary</h2>
        <div class="grid gap-4 sm:grid-cols-2 sm:gap-5">

          <article class="rounded-2xl border border-paper-white/10 bg-paper-white/5 p-5">
            <header class="mb-4 flex items-center gap-3">
              <span aria-hidden="true" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-nuxt-green/15 text-nuxt-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <h3 class="text-base font-semibold text-paper-white">
                What we collect <span class="text-paper-white/60">(only with consent)</span>
              </h3>
            </header>
            <ul class="space-y-2.5 text-sm text-paper-white/85">
              <li v-for="(item, i) in collected" :key="i" class="flex gap-2">
                <span aria-hidden="true" class="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-nuxt-green" />
                <span>
                  <template v-for="(tok, j) in item" :key="j">
                    <code v-if="isCode(j)" class="rounded bg-paper-white/10 px-1 py-0.5 text-[0.85em] text-paper-white">{{ tok }}</code>
                    <template v-else>{{ tok }}</template>
                  </template>
                </span>
              </li>
            </ul>
          </article>

          <article class="rounded-2xl border border-paper-white/10 bg-paper-white/5 p-5">
            <header class="mb-4 flex items-center gap-3">
              <span aria-hidden="true" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper-white/10 text-paper-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
              <h3 class="text-base font-semibold text-paper-white">
                What we don't collect
              </h3>
            </header>
            <ul class="space-y-2.5 text-sm text-paper-white/85">
              <li v-for="(item, i) in notCollected" :key="i" class="flex gap-2">
                <span aria-hidden="true" class="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-paper-white/40" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </article>

        </div>
      </section>

      <!-- Retention -->
      <section aria-labelledby="retention-heading" class="mb-12 rounded-2xl border border-paper-white/10 p-5 sm:p-6">
        <header class="mb-3 flex items-center gap-3">
          <span aria-hidden="true" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-nuxt-green/15 text-nuxt-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <h2 id="retention-heading" class="text-lg font-semibold text-paper-white">
            Retention
          </h2>
        </header>
        <p class="text-sm text-paper-white/85">
          GA4 retains event-level data for the default
          <strong class="font-semibold text-paper-white">14 months</strong>, after which it is aggregated.
          The <code class="rounded bg-paper-white/10 px-1 py-0.5 text-[0.85em]">_ga</code> cookie expires after
          <strong class="font-semibold text-paper-white">2 years</strong> unless you revoke consent first.
        </p>
      </section>

      <!-- Your controls -->
      <section aria-labelledby="controls-heading" class="mb-12">
        <header class="mb-5 flex items-center gap-3">
          <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
          <h2 id="controls-heading" class="text-lg font-semibold text-paper-white">
            Your controls
          </h2>
        </header>
        <ul class="grid gap-3 sm:grid-cols-2">
          <li v-for="c in controls" :key="c.title" class="rounded-2xl border border-paper-white/10 bg-paper-white/5 p-4">
            <p class="text-sm font-semibold text-nuxt-green">
              {{ c.title }}
            </p>
            <p class="mt-1.5 text-sm text-paper-white/85">
              {{ c.body }}
            </p>
          </li>
        </ul>
      </section>

      <!-- JS-disabled note -->
      <section aria-labelledby="nojs-heading" class="mb-12 rounded-2xl border border-paper-white/10 bg-paper-white/5 p-5">
        <h2 id="nojs-heading" class="text-base font-semibold text-paper-white">
          When JavaScript is disabled
        </h2>
        <p class="mt-2 text-sm text-paper-white/85">
          The site is fully usable without JavaScript. With JS off, the
          consent prompt does not render and no analytics runs.
        </p>
      </section>

      <!-- Contact -->
      <section aria-labelledby="contact-heading" class="rounded-2xl border border-paper-white/10 p-5">
        <h2 id="contact-heading" class="text-base font-semibold text-paper-white">
          Questions?
        </h2>
        <p class="mt-2 text-sm text-paper-white/85">
          Email
          <a
            href="mailto:lanzonprojects@gmail.com"
            class="font-medium text-paper-white underline underline-offset-4 decoration-nuxt-green/50 hover:text-nuxt-green hover:decoration-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
          >
            lanzonprojects@gmail.com
          </a>.
        </p>
      </section>

    </div>
  </article>
</template>
