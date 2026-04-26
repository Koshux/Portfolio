<script setup lang="ts">
const { signal, isUnavailable } = await useLiveSignal()
const maltaTime = useMaltaClock()

// Derived display values for the commit-data branch. Computed in a way
// that narrows the discriminated union safely.
const repoLabel = computed(() => ('repo' in signal.value ? signal.value.repo : null))
const relativeLabel = computed(() =>
  'timestamp' in signal.value ? relativeTime(signal.value.timestamp) : null,
)

// SSR-only Malta fallback string ("Malta · CET" / "Malta · CEST"). Resolved
// at SSG time so the no-JS path still names the timezone.
const maltaFallback = computeMaltaFallback()

function computeMaltaFallback(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Malta',
      timeZoneName: 'short',
    }).formatToParts(new Date())
    const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'CET'
    return `Malta · ${tz}`
  }
  catch {
    return 'Malta · CET'
  }
}
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    aria-label="Latest GitHub activity"
    class="inline-flex items-center gap-1.5 rounded-full border border-paper-white/10 bg-ink-black/70 px-2.5 py-1 text-[11px] text-paper-white/80 backdrop-blur-sm sm:px-3 sm:text-xs"
  >
    <!--
      Tiny GitHub mark gives the chip context on mobile where the repo
      label is hidden. aria-hidden because the surrounding role="status"
      already has an accessible name via aria-label.
    -->
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="h-3 w-3 shrink-0 text-paper-white/70"
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.97 10.97 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
    <span
      aria-hidden="true"
      class="inline-block h-1.5 w-1.5 rounded-full bg-nuxt-green motion-safe:animate-pulse"
    />
    <template v-if="isUnavailable">
      <span>recent activity</span>
    </template>
    <template v-else>
      <span class="hidden font-medium sm:inline">{{ repoLabel }}</span>
      <span aria-hidden="true" class="hidden sm:inline">·</span>
      <span><span class="sr-only">last commit </span>{{ relativeLabel }}</span>
    </template>
    <span aria-hidden="true">·</span>
    <ClientOnly>
      <span>{{ maltaTime }}</span>
      <template #fallback>
        <span>{{ maltaFallback }}</span>
      </template>
    </ClientOnly>
  </div>
</template>
