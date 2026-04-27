export default defineAppConfig({
  ui: {
    primary: 'emerald', // Representing the Nuxt flair
    gray: 'zinc',
  },
  analytics: {
    // Versioned localStorage key for the consent record. Bumping the
    // suffix invalidates stored decisions on every visitor's device on
    // their next page load. See SPEC-002 §Risks.
    consentStorageKey: 'jl-consent-v1',
  },
})