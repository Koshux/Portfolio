<script setup lang="ts">
import type { HeroBlock } from '../../types/cv'

interface Props {
  hero: HeroBlock
}

defineProps<Props>()
</script>

<template>
  <section class="px-6 py-16 sm:py-20">
    <div class="mx-auto max-w-3xl">
      <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
        {{ hero.name }}
      </h1>
      <p class="mt-3 text-lg text-ink-black/80 sm:text-xl">
        {{ hero.title }} — {{ hero.employer }}
      </p>
      <p class="mt-6 max-w-2xl text-base text-ink-black/70 sm:text-lg">
        {{ hero.tagline }}
      </p>
      <p class="mt-8">
        <a
          data-testid="hero-cta"
          href="#contact"
          class="inline-flex items-center gap-2 rounded-full bg-ink-black px-5 py-2.5 text-sm font-medium text-paper-white motion-safe:transition-colors hover:bg-ink-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green"
        >
          Get in touch
          <span aria-hidden="true">→</span>
        </a>
      </p>
    </div>
  </section>
</template>
