<script setup lang="ts">
import { onMounted } from 'vue'

const cv = await useCvContent()
const analytics = useAnalytics()

useSeoMeta({
  title: () => cv.hero.value.name
    ? `${cv.hero.value.name} — ${cv.hero.value.title}`
    : 'James Lanzon — UX Architect',
  description: () => cv.hero.value.tagline,
  ogTitle: () => `${cv.hero.value.name} — ${cv.hero.value.title}`,
  ogDescription: () => cv.hero.value.tagline,
  ogUrl: () => cv.og.value.url || 'https://jameslanzon.com/',
  ogImage: () => cv.og.value.image || 'https://jameslanzon.com/og/og-image.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterImage: () => cv.og.value.image || 'https://jameslanzon.com/og/og-image.png',
})

// SPEC-002 AC-14 — observe each rendered section once per session.
// Sections render with stable ids; we look them up after mount rather
// than threading template refs through every Section component.
onMounted(() => {
  for (const id of ['hero', 'projects', 'experience', 'skills', 'contact']) {
    const el = document.getElementById(id)
    if (el) analytics.observeSection(el, id)
  }
})
</script>

<template>
  <div>
    <SectionHero :hero="cv.hero.value" />
    <SectionProjects :projects="cv.projects.value" />
    <SectionExperience :roles="cv.experience.value" />
    <SectionSkills :groups="cv.skills.value" />
    <SectionContact :contact="cv.contact.value" />
  </div>
</template>
