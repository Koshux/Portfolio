<script setup lang="ts">
interface Props {
  overview: string
}

const props = defineProps<Props>()

// Split on blank lines so multi-paragraph overview blocks render as
// multiple `<p>` elements without needing v-html.
const paragraphs = computed(() =>
  props.overview
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean),
)
</script>

<template>
  <section class="px-6 py-10">
    <div class="prose-portfolio mx-auto max-w-3xl">
      <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
    </div>
  </section>
</template>
