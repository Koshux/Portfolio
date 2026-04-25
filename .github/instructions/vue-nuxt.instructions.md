---
description: "Use when authoring or editing Vue 3 / Nuxt 4 code (pages, components, composables, layouts, plugins, middleware). Covers Composition API, auto-imports, SSR/SSG constraints, Tailwind, @nuxt/image, @nuxt/content, @nuxt/fonts."
applyTo: "app/**/*.{vue,ts,js},nuxt.config.ts"
---

# Vue 3 / Nuxt 4 conventions

## Components
- `<script setup lang="ts">` only. No Options API, no `defineComponent({})`.
- Single-file component order: `<script setup>` → `<template>` → `<style>` (omit `<style>` unless Tailwind cannot express the rule).
- File names are `PascalCase.vue` and live in `app/components/`. Subfolders become a name prefix (`Section/Hero.vue` → `<SectionHero />`) — embrace this for grouping.
- Props: `defineProps<{ … }>()` with a TypeScript interface. Always provide `withDefaults` for optional props.
- Emits: `defineEmits<{ (e: 'name', payload: T): void }>()`.
- Slots: type with `defineSlots<…>()` when slot props exist.

## Composables
- One composable per file in `app/composables/`, named `useXxx.ts`.
- Return a plain object of refs/functions. No classes.
- Composables that touch the DOM **must** be guarded by `import.meta.client` or wrapped in `onMounted`.

## Pages & routing
- File-based routing under `app/pages/`. Use `definePageMeta` for layout, middleware, and SEO defaults.
- For SEO, call `useSeoMeta` and `useHead` inside the page's `<script setup>`. Do **not** mutate the head from a child component unless the change is page-scoped.

## SSG / GitHub Pages constraints
- The output is fully static (`nitro.preset = 'github-pages'`, `nitro.static = true`). Therefore:
  - **No** `defineEventHandler`, no `server/` API routes, no runtime middleware that requires Node.
  - All data must be available at build time. Use `@nuxt/content` queries inside `useAsyncData` so they are pre-rendered.
  - Use `<NuxtLink>` for internal nav so the static prerenderer follows it.
  - Avoid `process.env` at runtime in client code; expose values via `runtimeConfig.public` and read with `useRuntimeConfig()`.
- Asset paths must not start with `_`. Keep `app.buildAssetsDir = 'assets'`.

## Styling
- Tailwind utility classes first. Use `@apply` only inside Tailwind layers in `assets/css/tailwind.css`.
- No inline `style` attributes for static values — use Tailwind.
- Dark mode (when added) uses Tailwind's `class` strategy toggled by `@vueuse/core`'s `useDark()`.

## Images & fonts
- `<NuxtImg>` for raster, `<NuxtPicture>` when art-direction is needed. Always set `width`, `height`, and `alt`.
- Fonts via `@nuxt/fonts` config in `nuxt.config.ts`. No `<link rel="stylesheet" href="...fonts.googleapis...">`.

## Auto-imports
- Rely on Nuxt auto-imports for Vue, VueUse, composables, and components. Add an explicit `import` only when there is a collision.

## Anti-patterns
- ❌ Using `localStorage`/`window` at the top of `<script setup>` (breaks SSG build).
- ❌ Hard-coding copy or links in `.vue` files when they belong in `content/`.
- ❌ Adding a `server/` directory.
- ❌ Importing from `~/components/...` — let auto-import handle it.
