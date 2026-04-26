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

    <footer class="mt-12 border-t border-paper-white/10 px-6 py-8 text-sm text-paper-white/70">
      <div class="mx-auto flex max-w-5xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© James Lanzon</p>
        <p>
          <a
            href="https://www.linkedin.com/in/jameslanzon"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 underline underline-offset-4 motion-safe:transition-colors hover:text-paper-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-4 w-4"
            >
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z"/>
            </svg>
            <span>LinkedIn</span>
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
