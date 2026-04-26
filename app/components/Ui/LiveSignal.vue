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
    class="inline-flex items-center gap-1.5 rounded-full border border-ink-black/10 bg-paper-white/70 px-3 py-1 text-xs text-ink-black/80 backdrop-blur-sm"
  >
    <template v-if="isUnavailable">
      <span>GitHub · recent activity</span>
    </template>
    <template v-else>
      <span class="font-medium">{{ repoLabel }}</span>
      <span aria-hidden="true">·</span>
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
