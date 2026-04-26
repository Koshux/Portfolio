---
id: SPEC-001
title: "Portfolio revamp â€” iteration 1 (single-page recruiter site)"
status: done
created: 2026-04-26
owner: "James Lanzon"
journeys: [JNY-001]
adrs: [ADR-001]
---

# SPEC-001 â€” Portfolio revamp, iteration 1

## Summary
Implement the recruiter-optimised, single-page portfolio described in
[JNY-001](../journeys/JNY-001-portfolio-revamp-iteration-1.md). The page
renders five content blocks in order â€” **hero**, **overview**, **experience
timeline**, **skills**, **contact / CTA** â€” from a single `@nuxt/content`
document sourced from [content/cv.md](../../content/cv.md). The site is
generated statically by Nuxt 4 (`nitro.preset = 'github-pages'`,
`static: true`) and deployed to GitHub Pages via the existing
`npm run generate` pipeline. The persistent header carries, in DOM order
left â†’ right, the brand/name, a **live-signal chip** (latest public commit
across James' GitHub repos + current Malta time), a **GitHub icon link**,
and an **email icon link**. Email (`lanzonprojects@gmail.com`) is the
primary CTA via `mailto:`; LinkedIn is a secondary footer link. The CV is
**not** downloadable in iteration 1 â€” the contact section shows a single
"CV available on request" line; [docs/cv/cv.md](../../docs/cv/cv.md) is
retained only as the editorial source for `content/cv.md` frontmatter.
The live-signal data is injected at **build time** by a pregenerate
script ([scripts/fetch-live-signal.mjs](../../scripts/fetch-live-signal.mjs))
with a graceful unavailable fallback so the build never fails because of
the chip. The page must work with JavaScript disabled, pass WCAG 2.2 AA
automated checks (including `prefers-reduced-motion` and heading
hierarchy), and be interactive in under 1.8 s on simulated 4G mobile.

## Acceptance criteria

The contract. Each is verifiable by an automated test or scripted manual
check (see Test plan).

- [ ] **AC-1** â€” Above the fold on a 360 Ã— 600 mobile viewport **and** a
      1280 Ã— 800 desktop viewport, the hero shows: James' name, his
      current title (from content), his current employer (European
      Commission), and the tagline. No scrolling required to reveal any
      of those four.
- [ ] **AC-2** â€” A primary email contact link
      (`mailto:lanzonprojects@gmail.com`) is reachable from any scroll
      position in â‰¤ 10 s of interaction. Implementation: a persistent
      header email icon CTA (icon-only with `aria-label="Email James"`
      and an `sr-only` text label, both mobile and desktop), plus a hero
      CTA, plus the contact section.
- [ ] **AC-3** â€” The persistent header includes, in DOM order
      left â†’ right: brand/name on the left; on the right a
      `LiveSignal` chip, then a GitHub icon link
      (`https://github.com/jameslanzon`), then an email icon link
      (`mailto:lanzonprojects@gmail.com`). All three are reachable from
      any scroll position on both mobile and desktop. The header is
      fixed to the top of the viewport during scroll (CSS
      `position: sticky; top: 0`) so the live-signal chip, GitHub icon,
      and email icon are reachable from any scroll position without
      re-scrolling.
- [ ] **AC-4** â€” Both icon links follow the icon-only-with-`aria-label`
      pattern: the GitHub link has `aria-label="James' GitHub profile"`
      and an `sr-only` text label; the email link has
      `aria-label="Email James"` and an `sr-only` text label; the SVG
      icon inside each link has `aria-hidden="true"` and
      `focusable="false"`. External links (GitHub) carry
      `rel="noopener noreferrer"` and `target="_blank"`.
- [ ] **AC-5** â€” The full experience history (every role in
      `content/cv.md` under `experience`) renders as a single timeline on
      `/`, sorted reverse-chronologically **at render time** by `start`
      (ISO string compare; year-only `start` values are normalised to
      `${year}-01` for sorting). No modals, no accordions collapsed by
      default, no links to other routes.
- [ ] **AC-6** â€” The contact section shows the email CTA **and** a
      single plain-text line "CV available on request" â€” no link, no
      `mailto:` for the CV, no download buttons, no reference to
      `public/cv/`.
- [ ] **AC-7** â€” At build time, `scripts/fetch-live-signal.mjs` runs
      (via the `prebuild` and `pregenerate` npm hooks) and writes
      `content/live-signal.json` matching the `liveSignal` schema in
      Â§Data shapes. The script writes a fallback object
      (`{ unavailable: true, fetchedAt: <ISO> }`) and exits `0` on any
      non-200 response, rate-limit (HTTP 403 with
      `X-RateLimit-Remaining: 0`), network error, or malformed payload.
      The build never fails because of this script. The script honours
      `SKIP_LIVE_SIGNAL_FETCH=1`: when that env var is set the script
      exits `0` immediately without reading or writing
      `content/live-signal.json`, allowing tests to pre-seed a fixture.
- [ ] **AC-8** â€” The header live-signal chip renders into the static
      HTML for `/` with **either** (a) the most recent commit's repo
      name, a relative timestamp (e.g. "3 days ago"), and the Malta
      time fallback label, **or** (b) the unavailable fallback string
      "GitHub Â· recent activity" plus the Malta time fallback label
      when `unavailable === true`. Verified by an integration test
      against the generated HTML.
- [ ] **AC-9** â€” When JavaScript is enabled, the Malta time portion of
      the live-signal chip updates every second (driven by the
      `useMaltaClock` composable, `setInterval(1000)`); when JavaScript
      is disabled, the SSR-rendered "Malta Â· CEST" (or current short
      offset) label remains visible and is the only Malta time shown.
      The Malta clock interval is disposed via `onScopeDispose`.
- [ ] **AC-10** â€” The live-signal chip is purely informational. It is
      wrapped with `role="status"` and `aria-live="polite"` so screen
      readers announce JS-side updates politely. It is not a link and
      is not in the focus order.
- [ ] **AC-11** â€” When `live-signal.json.unavailable === true`, the
      chip MUST NOT render any commit date, repo name, or hard-coded
      placeholder date. It shows only the fallback string plus the
      Malta time portion.
- [ ] **AC-12** â€” The home route, served from the generated static
      output, reaches Lighthouse **Time to Interactive < 1800 ms** under
      the `mobile` configuration with throttling preset `Slow 4G`,
      measured by `playwright-lighthouse` inside the existing e2e suite.
- [ ] **AC-13** â€” `/` passes `axe-core` automated accessibility checks
      at WCAG 2.2 AA level with **zero violations** of `serious` or
      `critical` severity, including the `bypass`,
      `landmark-one-main`, `region`, and `heading-order` rules.
      `moderate` violations must each have a recorded justification in
      `tests/e2e/JNY-001-recruiter-scan.spec.ts`.
- [ ] **AC-14** â€” With JavaScript disabled in the browser, the
      generated `index.html` for `/` renders the hero, overview,
      experience timeline, skills, and contact sections, **and** the
      live-signal chip is present with its SSR fallback content (per
      AC-8 / AC-9). All `mailto:` links remain functional. No section
      depends on client-side hydration to become visible or readable.
- [ ] **AC-15** â€” Every content element present at desktop â‰¥ 1280 px is
      also present at mobile 360 px (no `hidden md:block` or
      `md:hidden` rules that hide content; layout-only hiding such as a
      decorative svg is allowed and must be marked `aria-hidden="true"`).
      Verified by asserting the same accessible-name set is reachable at
      both viewports: the hero `<h1>` containing "James Lanzon"; section
      headings `<h2>` named "Experience", "Skills", and "Contact";
      header links named "Email James" and "James' GitHub profile"; and
      a `role="status"` element (the live-signal chip). Tests use
      `getByRole` / `getByLabel`.
- [ ] **AC-16** â€” The string `lanzonprojects@gmail.com` is the **only**
      personal email address rendered anywhere in the generated HTML for
      `/`. The legacy `jameslanzon@gmail.com` does not appear in the
      rendered site.
- [ ] **AC-17** â€” The contact section / footer includes a labelled
      secondary link to LinkedIn (GitHub now lives in the header per
      AC-3 â€” it is **not** duplicated in the contact section).
- [ ] **AC-18** â€” No `<img>`, `<NuxtImg>`, `<NuxtPicture>`, or
      `background-image` referencing a portrait of James appears in the
      hero or above the experience section.
- [ ] **AC-19** â€” All visible copy (hero headline, overview prose, role
      titles, role bullets, skills list, contact line, "CV available on
      request" line) is sourced from a `@nuxt/content` query against
      `content/cv.md`. Components contain no hard-coded copy beyond
      ARIA labels, the live-signal fallback string, and structural
      punctuation.
- [ ] **AC-20** â€” All Tailwind transition/animation utilities are
      written behind the `motion-safe:` modifier (or otherwise no-op)
      when `prefers-reduced-motion: reduce` is set. Verified by an e2e
      test that emulates `Reduce motion` and asserts no transitions or
      animations fire (computed `transition-duration` /
      `animation-duration` is `0s` on the relevant elements). The Malta
      clock interval still ticks under reduced motion (it is data, not
      animation).
- [ ] **AC-21** â€” The default layout exposes a visible-on-focus "Skip to
      content" link as the **first** focusable element, plus
      `<header>`, `<nav>` (when applicable), `<main id="main">`, and
      `<footer>` landmarks. Asserted by axe (`bypass`,
      `landmark-one-main`, `region`) and by a Playwright keyboard test:
      Tab once â†’ skip link visible; Enter â†’ focus on `#main`. The
      `<main>` element has `tabindex="-1"` so the skip link can move
      focus to it programmatically; after Tab â†’ Enter on the skip link,
      `document.activeElement` is the `<main>` element.
- [ ] **AC-22** â€” The generated HTML for `/` contains the following
      meta tags via `useSeoMeta`: `og:title`, `og:description`,
      `og:image`, `og:url`, `twitter:card="summary_large_image"`,
      `twitter:image`. The `og:image` resolves to the absolute URL
      `https://jameslanzon.com/og/og-image.png` (1200 Ã— 630), which
      exists as a committed static asset in `public/og/`.
- [ ] **AC-23** â€” A favicon set is present in `public/`
      (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png` (180 Ã— 180),
      `favicon-32.png`, `favicon-16.png`, `site.webmanifest`) and
      referenced from `nuxt.config.ts > app.head.link`. The generated
      HTML contains the corresponding `<link rel="icon">`,
      `<link rel="apple-touch-icon">`, and `<link rel="manifest">`
      tags.
- [ ] **AC-24** â€” The generated HTML root element has `lang="en"`.
- [ ] **AC-25** â€” Heading hierarchy is exactly: `H1` = James' name in
      Hero; `H2` = each section heading ("Experience", "Skills",
      "Contact"); `H3` = role title in `Timeline/Role.vue`; `H3` = each
      skill group label in `Section/Skills.vue`. No heading levels are
      skipped. Asserted by the axe `heading-order` rule and by a unit
      assertion on the rendered DOM.
- [ ] **AC-26** â€” The generated artefact contains
      `.output/public/CNAME` whose contents equal `jameslanzon.com`
      (with optional trailing newline) so GitHub Pages serves the
      apex domain.

## Non-goals
- Blog, projects/case studies, testimonials, dark-mode toggle,
  analytics, cookie banner, contact form, command palette / motion
  toggle UI, animations beyond Tailwind transition utilities, i18n.
- A CMS or authoring UI for the CV â€” `content/cv.md` is edited by hand,
  using `docs/cv/cv.md` as the editorial source.
- Re-styling or extending the legacy site. The legacy `website/`
  directory and root `index.html` are removed/relocated as cleanup
  (see T2); they are never extended.
- **Any downloadable CV.** No PDF, no Markdown download, no
  `public/cv/` directory, no `cv:build` script, no `?v=` cache-busting
  for CV files. The contact section shows "CV available on request"
  only.
- Server-side anything (no `server/` directory, no event handlers).
- Visitor-runtime calls to the GitHub API. The live-signal is resolved
  at build time and baked into the static HTML; the only client-side
  code that runs is the Malta clock `setInterval`.

## Design

### Affected areas

| Path | Change |
|---|---|
| `app/app.vue` | Replace `<NuxtWelcome />` with `<NuxtLayout><NuxtPage /></NuxtLayout>`. |
| `app/layouts/default.vue` | **New.** Page chrome: skip-link (first focusable), a sticky `<header class="sticky top-0 z-40 ...">` with an opaque/blur background and a bottom border for separation against scrolled content; the header contains brand/name on the left and (left â†’ right) `LiveSignal` + GitHub `IconLink` + email `IconLink` on the right; `<main id="main" tabindex="-1">` slot (the `tabindex="-1"` lets the skip link move focus there programmatically); `<footer>` with secondary LinkedIn link + copyright. |
| `app/pages/index.vue` | **New.** Home page. Queries `content/cv.md` via `useAsyncData` + `queryCollection('cv').first()`; renders the five sections; calls `useSeoMeta` (incl. OG/Twitter). |
| `app/components/Section/Hero.vue` | **New.** Renders `H1` name, current title, current employer, tagline, hero CTA â†’ `#contact`. The hero CTA carries `data-testid="hero-cta"` so the reduced-motion e2e test (AC-20) can pin its assertion to a stable element. |
| `app/components/Section/Overview.vue` | **New.** Renders the prose `overview` block as plain paragraphs. |
| `app/components/Section/Experience.vue` | **New.** Renders the `experience[]` array as a semantic `<ol>` reverse-chronological timeline. Sorts at render time (see `app/utils/sortRoles.ts`). |
| `app/components/Section/Skills.vue` | **New.** Renders `skills[]` as a grouped list with `H3` per group. |
| `app/components/Section/Contact.vue` | **New.** Renders the email CTA, the plain-text line "CV available on request" (no link, no `mailto:` for the CV, no download buttons), and a secondary LinkedIn link. |
| `app/components/Timeline/Role.vue` | **New.** Single role card with `H3` title, organisation, dates, bullets. |
| `app/components/Ui/IconLink.vue` | **New.** Generic icon-only link. Props: `href: string`, `ariaLabel: string`, `srLabel: string`, `external?: boolean`. Renders `<a>` with `aria-label`, an icon slot marked `aria-hidden="true"` / `focusable="false"`, and an `sr-only` text label. When `external`, emits `target="_blank" rel="noopener noreferrer"`. Reused by the header for GitHub and email. |
| `app/components/Ui/LiveSignal.vue` | **New.** Renders the live-signal chip wrapped in `<div role="status" aria-live="polite">`. Pulls commit data via `useLiveSignal()` and Malta time via `useMaltaClock()`. SSR fallback: when `unavailable === true`, renders the string "GitHub Â· recent activity"; otherwise renders `${repo} Â· ${relativeTime(timestamp)}` (the commit message is **not** rendered â€” see schema). The Malta time portion uses `<ClientOnly fallback="Malta Â· CEST">` (the fallback string is computed at SSG time via `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Malta', timeZoneName: 'short' })` and at SSG time the fallback may resolve to either `"Malta Â· CET"` or `"Malta Â· CEST"` depending on DST; tests assert the regex `/Malta Â· CES?T/`). Not a link, not in focus order. |
| `app/components/Ui/SkipLink.vue` | **New.** First focusable element in the layout; targets `#main`. Visible only on focus. |
| `app/composables/useCvContent.ts` | **New.** Wraps `useAsyncData` + `queryCollection('cv').first()`; returns typed refs. |
| `app/composables/useLiveSignal.ts` | **New.** Wraps `queryCollection('liveSignal').first()`; returns a typed `Ref<LiveSignal>` (the discriminated union from the schema below). Pure data composable â€” no fetch. |
| `app/composables/useMaltaClock.ts` | **New.** Returns `Ref<string>` of current `Europe/Malta` time formatted via `Intl.DateTimeFormat`. Registers a `setInterval(1000)` and disposes it via `onScopeDispose`. SSR-safe: on the server it returns the current value once and registers no interval. |
| `app/utils/sortRoles.ts` | **New.** Pure helper: normalises `start` (year-only â†’ `${year}-01`) and returns `Role[]` sorted reverse-chronologically. Independently unit-tested. |
| `app/utils/relativeTime.ts` | **New.** Pure helper: `(iso: string, now?: Date) => string` returning English relative time ("3 days ago", "just now"). Used by `LiveSignal.vue`. Unit-tested. |
| `app/assets/css/tailwind.css` | **New.** `@tailwind` directives + a `prose` override layer for the timeline. |
| `tailwind.config.js` | Update `content` globs to include `app/**/*.{vue,ts}`; add brand colour token; set `theme.fontFamily.sans` to the `@nuxt/fonts`-managed font (e.g. `Inter`). |
| `nuxt.config.ts` | Register `app/assets/css/tailwind.css`; verify `app.htmlAttrs.lang = 'en'` (already set); add `app.head.link` entries for the favicon set; verify `@nuxt/fonts` is in `modules` (already set). |
| `content.config.ts` | Add a `cv` collection (`type: 'page'`) with the schema in Â§Data shapes; add a `liveSignal` data collection (`type: 'data'`, `source: 'live-signal.json'`, discriminated-union schema); keep existing `content` collection. |
| `content/cv.md` | **New.** Single document with structured frontmatter (see Â§Data shapes), including `updated` ISO date, hero tagline, and `og` block. **No `cv:` block.** Body is empty â€” components read frontmatter only. Editorial source remains [docs/cv/cv.md](../../docs/cv/cv.md). |
| `content/live-signal.json` | **New, committed and tracked** with the placeholder `{ "unavailable": true, "fetchedAt": "1970-01-01T00:00:00Z" }`. `nuxt prepare` is satisfied by this committed placeholder â€” it parses as the `unavailable` branch of the discriminated union. The file is overwritten on every `npm run build` / `npm run generate` by the prebuild/pregenerate hook (locally and in CI) but **must never be committed back**. Local clones run `git update-index --skip-worktree content/live-signal.json` (one-shot, applied by `scripts/setup-dev.mjs`) so post-build modifications never appear in `git status`. CI runs ephemeral checkouts so this is a no-op there. |
| `scripts/fetch-live-signal.mjs` | **New, Node 20 ESM.** Honours `process.env.SKIP_LIVE_SIGNAL_FETCH`: when set to `1` the script exits `0` immediately without reading or writing `content/live-signal.json` (used by integration tests that pre-seed the JSON). Otherwise fetches `https://api.github.com/users/jameslanzon/events/public?per_page=30`, picks the most recent `PushEvent`, extracts `{ repo, sha (short, 7 chars), timestamp (ISO), fetchedAt (ISO) }` (the commit message is **not** captured â€” the chip never renders it, so omitting it shrinks the attack surface), validates against the schema, writes `content/live-signal.json`. On any failure (non-200, HTTP 403 + `X-RateLimit-Remaining: 0`, network error, `JSON.parse` failure, no `PushEvent` in the page) writes `{ unavailable: true, fetchedAt: <ISO> }` and exits `0`. Honours `process.env.GITHUB_TOKEN` if set (sends `Authorization: Bearer â€¦` to lift the 60/h unauthenticated rate limit). Uses global `fetch` (Node 20+). Logs a single line to stdout describing the outcome (`fetched <repo>@<sha>`, `skipped (SKIP_LIVE_SIGNAL_FETCH=1)`, or `unavailable: <reason>`). |
| `scripts/setup-dev.mjs` | **New, Node 20 ESM.** One-shot helper for fresh clones: runs `git update-index --skip-worktree content/live-signal.json` so locally-regenerated live-signal output never appears in `git status`. Idempotent. Documented in [README.md](../../README.md). |
| `public/og/og-image.png` | **New, committed.** 1200 Ã— 630 social card. If owner-supplied artwork is unavailable at implementation time, the implementer creates a temporary SVG-rendered-to-PNG carrying the tagline. |
| `public/favicon.ico` / `favicon.svg` / `favicon-16.png` / `favicon-32.png` / `apple-touch-icon.png` / `site.webmanifest` | **New, committed.** Full favicon set. |
| `public/CNAME` | **New, committed** (moved from repo root). Contains `jameslanzon.com`. The repo-root `CNAME` is removed once `public/CNAME` is in place. |
| `public/.nojekyll` | **New.** Zero-byte file. **Justification:** GitHub Pages runs Jekyll by default and strips files starting with `_` or `.`. While `app.buildAssetsDir = 'assets'` covers Nuxt's own outputs, future modules (`@nuxt/content` payloads, `@nuxt/image` IPX, etc.) may emit `_`-prefixed files. `.nojekyll` is a 0-byte safety net. |
| `package.json` | Add devDeps: `@axe-core/playwright`, `playwright-lighthouse`. Add scripts `"prebuild": "node scripts/fetch-live-signal.mjs"` and `"pregenerate": "node scripts/fetch-live-signal.mjs"`. **No** `cv:build` script. |
| `tailwind.config.js` (file form) | With `package.json "type": "module"`, the config must use `export default` (not `module.exports`) so Node loads it as ESM. The file extension stays `.js`; no rename to `.cjs`. Consistent with the ESM-everywhere stance. |
| `.gitignore` | _No change._ `content/live-signal.json` is **tracked**; local skip-worktree (see `scripts/setup-dev.mjs`) prevents post-build modifications from appearing in `git status`. |
| `README.md` | Document the live-signal pregenerate hook and the optional `GITHUB_TOKEN` env var. Note that `docs/cv/cv.md` is the editorial source for `content/cv.md` frontmatter (no download tooling). |
| `docs/decisions/ADR-001-live-signal-build-time.md` | **New.** ADR authored from `docs/decisions/_TEMPLATE.md` capturing the build-time-injection decision. |
| `tests/unit/utils/sortRoles.spec.ts` | **New.** Pure-function tests for the role sort, including year-only normalisation. |
| `tests/unit/utils/relativeTime.spec.ts` | **New.** Pure-function tests for fixed `now` values. |
| `tests/unit/composables/useCvContent.spec.ts` | **New.** |
| `tests/unit/composables/useLiveSignal.spec.ts` | **New.** Renders both schema branches; asserts the discriminated union narrows correctly. |
| `tests/unit/composables/useMaltaClock.spec.ts` | **New.** Vitest fake timers; assert the ref updates each second; assert the interval is cleared on scope dispose. |
| `tests/unit/scripts/fetch-live-signal.spec.ts` | **New.** Mocks `globalThis.fetch`. Asserts the script writes the success-shape JSON given a representative `events/public` payload, and the fallback object given (a) HTTP 403 + `X-RateLimit-Remaining: 0`, (b) network error (rejected promise), (c) HTTP 200 with malformed JSON, (d) HTTP 200 with no `PushEvent`. Asserts the script always exits `0`. |
| `tests/unit/components/Section/Hero.spec.ts` | **New.** |
| `tests/unit/components/Section/Experience.spec.ts` | **New.** |
| `tests/unit/components/Section/Skills.spec.ts` | **New.** Heading levels (`H2` + `H3` per group), taxonomy. |
| `tests/unit/components/Section/Contact.spec.ts` | **New.** Email CTA renders; the literal "CV available on request" text appears as plain text (not inside an `<a>`); LinkedIn secondary link present; **no** download anchors, **no** `?v=` query string. |
| `tests/unit/components/Timeline/Role.spec.ts` | **New.** |
| `tests/unit/components/Ui/IconLink.spec.ts` | **New.** Asserts `aria-label`, `sr-only` label text, icon `aria-hidden="true"` and `focusable="false"`, and that `external` adds `target="_blank" rel="noopener noreferrer"`. |
| `tests/unit/components/Ui/LiveSignal.spec.ts` | **New.** Renders both states (commit-data and `unavailable: true`); asserts `role="status"` + `aria-live="polite"`; asserts that with `unavailable: true` no commit date or repo name appears (AC-11); asserts SSR-only render path produces the static Malta fallback string. |
| `tests/unit/components/Ui/SkipLink.spec.ts` | **New.** |
| `tests/integration/pages/head.spec.ts` | **New.** OG/Twitter meta tags, favicon `<link>` set, `<link rel="manifest">`, `<html lang="en">`, document title. |
| `tests/integration/pages/landmarks.spec.ts` | **New.** Skip link is first focusable; `<header>`, `<main id="main" tabindex="-1">`, `<footer>` landmarks present; heading order `H1 â†’ H2 â†’ H3` with no level skipped; sticky header position (`getComputedStyle(headerEl).position === 'sticky'`); header DOM order is brand â†’ LiveSignal â†’ GitHub IconLink â†’ email IconLink. |
| `tests/integration/pages/content.spec.ts` | **New.** Generated HTML contains every role title from the fixture in correct order; `lanzonprojects@gmail.com` appears and `jameslanzon@gmail.com` does not; the live-signal `role="status"` element is present. |
| `tests/integration/pages/cname.spec.ts` | **New.** After `nuxt generate`, `.output/public/CNAME` exists with the contents `jameslanzon.com`. |
| `tests/integration/content/cv-schema.spec.ts` | **New.** Validates `content/cv.md` against the Zod schema. |
| `tests/integration/live-signal.spec.ts` | **New.** Uses `@nuxt/test-utils` `setup()` (which does **not** invoke npm lifecycle hooks). The test writes a fixture JSON to `content/live-signal.json` before mount and runs the build with `SKIP_LIVE_SIGNAL_FETCH=1` so the prebuild/pregenerate hook is a no-op and the seeded fixture is not overwritten. Asserts the chip text appears in the static `index.html`. Runs both branches (commit data + unavailable). |
| `tests/e2e/JNY-001-recruiter-scan.spec.ts` | **New.** Full journey across mobile (360 Ã— 600) + desktop (1280 Ã— 800) projects: hero above fold; header GitHub icon resolves to a 200 from `https://github.com/jameslanzon`; email icon `href` starts with `mailto:`; live-signal chip visible above the fold from any scroll position; axe scan; skip-link keyboard test; Lighthouse TTI; reduced-motion emulation. |
| `tests/e2e/no-js.spec.ts` | **New.** Dedicated JS-disabled spec covering AC-14 (five sections + live-signal SSR fallback present). |
| `playwright.config.ts` | Set `webServer.command = 'npm run generate && npm run preview'` so a fresh-clone `npm run test:e2e` produces `.output/public` and serves it from a single source of truth (Playwright handles startup); add a `mobile` project at 360 Ã— 600 and a `desktop` project at 1280 Ã— 800. |

### Data shapes

#### `content.config.ts` â€” new `cv` and `liveSignal` collections

```ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const role = z.object({
  title: z.string(),
  organisation: z.string(),
  start: z.string().regex(/^\d{4}(-\d{2})?$/), // 'YYYY' or 'YYYY-MM'
  end: z.string().regex(/^\d{4}(-\d{2})?$/).nullable(), // null === present
  current: z.boolean().default(false),
  bullets: z.array(z.string()).min(1),
})

const skillGroup = z.object({
  label: z.string(),
  items: z.array(z.string()).min(1),
})

const socialLink = z.object({
  label: z.string(),
  href: z.string().url(),
})

export default defineContentConfig({
  collections: {
    content: /* unchanged */,
    cv: defineCollection({
      type: 'page',
      source: 'cv.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        hero: z.object({
          name: z.string(),
          title: z.string(),
          employer: z.string(),
          tagline: z.string().max(200),
        }),
        overview: z.string(),
        experience: z.array(role).min(1),
        skills: z.array(skillGroup).min(1),
        contact: z.object({
          email: z.string().email(),
          location: z.string(),
          social: z.array(socialLink).default([]),
        }),
        og: z.object({
          image: z.string().url().default('https://jameslanzon.com/og/og-image.png'),
          url: z.string().url(),
        }),
      }),
    }),
    liveSignal: defineCollection({
      type: 'data',
      source: 'live-signal.json',
      schema: z.union([
        z.object({
          unavailable: z.literal(true),
          fetchedAt: z.string().datetime(),
        }),
        z.object({
          repo: z.string(),
          sha: z.string(),
          timestamp: z.string().datetime(),
          fetchedAt: z.string().datetime(),
        }),
      ]),
    }),
  },
})
```

#### `content/cv.md` (frontmatter sketch)

```yaml
---
title: "James Lanzon â€” UX Architect"
description: "UX Architect & Accessibility Expert at the European Commission. Senior full-stack engineer based in Malta."
updated: "2026-04-26"
hero:
  name: "James Lanzon"
  title: "UX Architect & Accessibility Expert"
  employer: "European Commission"
  tagline: "Architecting accessible, scalable systems â€” from fintech to the European Commission. JavaScript, UX, DX, standardisation."
overview: |
  James Lanzon is a UX Architect & Accessibility Expert with experience across
  Fintech, Energy, and the EU public sector â€¦
experience:
  - title: "Application / Cloud Architect"
    organisation: "European Commission (DG-EAC)"
    start: "2025-01"
    end: null
    current: true
    bullets:
      - "Simplify and unblock the Erasmus+ / European Solidarity Corps journey."
      - "Work with devs, management, business and National Agencies across Europe."
  - title: "Senior Full-Stack Developer"
    organisation: "NGP / ClearVue"
    start: "2023-01"
    end: "2025-01"
    bullets: [...]
  # â€¦all roles from docs/cv/cv.md (sort is also enforced at render time)
skills:
  - label: "Engineering"
    items: ["TypeScript", "Vue 3 / Nuxt 4", "Node.js / AdonisJS", "PostgreSQL", "Redis"]
  - label: "Architecture"
    items: ["Multi-tenant SaaS", "SSO", "System design", "DX & standardisation"]
  - label: "UX & Accessibility"
    items: ["WCAG 2.2 AA", "UX architecture", "Design systems"]
  - label: "Quality"
    items: ["Test architecture", "CI/CD", "Performance budgets"]
  - label: "Leadership"
    items: ["Technical coordination", "Mentorship", "Cross-team facilitation"]
contact:
  email: "lanzonprojects@gmail.com"
  location: "Malta"
  social:
    - label: "LinkedIn"
      href: "https://www.linkedin.com/in/jameslanzon"
og:
  image: "https://jameslanzon.com/og/og-image.png"
  url: "https://jameslanzon.com/"
```

(The body of the file is intentionally empty; everything is frontmatter so
components can render typed fields without `<ContentRenderer>`. There is
**no** `cv:` block â€” the CV is not downloadable in iteration 1.)

#### `content/live-signal.json` (committed placeholder)

```json
{ "unavailable": true, "fetchedAt": "1970-01-01T00:00:00Z" }
```

Committed and tracked. `nuxt prepare` is satisfied by this placeholder (it
parses as the `unavailable` branch of the discriminated union). Overwritten
on every `npm run build` / `npm run generate` by
`scripts/fetch-live-signal.mjs`, both locally and in CI. Local clones run
`scripts/setup-dev.mjs` once â€” it applies
`git update-index --skip-worktree content/live-signal.json` so post-build
changes never appear in `git status` and never get committed back.

#### `public/site.webmanifest`

```json
{
  "name": "James Lanzon",
  "short_name": "James Lanzon",
  "icons": [
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0b1020",
  "background_color": "#ffffff",
  "display": "minimal-ui",
  "start_url": "/"
}
```

#### `app/composables/useCvContent.ts` return type

```ts
interface UseCvContent {
  hero: ComputedRef<{ name: string; title: string; employer: string; tagline: string }>
  overview: ComputedRef<string>
  experience: ComputedRef<Role[]>          // pre-sorted reverse-chronologically
  skills: ComputedRef<SkillGroup[]>
  contact: ComputedRef<Contact>
  updated: ComputedRef<string>
  og: ComputedRef<{ image: string; url: string }>
  pending: Ref<boolean>
  error: Ref<Error | null>
}
```

#### `app/composables/useLiveSignal.ts` return type

```ts
type LiveSignal =
  | { unavailable: true; fetchedAt: string }
  | { repo: string; sha: string; timestamp: string; fetchedAt: string }

interface UseLiveSignal {
  signal: ComputedRef<LiveSignal>
  isUnavailable: ComputedRef<boolean>
}
```

#### `app/composables/useMaltaClock.ts` return type

```ts
// Returns a ref of the current Malta time, formatted as e.g. "14:32 CEST".
// Server: returns the SSG-time value once, registers no interval.
// Client: re-renders every 1000 ms; interval cleared on scope dispose.
function useMaltaClock(): Ref<string>
```

### Routing / pages

- `/` â€” `app/pages/index.vue` (the only route in iteration 1).
- No dynamic routes. No catch-all.
- 404: existing `package.json` post-`generate` step copies
  `index.html` â†’ `404.html`. Unchanged.

### Component tree

```
app.vue
â””â”€â”€ layouts/default.vue
    â”œâ”€â”€ Ui/SkipLink           (first focusable; targets #main)
    â”œâ”€â”€ <header>
    â”‚   â”œâ”€â”€ (brand/name link, left)
    â”‚   â””â”€â”€ (right cluster, in DOM order)
    â”‚       â”œâ”€â”€ Ui/LiveSignal             (role="status" aria-live="polite")
    â”‚       â”œâ”€â”€ Ui/IconLink (GitHub)      (external)
    â”‚       â””â”€â”€ Ui/IconLink (email)
    â”œâ”€â”€ <main id="main">
    â”‚   â””â”€â”€ pages/index.vue
    â”‚       â”œâ”€â”€ Section/Hero
    â”‚       â”œâ”€â”€ Section/Overview
    â”‚       â”œâ”€â”€ Section/Experience
    â”‚       â”‚   â””â”€â”€ Timeline/Role  (Ã—N)
    â”‚       â”œâ”€â”€ Section/Skills
    â”‚       â””â”€â”€ Section/Contact
    â”‚           â”œâ”€â”€ Ui/IconLink (email)   (same component as the header)
    â”‚           â”œâ”€â”€ "CV available on request" (plain text, not a link)
    â”‚           â””â”€â”€ (LinkedIn secondary link)
    â””â”€â”€ <footer>              (copyright + LinkedIn secondary link)
```

### State / composables

- `useCvContent()` â€” single source of truth for the CV page. Wraps
  `useAsyncData('cv', () => queryCollection('cv').first())` so the data
  is serialised into the static build and hydrated on the client. Sorts
  `experience` via `app/utils/sortRoles.ts` before exposing it.
- `useLiveSignal()` â€” wraps `queryCollection('liveSignal').first()`.
  Pure data composable; no fetch at runtime.
- `useMaltaClock()` â€” returns `Ref<string>` of formatted current
  `Europe/Malta` time. SSR returns the value once; CSR registers a
  `setInterval(1000)` and disposes via `onScopeDispose`.
- No client-only state. No `useState`. No `localStorage`. No `window`
  access outside `useMaltaClock` (which is gated by `import.meta.client`).

### Build pipeline

- `npm run generate` is **unchanged** in shape from the current
  [package.json](../../package.json) script (`nuxt generate` followed
  by the `index.html` â†’ `404.html` copy), but is now preceded by the
  new `pregenerate` hook which runs
  `node scripts/fetch-live-signal.mjs`. The matching `prebuild` hook
  covers `npm run build`. Both hooks are safe in CI: the script never
  fails the build (it writes a fallback object and exits `0` on any
  failure mode).
- `nuxt prepare` (run automatically by `postinstall`) is satisfied by
  the committed placeholder `content/live-signal.json` â€” it parses as
  the `unavailable` branch of the discriminated union, so type
  generation succeeds on a fresh clone before any build hook has run.
- Local clones run `node scripts/setup-dev.mjs` once after
  `npm install`. It applies
  `git update-index --skip-worktree content/live-signal.json` so
  prebuild/pregenerate writes don't appear in `git status` and never
  get committed back. CI checkouts are ephemeral so this is a no-op
  there.
- `scripts/fetch-live-signal.mjs` honours `process.env.GITHUB_TOKEN`
  if set (sends `Authorization: Bearer â€¦`) to lift the 60/h
  unauthenticated GitHub API rate limit. CI may set this as a secret;
  local builds typically run unauthenticated and rely on the fallback
  if rate-limited.
- The script also honours `process.env.SKIP_LIVE_SIGNAL_FETCH`: when
  set to `1` the script exits `0` immediately without touching
  `content/live-signal.json`. This lets integration tests pre-seed a
  fixture and prevent the prebuild/pregenerate hook from overwriting
  it (see T19, AC-7).
- `playwright.config.ts > webServer.command` is
  `'npm run generate && npm run preview'`. Playwright is the single
  source of truth for the e2e server lifecycle: a fresh-clone
  `npm run test:e2e` produces `.output/public` and serves it. (See
  T18, T23.)
- The `playwright-lighthouse`-based AC-12 check runs against the same
  preview server inside the existing Playwright project. Single
  runner, single report, mobile + Slow 4G preset. Budget: **1800 ms**
  TTI to leave CI headroom under AC-12's hard "< 2 s" contract â€” CI
  variance is significant; budgeting 1800 ms vs the 2000 ms journey
  threshold gives ~10â€¯% headroom.

### Fonts

`@nuxt/fonts` is already registered in
[nuxt.config.ts](../../nuxt.config.ts) `modules`. T3 wires the active
family into `tailwind.config.js > theme.fontFamily.sans` (e.g. `Inter`)
as the proof-of-wiring. **Justification:** `@nuxt/fonts` auto-self-hosts
Google fonts at build, applies `font-display: swap`, and preloads the
active weights â€” all required to hit AC-12 without external font
requests.

## Edge cases

- **JS disabled** (AC-14). All content is server-rendered via
  `useAsyncData` during `nuxt generate`, so the static HTML contains
  the full DOM, including the live-signal chip with its SSR fallback
  Malta time string. No section may use `<ClientOnly>` for visibility;
  `<ClientOnly fallback="â€¦">` is permitted only inside `LiveSignal.vue`
  for the Malta clock progressive enhancement, and the fallback string
  satisfies AC-9.
- **Reduced motion** (AC-20). All Tailwind transition/animation classes
  are written with `motion-safe:`. A Playwright project emulates
  `Reduce motion` and asserts no transitions/animations fire. The
  Malta-clock interval is data-driven and continues to tick (it is not
  a CSS animation). The sticky header (AC-3) uses
  `position: sticky; top: 0` with no transition or animation, so it is
  unaffected by `prefers-reduced-motion: reduce`.
- **Missing `mailto:` on mobile.** Some mobile browsers without a
  default mail client show no UI for `mailto:`. Mitigation: render the
  email address as visible text adjacent to the link in the contact
  section, so a user without a mail handler can copy it. The header
  email icon stays icon-only.
- **Very long role descriptions.** `Timeline/Role.vue` must not
  truncate, collapse, or `line-clamp` bullets; CSS uses
  `overflow-wrap: anywhere` and the role card grows to fit. Asserted
  by mounting with a 500-char bullet.
- **Slow 4G LCP** (AC-12). No hero image (AC-18); fonts via
  `@nuxt/fonts` with `display: swap`; Tailwind purged in production;
  no third-party scripts; the OG image is a static asset never
  preloaded from `/`; the live-signal chip ships zero JS beyond the
  Malta clock setInterval.
- **Year-only `start` values.** Naive lexicographic compare is wrong
  because `'2025'` < `'2025-06'`. `sortRoles.ts` normalises year-only
  values to `${year}-01` so a role starting `'2025'` sorts as January
  2025 â€” earlier than a role starting `'2025-06'`. Covered by
  `tests/unit/utils/sortRoles.spec.ts`.
- **GitHub API failure modes** (AC-7, AC-11). The fetch script handles
  five cases: HTTP 200 with valid PushEvent (success), HTTP 200 with
  no PushEvent in the page (fallback), HTTP 200 with malformed JSON
  (fallback), HTTP 403 + `X-RateLimit-Remaining: 0` (fallback,
  rate-limited), and rejected fetch promise / non-200 (fallback).
  Every fallback writes `{ unavailable: true, fetchedAt: <ISO> }` and
  exits `0`. The chip never renders a stale or hard-coded date.
- **Live-signal staleness.** The chip is bounded by deploy cadence â€”
  if James does not redeploy, the commit timestamp ages. Acceptable
  for iteration 1; the relative-time helper makes "3 weeks ago"
  legible. A future iteration may add a scheduled GitHub Action to
  refresh between deploys (see Next iteration candidates).
- **Live-signal JSON in a fresh checkout.** `content/live-signal.json`
  is committed and tracked with the placeholder, so `@nuxt/content`
  always has a typed file to load. Local clones apply skip-worktree
  via `scripts/setup-dev.mjs` so post-build writes don't appear in
  `git status`. Verified by an integration test that runs
  `nuxt generate` in a clean working tree.
- **Cache-busting.** Removed in this iteration â€” there are no CV
  download URLs to invalidate. The `updated` field in `content/cv.md`
  is retained for future use and for editorial bookkeeping.
- **Asset paths starting with `_`.** Reaffirmed: `app.buildAssetsDir =
  'assets'` is unchanged. `.nojekyll` is added as belt-and-braces.
- **Content schema drift.** If `content/cv.md` or
  `content/live-signal.json` violates the schema, `@nuxt/content`
  build fails fast â€” surfaced by
  `tests/integration/content/cv-schema.spec.ts` and
  `tests/integration/live-signal.spec.ts`.

## Test plan

One row per acceptance criterion (multiple rows allowed). Layers per
[testing instructions](../../.github/instructions/testing.instructions.md).

| Layer | Test | Covers AC |
|---|---|---|
| component | `tests/unit/components/Section/Hero.spec.ts` â€” name/title/employer/tagline render; `H1` is the name; no `<img>`. | AC-1, AC-18, AC-19, AC-25 |
| e2e (mobile 360Ã—600) | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” hero name/title/employer/tagline visible without scrolling. | AC-1, AC-15 |
| e2e (desktop 1280Ã—800) | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” same assertion. | AC-1, AC-15 |
| component | `tests/unit/components/Ui/IconLink.spec.ts` â€” `aria-label`, `sr-only` text, icon `aria-hidden="true"`/`focusable="false"`; `external` adds `target="_blank" rel="noopener noreferrer"`. | AC-2, AC-4 |
| e2e | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” header email icon visible from any scroll position; `getByRole('link', { name: /email james/i })` reachable in â‰¤ 10 s; `href` starts with `mailto:`. | AC-2 |
| integration | `tests/integration/pages/landmarks.spec.ts` â€” header DOM order is brand â†’ LiveSignal â†’ GitHub IconLink â†’ email IconLink. | AC-3 |
| integration | `tests/integration/pages/landmarks.spec.ts` â€” the rendered header element has `getComputedStyle(headerEl).position === 'sticky'` and `top` of `0px`. | AC-3 |
| e2e | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” scroll to the bottom of the page on both mobile and desktop projects; assert the header is still in the viewport (sticky positioning verified end-to-end). | AC-3 |
| e2e | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” header GitHub icon visible from any scroll position; `href === 'https://github.com/jameslanzon'`; HTTP HEAD returns 200. | AC-3, AC-4 |
| component | `tests/unit/components/Section/Experience.spec.ts` â€” renders one `Role` per item; asserts the **rendered DOM order** of role titles matches the reverse-chronological order of the fixture (does NOT assert that `sortRoles` was called); no collapsed `<details>`. | AC-5 |
| unit | `tests/unit/utils/sortRoles.spec.ts` â€” normalises year-only `start`; sorts reverse-chronologically; ties broken by `current` first. | AC-5 |
| integration | `tests/integration/pages/content.spec.ts` â€” generated HTML for `/` contains every role title from the fixture in correct order. | AC-5, AC-14, AC-19 |
| component | `tests/unit/components/Section/Contact.spec.ts` â€” email CTA renders; literal text "CV available on request" appears as plain text (not inside `<a>`); LinkedIn link present; **no** download anchors; **no** `?v=` query string anywhere. | AC-6, AC-17, AC-19 |
| unit | `tests/unit/scripts/fetch-live-signal.spec.ts` â€” mocks `globalThis.fetch`. Asserts (a) success path writes the success-shape JSON, (b) HTTP 403 + `X-RateLimit-Remaining: 0` writes the fallback, (c) network error writes the fallback, (d) malformed JSON writes the fallback, (e) no PushEvent in the page writes the fallback, (f) when `SKIP_LIVE_SIGNAL_FETCH=1` is set the script exits `0` immediately and does **not** read or write `content/live-signal.json`. Asserts the script always exits `0`. | AC-7, AC-11 |
| integration | `tests/integration/live-signal.spec.ts` â€” uses `@nuxt/test-utils` `setup()` (which does **not** invoke npm lifecycle hooks). Writes a fixture `content/live-signal.json` before mount and runs the build with `SKIP_LIVE_SIGNAL_FETCH=1` so the prebuild hook is a no-op. Runs both branches (commit data + unavailable). Asserts the chip text appears in the static `index.html` for each branch. | AC-7, AC-8, AC-11, AC-14 |
| component | `tests/unit/components/Ui/LiveSignal.spec.ts` â€” renders both schema branches; asserts `role="status"` + `aria-live="polite"`; with `unavailable: true` asserts no commit date or repo name appears; SSR-only render path produces the static Malta fallback string. | AC-8, AC-10, AC-11 |
| unit | `tests/unit/composables/useMaltaClock.spec.ts` â€” Vitest fake timers; the ref updates each second; the interval is cleared on scope dispose. | AC-9 |
| unit | `tests/unit/composables/useLiveSignal.spec.ts` â€” discriminated union narrows correctly for both branches. | AC-8, AC-11 |
| e2e (Lighthouse) | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” `playwright-lighthouse` mobile + Slow 4G; assert TTI < 1800 ms. | AC-12 |
| e2e (axe) | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” `@axe-core/playwright` scan tagged `wcag22aa`; zero `serious`/`critical`; explicitly include `bypass`, `landmark-one-main`, `region`, `heading-order`, `aria-allowed-role`. | AC-13, AC-21, AC-25 |
| e2e | `tests/e2e/no-js.spec.ts` â€” `javaScriptEnabled: false`; assert all five sections present; live-signal chip and Malta fallback present; the Malta fallback text matches the regex `/Malta Â· CES?T/` (survives DST flips); `mailto:` links usable. | AC-14, AC-9 |
| e2e | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” on both mobile and desktop projects, assert the same accessible-name set is reachable: hero `<h1>` containing "James Lanzon"; section headings `<h2>` named "Experience", "Skills", "Contact"; header links named "Email James" and "James' GitHub profile" (`getByRole('link', { name: ... })`); a `role="status"` element (live-signal). Uses `getByRole`/`getByLabel`. | AC-15 |
| integration | `tests/integration/pages/content.spec.ts` â€” generated HTML must not contain `jameslanzon@gmail.com`; the live-signal `role="status"` element is present. | AC-16 |
| component | `tests/unit/components/Section/Contact.spec.ts` â€” LinkedIn link present in DOM; GitHub **not** rendered in contact section (it lives in the header). | AC-17 |
| component | `tests/unit/components/Section/Hero.spec.ts` â€” no `<img>` / `<NuxtImg>`. | AC-18 |
| unit | `tests/unit/composables/useCvContent.spec.ts` â€” typed refs derived from fixture; `experience` already sorted. | AC-19 |
| integration | `tests/integration/content/cv-schema.spec.ts` â€” `content/cv.md` parses against the Zod schema (and rejects a fixture containing a `cv:` block). | AC-19 |
| e2e | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” Chromium context with `reducedMotion: 'reduce'`; assert computed `transition-duration` and `animation-duration` are both `0s` on `[data-testid="hero-cta"]` (which uses `motion-safe:transition`); assert the Malta clock still ticks. | AC-20 |
| e2e | `tests/e2e/JNY-001-recruiter-scan.spec.ts` â€” Tab once â†’ SkipLink visible; Enter â†’ `document.activeElement.id === 'main'` (the `<main>` element has `tabindex="-1"` so focus moves there programmatically). | AC-21 |
| component | `tests/unit/components/Ui/SkipLink.spec.ts` â€” first focusable; visible only on focus. | AC-21 |
| integration | `tests/integration/pages/head.spec.ts` â€” generated HTML contains `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card="summary_large_image"`, `twitter:image`; the `og:image` value is the absolute URL `https://jameslanzon.com/og/og-image.png`. | AC-22 |
| integration | `tests/integration/pages/head.spec.ts` â€” generated HTML contains expected favicon `<link>` tags and `<link rel="manifest">`. | AC-23 |
| integration | `tests/integration/pages/head.spec.ts` â€” `<html lang="en">` present in generated HTML. | AC-24 |
| component | `tests/unit/components/Section/Skills.spec.ts` â€” `H2` for section, one `H3` per skill group. | AC-25 |
| integration | `tests/integration/pages/landmarks.spec.ts` â€” heading sequence is exactly `H1 â†’ H2 â†’ H3 â€¦` with no level skipped. | AC-25 |
| integration | `tests/integration/pages/cname.spec.ts` â€” after `nuxt generate`, `.output/public/CNAME` exists with the contents `jameslanzon.com`. | AC-26 |

> **Why `playwright-lighthouse` for AC-12.** It runs inside the existing
> e2e suite â€” single runner, single report, single browser context.
> It supports the `mobile` + `Slow 4G` preset out of the box and
> exposes TTI as a numeric assertion. `lighthouse-ci` would add a
> second tool and a separate report; a hand-rolled `npx lighthouse`
> would force us to manage Chrome lifecycle. Single tool wins.

## Task breakdown

> **Ordering.** T1 must produce
> [docs/decisions/ADR-001-live-signal-build-time.md](../decisions/ADR-001-live-signal-build-time.md)
> **before T2 begins**. T1 blocks T2â€¦T24. The implementer creates the
> ADR using [docs/decisions/_TEMPLATE.md](../decisions/_TEMPLATE.md)
> with the contents specified in T1 below.

- [x] **T1** â€” Author
      [docs/decisions/ADR-001-live-signal-build-time.md](../decisions/ADR-001-live-signal-build-time.md)
      from `docs/decisions/_TEMPLATE.md`. Required sections:
      **Context** (static site, no runtime API calls, no JS-disabled
      regressions); **Decision** (pregenerate script with graceful
      fallback); **Consequences** (rate-limit risk in CI, data
      freshness bounded by deploy cadence, requires a
      placeholder-committed JSON for type safety); **Alternatives
      considered** (client-side fetch â€” rejected: breaks no-JS;
      GitHub Action that opens a PR â€” rejected: too much ceremony for
      this iteration); **Security** (XSS surface â€” Vue text
      interpolation auto-escapes, `v-html` is never used; commit
      messages are not captured by the script and never rendered;
      `repo` and `sha` are still treated as untrusted strings and
      rendered only via interpolation); **Privacy** (only the public
      `users/jameslanzon/events/public` endpoint is consulted; no
      private data is fetched, written to disk, or rendered;
      `GITHUB_TOKEN` is read from `process.env` only and never
      persisted). T1 must land before T2 begins.
- [x] **T2** â€” Add `cv` and `liveSignal` collections to
      `content.config.ts` per Â§Data shapes. Author
      `tests/integration/content/cv-schema.spec.ts`.
- [x] **T3** â€” **Cleanup pass.** (a) Delete the repo-root `index.html`.
      (b) Move `website/` to `docs/legacy/website-2016-2018/` and add a
      short `README.md` there marking it a frozen historical artefact â€”
      do not extend, do not serve. (c) Read
      [.github/workflows/deploy-pages.yml](../../.github/workflows/deploy-pages.yml)
      and confirm it deploys only `.output/public` and never references
      the legacy folder. (d) Move `CNAME` from the repo root to
      `public/CNAME` so `nuxt generate` copies it into
      `.output/public/CNAME`.
- [x] **T4** â€” Add Tailwind CSS entry (`app/assets/css/tailwind.css`),
      register it in `nuxt.config.ts`, update `tailwind.config.js`
      content globs, wire `theme.fontFamily.sans` to the
      `@nuxt/fonts`-managed family.
- [x] **T5** â€” Implement `app/utils/sortRoles.ts` + unit test.
- [x] **T6** â€” Implement `app/utils/relativeTime.ts` + unit test.
- [x] **T7** â€” Implement `scripts/fetch-live-signal.mjs` per the
      Â§Affected areas description, including the
      `SKIP_LIVE_SIGNAL_FETCH=1` early-exit branch and the
      `GITHUB_TOKEN` Authorization header. Add the placeholder
      `content/live-signal.json` (committed and **tracked** â€” do
      **not** add it to `.gitignore`). Add `scripts/setup-dev.mjs`
      (one-shot helper that runs
      `git update-index --skip-worktree content/live-signal.json`).
      Wire `prebuild` and `pregenerate` scripts in `package.json`.
      Author `tests/unit/scripts/fetch-live-signal.spec.ts` covering
      all six branches (success, 403 + rate limit, network error,
      malformed JSON, no PushEvent, `SKIP_LIVE_SIGNAL_FETCH=1`).
- [x] **T8** â€” Implement `app/composables/useLiveSignal.ts` +
      `app/composables/useMaltaClock.ts` + unit tests (Vitest fake
      timers for the clock).
- [x] **T9** â€” Implement `app/composables/useCvContent.ts` + unit test
      (uses `sortRoles`).
- [x] **T10** â€” Implement `app/components/Ui/IconLink.vue`,
      `app/components/Ui/LiveSignal.vue`, and
      `app/components/Ui/SkipLink.vue` + specs.
- [x] **T11** â€” Implement `app/components/Timeline/Role.vue` + spec.
- [x] **T12** â€” Implement Section components (Hero, Overview,
      Experience, Skills, Contact) + specs. Contact must render the
      "CV available on request" line as plain text â€” no link, no
      `mailto:` for the CV â€” and a single LinkedIn secondary link.
- [x] **T13** â€” Implement `app/layouts/default.vue`: skip link as the
      first focusable element; sticky header
      (`class="sticky top-0 z-40 ..."` with an opaque/blur background
      and a bottom border) containing brand on the left and (left â†’
      right) `LiveSignal` + GitHub `IconLink` + email `IconLink` on
      the right; `<main id="main" tabindex="-1">` slot; footer with
      LinkedIn secondary link + copyright.
- [x] **T14** â€” Replace `app/app.vue` with layout + page wrapper;
      create `app/pages/index.vue` querying `useCvContent()`; add
      `useSeoMeta` for `og:*` and `twitter:*`; verify
      `app.htmlAttrs.lang = 'en'` in `nuxt.config.ts`; add
      `app.head.link` entries for the favicon set.
- [x] **T15** â€” Verify (or update if drifted)
      [docs/cv/cv.md](../../docs/cv/cv.md) uses
      `lanzonprojects@gmail.com`. Populate `content/cv.md` from it
      (frontmatter only). Note: `docs/cv/cv.md` remains the editorial
      source; no test or task is attached to it.
- [x] **T16** â€” Add `public/og/og-image.png` (1200 Ã— 630). If
      owner-supplied artwork is unavailable, generate a temporary
      SVG-rendered-to-PNG carrying the tagline.
- [x] **T17** â€” Add the favicon set to `public/` and reference each
      entry from `nuxt.config.ts > app.head.link`. Add
      `public/.nojekyll`.
- [x] **T18** â€” Install `@axe-core/playwright` and
      `playwright-lighthouse`. Configure `playwright.config.ts` with
      `mobile` (360 Ã— 600) and `desktop` (1280 Ã— 800) projects, and
      set `webServer.command = 'npm run generate && npm run preview'`
      so a fresh-clone `npm run test:e2e` produces `.output/public`
      and serves it from a single source of truth.
- [x] **T19** â€” Author `tests/integration/live-signal.spec.ts` (uses
      `@nuxt/test-utils` `setup()` with a pre-seeded fixture and
      `SKIP_LIVE_SIGNAL_FETCH=1` to prevent the prebuild hook from
      overwriting the seeded JSON) and the four focused page specs:
      `tests/integration/pages/head.spec.ts` (OG/Twitter, favicon
      links, `<link rel="manifest">`, `<html lang>`),
      `tests/integration/pages/landmarks.spec.ts` (skip link, header
      sticky position, header DOM order, `<main tabindex="-1">`,
      heading order),
      `tests/integration/pages/content.spec.ts` (role titles in
      order, no legacy email, `role="status"` chip present), and
      `tests/integration/pages/cname.spec.ts`.
- [x] **T20** â€” Author `tests/e2e/JNY-001-recruiter-scan.spec.ts`
      covering hero, contact, header right-cluster, axe (incl.
      `bypass`, `landmark-one-main`, `region`, `heading-order`),
      skip-link keyboard test, reduced-motion emulation, Lighthouse
      TTI < 1800 ms.
- [x] **T21** â€” Author `tests/e2e/no-js.spec.ts`
      (`javaScriptEnabled: false`, including the live-signal SSR
      fallback).
- [x] **T22** â€” Update [README.md](../../README.md) to document: the
      live-signal pregenerate hook; the optional `GITHUB_TOKEN` env
      var; the `SKIP_LIVE_SIGNAL_FETCH=1` test/CI escape hatch; the
      one-shot `node scripts/setup-dev.mjs` step that fresh clones
      run after `npm install` to apply skip-worktree on
      `content/live-signal.json`; and the editorial-source role of
      `docs/cv/cv.md`.
- [x] **T23** â€” Run full pipeline: `npm run lint`,
      `npm run typecheck`, `npm test`, `npm run generate`; manually
      open `.output/public/index.html` with JS disabled; confirm
      `.output/public/CNAME` and `.output/public/.nojekyll` exist;
      confirm the live-signal chip renders.
- [x] **T24** â€” Write `docs/logs/YYYY-MM-DD-spec-001-portfolio-revamp.md`
      and update SPEC-001 status to `done`.

## Risks & rollback

- **Risk:** GitHub API rate limit (60/h unauthenticated) trips on
  busy CI days, so every build for the next hour writes the
  `unavailable` fallback. **Mitigation:** the chip degrades gracefully
  and the build never fails (AC-7); CI may set a `GITHUB_TOKEN` secret
  to lift the limit to 5 000/h.
- **Risk:** Live-signal data ages between deploys, so "3 days ago"
  becomes "3 weeks ago" if James doesn't redeploy. **Accepted for
  iteration 1**; the relative-time helper keeps the chip legible. A
  scheduled GitHub Action is captured under "Next iteration
  candidates".
- **Risk:** `content/live-signal.json` post-build writes accidentally
  committed back to the repo. **Mitigation:** the file is tracked with
  the placeholder, and `scripts/setup-dev.mjs` applies
  `git update-index --skip-worktree content/live-signal.json` on
  fresh clones so subsequent writes don't appear in `git status`.
  CI runs ephemeral checkouts so this is a no-op there.
- **Risk:** Lighthouse 4G TTI < 1800 ms is tight if Tailwind isn't
  purged or `@nuxt/fonts` swaps a heavy family. **Mitigation:**
  `tailwind.config.js` `content` globs are precise; no hero image; no
  third-party scripts; one webfont family at one or two weights; the
  Malta clock is a single setInterval and the live-signal chip ships
  no other JS.
- **Risk:** `mailto:lanzonprojects@gmail.com` exposes the address to
  scrapers. **Accepted:** the address is already a project-scoped
  alias separate from the personal `jameslanzon@gmail.com`, so spam
  is recoverable by burning the alias and minting a new one.
- **Risk:** `@nuxt/content` v3 schema differences vs v2 examples
  online. **Mitigation:** schema is integration-tested in T2.
- **Rollback:** `git revert` the implementation merge commit; previous
  GH Pages deployment remains live until the next successful push, so
  visitors see no gap.

### Security posture

- **CORS is not applicable.** `scripts/fetch-live-signal.mjs` runs in
  Node at build time, never in the browser. Visitor browsers never
  call `api.github.com`. The deployed static HTML contains only the
  baked-in `repo`/`sha`/`timestamp` strings (or the unavailable
  fallback) plus the Malta clock `setInterval`.
- **XSS surface.** All rendered copy flows through Vue's text
  interpolation (`{{ }}`) which auto-escapes. `v-html` is **not** used
  anywhere in this iteration. The live-signal `repo` and `sha` come
  from the GitHub API and are still treated as untrusted strings; we
  render them only via interpolation, never as HTML.
- **Privacy.** The fetch script reads only the public
  `users/jameslanzon/events/public` endpoint. It captures `repo`,
  `sha`, `timestamp`, and `fetchedAt` only. Commit messages are
  deliberately **not** captured (see schema and AC-7), shrinking the
  attack surface and reducing the risk of leaking work-in-progress
  context into the public site.
- **Secrets.** No secrets are required for the site to build; an
  optional `GITHUB_TOKEN` may be supplied in CI to lift the API rate
  limit. The token is read from `process.env` only; it is never
  written to disk and never appears in the generated HTML.

## Open questions

_None._

## Next iteration candidates

Captured here so they aren't lost. **Not** in scope for SPEC-001.

- **Live-signal upgrade â€” server-side regeneration on a schedule**
  (e.g. GitHub Action `cron` every few hours) so the chip refreshes
  between James' own deploys. The action would run
  `scripts/fetch-live-signal.mjs` and open a PR / push to a deploy
  branch.
- **Downloadable CV** (PDF + Markdown) if/when there is demand â€”
  deliberately removed in iteration 1.
- **Command palette** / explicit motion toggle UI (deferred from M5).
- **Contact form** as a fallback for visitors without a mail client.
- **Selected projects / case studies** (per JNY-001 out-of-scope).
- **Testimonials.**
- **Blog / writing** with `@nuxt/content` markdown collections.
