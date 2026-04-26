<script setup lang="ts">
interface Props {
  href?: string
  label?: string
}

withDefaults(defineProps<Props>(), {
  href: '#main',
  label: 'Skip to content',
})
</script>

<template>
  <a
    :href="href"
    class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-ink-black focus:px-4 focus:py-2 focus:text-paper-white focus:outline-none focus:ring-2 focus:ring-nuxt-green"
  >
    {{ label }}
  </a>
</template>
