---
date: 2026-04-26
session: "spec-001-foundations-T1-T9"
agent: "copilot"
spec: SPEC-001
journey: JNY-001
status: in-progress
duration-min: 0
---

# Log — 2026-04-26 — SPEC-001 foundations (T1–T9)

> **Partial log.** Covers checkpoint T1–T9 only. Tasks T10–T24 remain open.
> A final SPEC-001 log will be authored once the spec is fully delivered.

## Context
First implementation pass on SPEC-001 (portfolio revamp iteration 1, JNY-001).
Goal of this session: land all foundation work — tooling, content schemas,
utilities, build-time live-signal pipeline, and composables — so that the
component/page work in T10–T24 can proceed against a known-good base.

## What was done
- **T1** Authored [docs/decisions/ADR-001-live-signal-build-time.md](../decisions/ADR-001-live-signal-build-time.md)
  capturing the build-time GitHub fetch decision (status: accepted).
- **T2** Repo cleanup: moved legacy `website/` to
  [docs/legacy/website-2016-2018/](../legacy/website-2016-2018/) (flattened,
  with frozen-artefact README), moved root `CNAME` to
  [public/CNAME](../../public/CNAME), deleted root `index.html` and
  `content_index.md`.
- **T3** Tailwind/typography wiring: [app/assets/css/tailwind.css](../../app/assets/css/tailwind.css)
  with `@layer base` defaults and a `prose-portfolio` class; converted
  [tailwind.config.js](../../tailwind.config.js) to ESM `export default` with
  Inter as the default sans stack; registered the CSS entry in
  [nuxt.config.ts](../../nuxt.config.ts). `@nuxt/fonts` already in modules
  list, `lang=en` already set on `<Html>`.
- **T4** Pure helper [app/utils/sortRoles.ts](../../app/utils/sortRoles.ts) +
  CV type definitions in [app/types/cv.ts](../../app/types/cv.ts). Stable
  sort, year-only `start` normalises to `YYYY-01`.
- **T5** [app/utils/relativeTime.ts](../../app/utils/relativeTime.ts) using
  `Intl.RelativeTimeFormat('en')` with a 45 s "just now" floor and an
  injectable `now` for tests.
- **T6** Content collections in [content.config.ts](../../content.config.ts):
  `content` (excludes `cv.md`), `cv` (page collection from `cv.md`),
  `liveSignal` (data collection from `live-signal.json`). Schemas extracted
  to [shared/content-schemas.ts](../../shared/content-schemas.ts) so they
  can be reused by tests. Authored [content/cv.md](../../content/cv.md)
  (full frontmatter, body intentionally empty) and seeded
  [content/live-signal.json](../../content/live-signal.json) with the
  unavailable fallback.
- **T7** Build-time pipeline:
  [scripts/fetch-live-signal.mjs](../../scripts/fetch-live-signal.mjs) +
  [scripts/setup-dev.mjs](../../scripts/setup-dev.mjs). `package.json` gains
  `prebuild`, `pregenerate`, and `dev:setup` scripts. Honours
  `SKIP_LIVE_SIGNAL_FETCH=1` and `GITHUB_TOKEN`. Always exits 0 so a CI
  rate-limit cannot break the build.
- **T8** Composables for the live signal:
  [app/composables/useLiveSignal.ts](../../app/composables/useLiveSignal.ts)
  and [app/composables/useMaltaClock.ts](../../app/composables/useMaltaClock.ts).
- **T9** CV composable [app/composables/useCvContent.ts](../../app/composables/useCvContent.ts).
  Returns sorted experience via `sortRoles`, exposes typed refs for hero /
  overview / skills / contact / og / updated plus `pending` and `error`.

## Tests added / changed
- [tests/unit/utils/sortRoles.spec.ts](../../tests/unit/utils/sortRoles.spec.ts) — 8 tests (AC for SPEC-001 T5)
- [tests/unit/utils/relativeTime.spec.ts](../../tests/unit/utils/relativeTime.spec.ts) — 18 tests (AC for SPEC-001 T6)
- [tests/integration/content/cv-schema.spec.ts](../../tests/integration/content/cv-schema.spec.ts) — 5 tests against the shared zod schemas (AC for SPEC-001 T2)
- [tests/unit/scripts/fetch-live-signal.spec.ts](../../tests/unit/scripts/fetch-live-signal.spec.ts) — 7 tests (AC for SPEC-001 T7)
- [tests/unit/composables/useMaltaClock.spec.ts](../../tests/unit/composables/useMaltaClock.spec.ts) — 3 tests
- [tests/unit/composables/useLiveSignal.spec.ts](../../tests/unit/composables/useLiveSignal.spec.ts) — 3 tests
- [tests/unit/composables/useCvContent.spec.ts](../../tests/unit/composables/useCvContent.spec.ts) — 3 tests

