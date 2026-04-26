// nuxt.config.ts
export default defineNuxtConfig({
  // Force Nuxt 4 directory structure and features
  future: {
    compatibilityVersion: 4,
  },

  // Core App Configuration
  ssr: true,

  // Deployment Configuration for jameslanzon.com on GH Pages
  nitro: {
    preset: 'github-pages',
    static: true
  },

  // Modules setup
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@nuxt/test-utils/module'
  ],

  // Tailwind entry — registered globally so all pages get base/components/utilities.
  css: ['~/assets/css/tailwind.css'],

  // Essential for GH Pages: ensure assets don't start with underscores
  app: {
    baseURL: '/',
    buildAssetsDir: 'assets',
    head: {
      title: 'James Lanzon // UX Architect & Above Bored',
      meta: [
        { name: 'description', content: 'UX Architect specializing in mission-critical applications and accessibility at the European Commission. Founder of Above Bored (CHRA).' },
        { name: 'theme-color', content: '#00DC82' }
      ],
      htmlAttrs: {
        lang: 'en'
      }
    },
  },
  compatibilityDate: '2026-04-25', // Locked to today's date for Nuxt 4 stable behavior
})
