<script setup lang="ts">
// SPEC-002 — non-modal consent prompt.
//
// Renders a bottom-anchored region that does NOT trap focus, does NOT
// occlude the hero on a 360x600 mobile viewport, and exposes equally
// weighted Accept / Decline buttons (AC-3, AC-4, AC-5).
//
// Copy comes in via props (loaded from `content/legal/consent.md` by
// the parent layout) so this component holds no hard-coded strings
// (AC-17). The prompt itself is wrapped in `<ClientOnly>` upstream, so
// it never appears in the static HTML and there is no SSR flash
// during hydration (AC-24).

interface Props {
  title: string
  prompt: string
  acceptLabel: string
  declineLabel: string
  privacyHref: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'accept' | 'decline'): void
}>()

function onAccept() { emit('accept') }
function onDecline() { emit('decline') }
</script>

<template>
  <aside
    role="region"
    aria-labelledby="consent-title"
    data-testid="consent-prompt"
    class="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-3xl rounded-2xl border border-paper-white/10 bg-ink-black/95 p-4 text-sm text-paper-white shadow-lg shadow-ink-black/60 backdrop-blur-sm sm:inset-x-4 sm:bottom-4 sm:p-5"
  >
    <h2
      id="consent-title"
      class="text-base font-semibold tracking-tight"
    >
      {{ title }}
    </h2>
    <p class="mt-2 text-paper-white/80">
      {{ prompt }}
      <NuxtLink
        :to="privacyHref"
        class="underline underline-offset-4 decoration-paper-white/40 hover:decoration-nuxt-green hover:text-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
      >
        Privacy
      </NuxtLink>
    </p>
    <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        data-testid="consent-decline"
        class="btn-consent btn-consent--decline"
        @click="onDecline"
      >
        {{ declineLabel }}
      </button>
      <button
        type="button"
        data-testid="consent-accept"
        class="btn-consent btn-consent--accept"
        @click="onAccept"
      >
        {{ acceptLabel }}
      </button>
    </div>
  </aside>
</template>