Final tally: **43 unit tests / 6 integration tests**, all green.

## Commands run
```
npm run typecheck   # exit 0
npm run lint        # exit 0
npx vitest run --dir tests/unit         # 43 passed
npx vitest run --dir tests/integration  # 6 passed
```

## Issues encountered & resolution
- **Symptom**: `defineCollection` blew up with "It seems you are using Zod
  version 3 for collection schema, but Zod is not installed."
  **Diagnosis**: Importing `z` from `@nuxt/content` does not pull `zod` into
  the runtime — the package must be a direct dependency.
  **Fix**: `npm i -D zod yaml zod-to-json-schema` and import `z from 'zod'`
  directly. Schemas extracted to `shared/content-schemas.ts` so the same
  zod instance is used in tests.
- **Symptom**: `fileURLToPath(import.meta.url)` threw `ERR_INVALID_URL_SCHEME`
  inside the integration test under the `nuxt` env.
  **Diagnosis**: happy-dom does not expose a real `file://` URL on
  `import.meta.url`.
  **Fix**: use `process.cwd()` + `node:path` `resolve()`.
- **Symptom**: Vitest reported "Invalid or unexpected token" when loading
  `scripts/fetch-live-signal.mjs`.
  **Diagnosis**: Vite's transformer choked on the `#!/usr/bin/env node`
  shebang.
  **Fix**: removed the shebangs from both scripts. They are invoked via
  `node`/`npm run`, never executed directly.
- **Symptom**: `vi.stubGlobal('useAsyncData', …)` in the composable tests
  threw `[nuxt] instance unavailable`.
  **Diagnosis**: Nuxt resolves auto-imports via a build-time macro, so
  stubbing the global has no effect — the real composable still runs.
  **Fix**: switched to `mockNuxtImport` from `@nuxt/test-utils/runtime`
  with `// @vitest-environment nuxt` at the top of the spec file.
- **Symptom**: ESLint flagged 14 errors in legacy jQuery/Knockout files.
  **Diagnosis**: legacy artefact, never linted before.
  **Fix**: added `ignores: ['docs/legacy/**', '.output/**', '.nuxt/**',
  'dist/**']` to [eslint.config.mjs](../../eslint.config.mjs).

## Decisions made (link any new ADRs)
- [ADR-001 — Live signal fetched at build time](../decisions/ADR-001-live-signal-build-time.md) (accepted)

## State at end of session
- Spec checkboxes ticked: T1, T2, T3, T4, T5, T6, T7, T8, T9
- Spec checkboxes remaining: T10–T24 (components, pages, OG image, sitemap,
  CI, accessibility audit)
- Branch: `feature/SPEC-001-portfolio-revamp` (no remote yet)
- Last commit: `4b080b3 feat(composables): useCvContent, useLiveSignal, useMaltaClock (SPEC-001 T8)`
  (T9 checkpoint commit will follow this log)

## Hand-off notes (for the next agent)
- **Start with SPEC-001 T10** — base layout / typography page wrapper. The
  composables and content are ready: `useCvContent()` returns sorted
  experience and typed refs, `useLiveSignal()` returns a discriminated
  union (`isUnavailable` already computed), `useMaltaClock()` returns a
  `Ref<string>` formatted as `HH:mm <tz>`.
- **Content edits go in [content/cv.md](../../content/cv.md) only.** The
  `.vue` files must read copy via `useCvContent`, never hard-code.
- **Tailwind base styles live in [app/assets/css/tailwind.css](../../app/assets/css/tailwind.css).**
  Long-form copy should use `class="prose-portfolio"` rather than ad-hoc
  spacing rules.
- **`useLiveSignal` returns a discriminated union** — narrow on
  `'unavailable' in signal.value` (or use `isUnavailable.value`) before
  accessing `repo`/`sha`/`timestamp`.
- **Do NOT push to remote** until the user signs off the checkpoint.
- **Do NOT touch [docs/legacy/](../legacy/)** — frozen artefact.
- **No md-to-pdf, no Puppeteer, no CV download** in this iteration —
  the user has explicitly deferred that.
- **Watch the static-only constraint**: no `server/` directory, no runtime
  Node APIs. The live signal is committed JSON written by a prebuild hook.
- When you add Playwright e2e for new routes, remember Playwright tests
  must NOT live under `tests/unit` or `tests/integration` (vitest will
  try to run them).
