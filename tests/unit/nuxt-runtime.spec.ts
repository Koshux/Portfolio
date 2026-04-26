// Placeholder integration test — exercises the Nuxt test runtime environment
// (auto-imports, composables, plugins) without booting a server. Booting the
// full Nuxt server via `setup({ server: true })` from @nuxt/test-utils is
// known to be flaky on Windows (GetPortError). Replace this with `setup()`-
// based suites once we have real pages and run integration tests in CI on
// Linux only.
//
// See: .github/instructions/testing.instructions.md
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'

describe('nuxt runtime environment', () => {
  it('exposes a runtime config', () => {
    const config = useRuntimeConfig()
    expect(config).toBeDefined()
    expect(config.public).toBeDefined()
  })
})
