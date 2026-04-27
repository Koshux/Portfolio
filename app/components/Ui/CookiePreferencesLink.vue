<script setup lang="ts">
// SPEC-002 — "Cookie preferences" trigger.
//
// Renders a `<button>` (NOT an anchor — clicking it opens an in-page
// UI rather than navigating). Emits `open` so the parent can re-show
// `<ConsentPrompt>` (the layout watches `useConsent().reopenSignal`).
// The parent decides whether to render the component at all — in the
// minimum-legal placement it lives only on `/legal/privacy` and only
// when a measurement ID is configured (AC-9).

const emit = defineEmits<{
  (e: 'open'): void
}>()

function onClick() { emit('open') }
</script>

<template>
  <button
    type="button"
    data-testid="cookie-preferences-link"
    class="text-paper-white/70 underline underline-offset-4 decoration-paper-white/30 hover:text-nuxt-green hover:decoration-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
    @click="onClick"
  >
    Cookie preferences
  </button>
</template>
