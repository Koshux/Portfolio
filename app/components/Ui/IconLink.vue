<script setup lang="ts">
interface Props {
  /** Destination URL (or `mailto:` / `#anchor`). */
  href: string
  /** Accessible name announced by screen readers. Becomes `aria-label`. */
  label: string
  /** Visible-only-to-AT label rendered inside `<span class="sr-only">`. */
  srLabel: string
  /** When `true`, opens in a new tab and adds `rel="noopener noreferrer"`. */
  external?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  external: false,
})

const target = computed(() => (props.external ? '_blank' : undefined))
const rel = computed(() => (props.external ? 'noopener noreferrer' : undefined))
</script>

<template>
  <a
    :href="href"
    :aria-label="label"
    :target="target"
    :rel="rel"
    class="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-black hover:bg-ink-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-black/40 motion-safe:transition-colors"
  >
    <span class="sr-only">{{ srLabel }}</span>
    <span class="inline-flex h-5 w-5 items-center justify-center">
      <slot />
    </span>
  </a>
</template>
