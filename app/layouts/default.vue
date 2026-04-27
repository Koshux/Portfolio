<script setup lang="ts">
// Default page chrome. The skip link is the first focusable element so
// keyboard users can land on `<main>` immediately. The header is sticky
// so the live-signal chip and the GitHub / email icon links are reachable
// from any scroll position (AC-3, AC-21).
//
// SPEC-002 wiring (revised — minimum-legal placement):
//  - <ConsentPrompt> mounts inside <ClientOnly> so the static HTML for
//    `/` never contains its markup (AC-24, AC-15).
//  - There is NO sitewide <footer>. The persistent Privacy link lives
//    in the header contact menu (AC-26). The Cookie preferences trigger
//    is rendered on `/legal/privacy` (AC-9) and re-opens the prompt via
//    `useConsent().reopenSignal` which the layout watches below.
//  - Consent state, accept/decline, and the analytics side effects are
//    delegated to `useConsent` / `useAnalytics`.

import { computed, ref, watch } from 'vue'

const consent = useConsent()
const analytics = useAnalytics()
const hasMeasurementId = computed(() => analytics.hasMeasurementId.value)

// Always-on user toggle: when true, render the prompt regardless of
// stored state. Auto-clears once the user makes a decision.
const userOpenedPrompt = ref(false)

// Re-open requests come from any descendant via
// `useConsent().requestReopen()`. The privacy page uses this to
// surface the prompt over its own route.
watch(() => consent.reopenSignal.value, (n, prev) => {
  if (n !== prev) userOpenedPrompt.value = true
})

const showPrompt = computed(() => {
  if (!hasMeasurementId.value) return false
  if (consent.respectsGpc.value) {
    // Only show if the user explicitly opened it (so GPC users can
    // override their browser signal).
    return userOpenedPrompt.value
  }
  if (userOpenedPrompt.value) return true
  return consent.state.value === 'unknown' && consent.hydrated.value
})

// Consent prompt copy comes from `content/legal/consent.md` so the
// component holds no hard-coded strings (AC-17).
const { data: consentDoc } = await useAsyncData('legal-consent', () =>
  // queryCollection returns the whole collection; pick the consent doc
  // by its file id.
  queryCollection('legal').path('/legal/consent').first(),
)

const promptCopy = computed(() => {
  // The frontmatter prompt-body field is named `prompt` (NOT `body`)
  // because @nuxt/content v3 surfaces the parsed markdown AST under
  // the `body` property of every `type: 'page'` document, which would
  // shadow a frontmatter `body` field and render `[object Object]`.
  const d = consentDoc.value as {
    title?: string
    prompt?: string
    acceptLabel?: string
    declineLabel?: string
    privacyHref?: string
  } | null
  return {
    title: d?.title ?? 'Cookies & analytics',
    prompt: d?.prompt ?? 'We use Google Analytics 4 to understand which pages visitors find useful. Analytics is off by default; choose below.',
    acceptLabel: d?.acceptLabel ?? 'Accept',
    declineLabel: d?.declineLabel ?? 'Decline',
    privacyHref: d?.privacyHref ?? '/legal/privacy',
  }
})

function onAccept() {
  consent.accept()
  userOpenedPrompt.value = false
}

function onDecline() {
  consent.decline()
  userOpenedPrompt.value = false
}
</script>

<template>
  <div class="min-h-dvh bg-ink-black text-paper-white">
    <UiSkipLink />

    <header
      class="sticky top-0 z-40 border-b border-paper-white/10 bg-ink-black/80 backdrop-blur"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <NuxtLink
          to="/"
          class="whitespace-nowrap font-semibold tracking-tight text-paper-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
        >
          James Lanzon
        </NuxtLink>
        <div class="flex items-center gap-1 sm:gap-2">
          <UiLiveSignal />
          <UiContactMenu />
        </div>
      </div>
    </header>

    <main id="main" tabindex="-1" class="focus:outline-none">
      <slot />
    </main>

    <ClientOnly>
      <UiConsentPrompt
        v-if="showPrompt"
        :title="promptCopy.title"
        :prompt="promptCopy.prompt"
        :accept-label="promptCopy.acceptLabel"
        :decline-label="promptCopy.declineLabel"
        :privacy-href="promptCopy.privacyHref"
        @accept="onAccept"
        @decline="onDecline"
      />
    </ClientOnly>
  </div>
</template>
