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
      <h2 class="mb-6 inline-flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
        Contact
      </h2>
      <p class="text-base">
        <a
          :href="`mailto:${contact.email}`"
          class="inline-flex items-center gap-2 font-medium text-paper-white underline underline-offset-4 decoration-paper-white/30 motion-safe:transition-colors hover:text-nuxt-green hover:decoration-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
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
      <p class="mt-4 text-base text-paper-white/70">CV available on request</p>
      <p v-if="linkedIn" class="mt-4 text-base">
        <a
          :href="linkedIn.href"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-paper-white underline underline-offset-4 motion-safe:transition-colors hover:text-paper-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
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
          <span>{{ linkedIn.label }}</span>
        </a>
      </p>
    </div>
  </section>
</template>
