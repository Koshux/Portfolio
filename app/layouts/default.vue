<script setup lang="ts">
// Default page chrome. The skip link is the first focusable element so
// keyboard users can land on `<main>` immediately. The header is sticky
// so the live-signal chip and the GitHub / email icon links are reachable
// from any scroll position (AC-3, AC-21).
</script>

<template>
  <div class="min-h-dvh bg-paper-white text-ink-black">
    <UiSkipLink />

    <header
      class="sticky top-0 z-40 border-b border-ink-black/10 bg-paper-white/80 backdrop-blur"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a
          href="#"
          class="font-semibold tracking-tight text-ink-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
        >
          James Lanzon
        </a>
        <div class="flex items-center gap-2 sm:gap-3">
          <UiLiveSignal />
          <UiIconLink
            href="https://github.com/jameslanzon"
            :label="`James' GitHub profile`"
            sr-label="GitHub"
            :external="true"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-5 w-5"
            >
              <path
                d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.97 10.97 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"
              />
            </svg>
          </UiIconLink>
          <UiIconLink
            href="mailto:lanzonprojects@gmail.com"
            label="Email James"
            sr-label="Email"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </UiIconLink>
        </div>
      </div>
    </header>

    <main id="main" tabindex="-1" class="focus:outline-none">
      <slot />
    </main>

    <footer class="mt-12 border-t border-ink-black/10 px-6 py-8 text-sm text-ink-black/70">
      <div class="mx-auto flex max-w-5xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© James Lanzon</p>
        <p>
          <a
            href="https://www.linkedin.com/in/jameslanzon"
            target="_blank"
            rel="noopener noreferrer"
            class="underline underline-offset-4 motion-safe:transition-colors hover:text-ink-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
          >
            LinkedIn
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
