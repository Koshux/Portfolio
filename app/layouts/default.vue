<script setup lang="ts">
// Default page chrome. The skip link is the first focusable element so
// keyboard users can land on `<main>` immediately. The header is sticky
// so the live-signal chip and the GitHub / email icon links are reachable
// from any scroll position (AC-3, AC-21).
</script>

<template>
  <div class="min-h-dvh bg-ink-black text-paper-white">
    <UiSkipLink />

    <header
      class="sticky top-0 z-40 border-b border-paper-white/10 bg-ink-black/80 backdrop-blur"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <a
          href="#"
          class="whitespace-nowrap font-semibold tracking-tight text-paper-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
        >
          James Lanzon
        </a>
        <div class="flex items-center gap-1 sm:gap-2">
          <UiLiveSignal />
          <UiContactMenu />
        </div>
      </div>
    </header>

    <main id="main" tabindex="-1" class="focus:outline-none">
      <slot />
    </main>
  </div>
</template>
