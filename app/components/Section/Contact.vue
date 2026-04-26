<script setup lang="ts">
import type { ContactBlock } from '../../types/cv'

interface Props {
  contact: ContactBlock
}

// LinkedIn intentionally lives in the footer (persistent across pages).
// The Contact section focuses on the primary action (email) plus
// minimal supporting metadata.
defineProps<Props>()
</script>

<template>
  <section id="contact" class="px-6 py-20">
    <div class="mx-auto max-w-3xl">
      <h2 class="mb-8 inline-flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
        Contact
      </h2>

      <div class="grid gap-8 md:grid-cols-3 md:gap-10">
        <!-- Primary action takes 2/3 of the row on md+ (rule of thirds). -->
        <div class="md:col-span-2">
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-paper-white/50">
            Get in touch
          </p>
          <a
            :href="`mailto:${contact.email}`"
            class="mt-3 inline-flex items-center gap-3 text-xl font-semibold tracking-tight text-paper-white underline underline-offset-[10px] decoration-nuxt-green/40 motion-safe:transition-colors hover:text-nuxt-green hover:decoration-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green focus-visible:ring-offset-2 focus-visible:ring-offset-ink-black sm:text-2xl md:text-3xl"
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
              class="h-6 w-6 shrink-0 text-nuxt-green"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span class="sr-only">Email </span>
            <span class="break-all">{{ contact.email }}</span>
          </a>
          <p class="mt-4 max-w-md text-sm text-paper-white/60">
            Open to senior individual-contributor and technical-leadership roles &mdash; contract or full-time.
          </p>
        </div>

        <!-- Supporting metadata takes the remaining 1/3. -->
        <aside class="space-y-5 border-t border-paper-white/10 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-paper-white/50">
              Based in
            </p>
            <p class="mt-2 inline-flex items-center gap-2 text-base text-paper-white">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4 text-nuxt-green"
              >
                <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {{ contact.location }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-paper-white/50">
              CV
            </p>
            <p class="mt-2 text-base text-paper-white/80">Available on request</p>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
