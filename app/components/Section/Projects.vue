<script setup lang="ts">
import type { Project } from '../../types/cv'

interface Props {
  projects: Project[]
}

defineProps<Props>()
</script>

<template>
  <section v-if="projects.length" id="projects" class="px-6 py-12">
    <div class="mx-auto max-w-3xl">
      <h2 class="mb-6 inline-flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span aria-hidden="true" class="h-px w-8 bg-nuxt-green" />
        Selected work
      </h2>
      <ul class="grid gap-4 sm:grid-cols-2">
        <li
          v-for="(project, index) in projects"
          :key="project.href"
          class="group relative flex flex-col rounded-2xl border border-paper-white/10 p-5 motion-safe:transition-colors hover:border-nuxt-green/60 focus-within:border-nuxt-green/60"
        >
          <h3 class="text-lg font-semibold tracking-tight">
            <a
              :href="project.href"
              :aria-describedby="`project-desc-${index}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-start gap-1.5 text-paper-white underline underline-offset-4 decoration-paper-white/30 hover:decoration-nuxt-green hover:text-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
            >
              <span>{{ project.title }}</span>
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="mt-1 h-3.5 w-3.5 shrink-0 text-nuxt-green"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </h3>
          <p v-if="project.role" class="mt-1 text-sm text-nuxt-green/90">
            {{ project.role }}
          </p>
          <p v-if="project.repo" class="mt-3 text-sm">
            <a
              :href="project.repo"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-paper-white/70 underline underline-offset-4 hover:text-nuxt-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuxt-green motion-safe:transition-colors"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-3.5 w-3.5"
              >
                <path
                  d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.97 10.97 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"
                />
              </svg>
              <span>Source</span>
            </a>
          </p>

          <!--
            Accessible description: kept in the DOM via .sr-only and
            linked from the title link with aria-describedby, so screen
            readers announce it without any hover/focus interaction.
            (WCAG 2.2 — 1.3.1 Info & Relationships, 4.1.2 Name/Role/Value.)
          -->
          <span :id="`project-desc-${index}`" class="sr-only">{{ project.summary }}</span>

          <!--
            Visual tooltip slides up from the bottom of the card on hover
            or when any descendant has focus. aria-hidden because the
            same text is already exposed via aria-describedby above — we
            don't want it announced twice. Persists while the pointer is
            over the card or focus is inside it (WCAG 2.2 — 1.4.13:
            hoverable + persistent; dismiss by moving focus / pointer
            away). motion-safe gates the slide for reduced-motion users.
          -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute left-0 right-0 top-full z-10 mt-2 origin-top scale-95 rounded-xl border border-nuxt-green/40 bg-ink-black/95 px-4 py-3 text-sm text-paper-white/90 opacity-0 shadow-lg shadow-ink-black/60 backdrop-blur-sm motion-safe:transition motion-safe:duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
          >
            {{ project.summary }}
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
