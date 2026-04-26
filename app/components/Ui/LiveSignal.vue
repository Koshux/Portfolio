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
    class="inline-flex items-center gap-1.5 rounded-full border border-paper-white/10 bg-ink-black/70 px-2.5 py-1 text-[11px] text-paper-white/80 backdrop-blur-sm sm:px-3 sm:text-xs"
  >
    <span
      aria-hidden="true"
      class="inline-block h-1.5 w-1.5 rounded-full bg-nuxt-green motion-safe:animate-pulse"
    />
    <template v-if="isUnavailable">
      <span>GitHub · recent activity</span>
    </template>
    <template v-else>
      <span class="hidden font-medium sm:inline">{{ repoLabel }}</span>
      <span aria-hidden="true" class="hidden sm:inline">·</span>
      <span>{{ relativeLabel }}</span>
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
