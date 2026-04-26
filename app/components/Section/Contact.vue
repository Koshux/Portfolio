<script setup lang="ts">
import type { ContactBlock } from '../../types/cv'

interface Props {
  contact: ContactBlock
}

const props = defineProps<Props>()

const linkedIn = computed(() =>
  props.contact.social.find(s => /linkedin/i.test(s.label) || /linkedin/i.test(s.href)),
)
</script>

<template>
  <section id="contact" class="px-6 py-16">
    <div class="mx-auto max-w-3xl">
      <h2 class="mb-6 text-2xl font-semibold tracking-tight">Contact</h2>
      <p class="text-base">
        <a
          :href="`mailto:${contact.email}`"
          class="inline-flex items-center gap-2 font-medium text-ink-black underline underline-offset-4 motion-safe:transition-colors hover:text-ink-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <span class="sr-only">Email </span>
          <span>{{ contact.email }}</span>
        </a>
      </p>
      <p class="mt-4 text-base text-ink-black/70">CV available on request</p>
      <p v-if="linkedIn" class="mt-4 text-base">
        <a
          :href="linkedIn.href"
          target="_blank"
          rel="noopener noreferrer"
          class="text-ink-black underline underline-offset-4 motion-safe:transition-colors hover:text-ink-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
        >
          {{ linkedIn.label }}
        </a>
      </p>
    </div>
  </section>
</template>
