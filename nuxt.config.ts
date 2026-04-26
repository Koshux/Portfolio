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
      title: 'James Lanzon — UX Architect & Accessibility Expert',
      meta: [
        { name: 'description', content: 'UX Architect & Accessibility Expert at the European Commission. Senior full-stack engineer based in Malta.' },
        { name: 'theme-color', content: '#0b1020' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },
  compatibilityDate: '2026-04-25', // Locked to today's date for Nuxt 4 stable behavior
})
