<script setup lang="ts">
import type { HeroBlock } from '../../types/cv'

interface Props {
  hero: HeroBlock
}

defineProps<Props>()
</script>

<template>
  <section id="hero" class="px-6 py-16 sm:py-20">
    <div class="mx-auto max-w-3xl">
      <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
        {{ hero.name }}
      </h1>
      <p class="mt-3 text-lg text-paper-white/80 sm:text-xl">
        {{ hero.title }}<span aria-hidden="true" class="mx-2 text-nuxt-green">—</span>{{ hero.employer }}
      </p>
      <!-- Tagline intentionally hidden in iteration 1 polish; data retained. -->
      <p class="mt-8">
        <a
          data-testid="hero-cta"
          href="#contact"
          class="inline-flex items-center gap-2 rounded-full bg-nuxt-green px-5 py-2.5 text-sm font-semibold text-ink-black motion-safe:transition-colors hover:bg-nuxt-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green focus-visible:ring-offset-2 focus-visible:ring-offset-ink-black"
        >
          Get in touch
          <span aria-hidden="true">→</span>
        </a>
      </p>
    </div>
  </section>
</template>
