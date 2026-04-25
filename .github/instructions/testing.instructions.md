---
description: "Use when writing, running, or debugging tests for the portfolio (Vitest unit/component, @nuxt/test-utils integration, Playwright e2e, Chrome DevTools MCP exploration). Covers layer boundaries, naming, and CI expectations."
applyTo: "tests/**,vitest.config.ts,playwright.config.ts"
---

# Testing rules

The portfolio has four test layers. Pick the **lowest** layer that can prove
the behaviour.

| Layer | Tool | Folder | Picks files |
|---|---|---|---|
| Unit | Vitest | `tests/unit/` | `*.spec.ts` |
| Component | Vitest + `@vue/test-utils` | `tests/unit/components/` | `*.spec.ts` |
| Integration | Vitest + `@nuxt/test-utils` | `tests/integration/` | `*.spec.ts` |
| E2E | Playwright | `tests/e2e/` | `*.spec.ts` |

## Naming
- One spec file per source file, mirroring the path:
  - `app/composables/useTheme.ts` → `tests/unit/composables/useTheme.spec.ts`
  - `app/components/Section/Hero.vue` → `tests/unit/components/Section/Hero.spec.ts`
  - `app/pages/projects/[slug].vue` → `tests/integration/pages/projects-slug.spec.ts`
- E2E specs are named after a journey: `tests/e2e/JNY-003-recruiter-scan.spec.ts`.

## Vitest
- Use `describe`/`it` with present-tense behaviour names: `it('renders the hero CTA')`.
- Prefer `expect(x).toMatchInlineSnapshot()` for stable structural assertions.
- Component tests must mount with `mountSuspended` from `@nuxt/test-utils/runtime` so auto-imports resolve.

## Integration (`@nuxt/test-utils`)
- Wrap the suite with `setup({ host, server, browser: false })`.
- Test Nuxt-specific behaviour: `useAsyncData` hydration, `definePageMeta`, content queries, generated routes.

## Playwright
- Run against the **generated static output**, not the dev server:
  ```ts
  // playwright.config.ts uses webServer: { command: 'npm run preview', port: 3000 }
  ```
- One smoke test per public route is mandatory. Add deeper journey tests as new `JNY-*` are implemented.
- Use `page.getByRole`, `getByLabel`, `getByText` — never CSS selectors unless unavoidable.
- Save screenshots only via `await expect(page).toHaveScreenshot()` so they enter the snapshot suite.

## Chrome DevTools MCP (`mcp_io_github_chr_*`)
- **Exploration only.** Use to poke at the running site, inspect network/console, take ad-hoc screenshots while debugging.
- **Never** use as a substitute for a Playwright spec. If you find a bug with MCP, write a Playwright test that reproduces it before fixing.
- Always tear down pages with `mcp_io_github_chr_close_page` when done.

## Coverage
- CI fails if `app/composables` or `app/components` drop below 80 % line coverage.
- E2E coverage is measured by route — every file in `app/pages/` must appear in at least one e2e spec.

## What not to test
- Framework internals (Nuxt routing, Tailwind class output).
- Visual styling beyond a single screenshot snapshot per page.
- Third-party module internals (`@nuxt/image`, `@nuxt/content`).
