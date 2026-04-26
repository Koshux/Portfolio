<script setup lang="ts">
import type { Role } from '../../types/cv'

interface Props {
  role: Role
}

const props = defineProps<Props>()

const dateRange = computed(() => {
  const start = formatDate(props.role.start)
  const end = props.role.end === null ? 'Present' : formatDate(props.role.end)
  return `${start} – ${end}`
})

function formatDate(value: string): string {
  // Display the year only (matches the editorial style in docs/cv/cv.md).
  // YYYY-MM is rendered as YYYY for the timeline header; the precise month
  // remains available in the schema for future enhancements.
  return value.slice(0, 4)
}
</script>

<template>
  <article>
    <h3 class="text-lg font-semibold tracking-tight">{{ role.title }}</h3>
    <p class="text-sm text-ink-black/70">
      <span>{{ role.organisation }}</span>
      <span aria-hidden="true"> · </span>
      <span>{{ dateRange }}</span>
    </p>
    <ul class="mt-3 list-disc space-y-1.5 pl-5 text-base text-ink-black/85" style="overflow-wrap: anywhere;">
      <li v-for="(bullet, i) in role.bullets" :key="i">{{ bullet }}</li>
    </ul>
  </article>
</template>
