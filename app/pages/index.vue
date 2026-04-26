<script setup lang="ts">
const cv = await useCvContent()

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
</script>

<template>
  <div>
    <SectionHero :hero="cv.hero.value" />
    <SectionOverview :overview="cv.overview.value" />
    <SectionExperience :roles="cv.experience.value" />
    <SectionSkills :groups="cv.skills.value" />
    <SectionContact :contact="cv.contact.value" />
  </div>
</template>
