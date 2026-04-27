<script setup lang="ts">
import type { SkillGroup } from '../../types/cv'

interface Props {
  groups: SkillGroup[]
}

defineProps<Props>()
</script>

<template>
  <section id="skills" class="px-6 py-10">
    <div class="mx-auto max-w-3xl">
      <h2 class="mb-6 inline-flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
        Skills
      </h2>
      <div class="space-y-6">
        <div v-for="group in groups" :key="group.label">
          <h3 class="text-base font-semibold text-nuxt-green">{{ group.label }}</h3>
          <ul class="mt-2 flex flex-wrap gap-2">
            <li
              v-for="item in group.items"
              :key="item"
              class="rounded-full border border-paper-white/10 bg-ink-black px-3 py-1 text-sm text-paper-white/80"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
