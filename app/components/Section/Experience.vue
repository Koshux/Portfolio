<script setup lang="ts">
import type { Role } from '../../types/cv'

interface Props {
  /** Roles in the order to render (caller supplies pre-sorted data). */
  roles: Role[]
}

defineProps<Props>()
</script>

<template>
  <section id="experience" class="px-6 py-10">
    <div class="mx-auto max-w-3xl">
      <h2 class="mb-6 inline-flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
        Experience
      </h2>
      <ol class="space-y-8">
        <li v-for="role in roles" :key="`${role.title}-${role.start}`">
          <TimelineRole :role="role" />
        </li>
      </ol>
    </div>
  </section>
</template>
