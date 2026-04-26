// eslint.config.mjs — flat config, picked up by @nuxt/eslint
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['docs/legacy/**', '.output/**', '.nuxt/**', 'dist/**'],
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
