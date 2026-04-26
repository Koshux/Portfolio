<script setup lang="ts">
import type { SkillGroup } from '../../types/cv'

interface Props {
  groups: SkillGroup[]
}

defineProps<Props>()
</script>

<template>
  <section class="px-6 py-10">
    <div class="mx-auto max-w-3xl">
      <h2 class="mb-6 text-2xl font-semibold tracking-tight">Skills</h2>
      <div class="space-y-6">
        <div v-for="group in groups" :key="group.label">
          <h3 class="text-base font-semibold">{{ group.label }}</h3>
          <ul class="mt-2 flex flex-wrap gap-2">
            <li
              v-for="item in group.items"
              :key="item"
              class="rounded-full border border-ink-black/10 bg-paper-white px-3 py-1 text-sm text-ink-black/80"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
