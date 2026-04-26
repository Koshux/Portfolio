---
date: 2026-04-27
session: "spec-001-iteration-7-polish"
agent: "copilot"
spec: SPEC-001
journey: JNY-001
status: done
duration-min: 180
---

# Log — 2026-04-27 — SPEC-001 iteration-7 polish

## Context
Phase 5 (Log) of the SPEC-001 portfolio revamp on `feature/SPEC-001-portfolio-revamp`.
Session resolved three user-reported issues (broken `npm run dev`, sitewide
footer removal + LinkedIn relocation, redundant GitHub mark on the live-signal
chip), refreshed the README as a pickup-and-go guide, and synchronised stale
unit/integration/e2e tests with the iteration-1 polish + iteration-7 surfaces
that had drifted since the previous logged session.

## What was done

### Issue #1 — `npm run dev` boot failure + README revamp
- [nuxt.config.ts](../../nuxt.config.ts): removed the explicit
  `css: ['~/assets/css/tailwind.css']` entry. Under Nuxt 4's srcDir =
  `app/`, the explicit path collided with `@nuxtjs/tailwindcss`
  auto-injection, producing
  `Cannot find module '/css/tailwind.css' imported from 'virtual:nuxt:.../.nuxt/css.mjs'`.
  Module log now reports "Using default Tailwind CSS file" and the dev server
  returns HTTP 200 on `http://localhost:3000`.
- [README.md](../../README.md): full rewrite. Sections: prerequisites
  (Node 20.x, npm 10.x), one-time setup (`git clone` → `npm install` →
  `node scripts/setup-dev.mjs`), day-to-day commands, troubleshooting
  (`Remove-Item -Recurse -Force .nuxt, .output, .data, node_modules\.cache`),
  live-signal internals, project structure tree, SDLC at a glance, deployment.

### Issue #2 — drop sitewide footer; move copyright into Contact aside; surface LinkedIn in nav
- [app/layouts/default.vue](../../app/layouts/default.vue): removed the
  entire sitewide `<footer>` block.
- [app/components/Section/Contact.vue](../../app/components/Section/Contact.vue):
  added `const currentYear = new Date().getFullYear()` and a bordered
  `&copy; {{ currentYear }} James Lanzon. All rights reserved.` paragraph at
  the foot of the right-column aside (only place the copyright now lives).
- [app/components/Ui/ContactMenu.vue](../../app/components/Ui/ContactMenu.vue):
  added LinkedIn (3rd item, `target="_blank" rel="noopener noreferrer"`) to
  both the mobile `<details>` panel and the desktop inline `UiIconLink` row.
  Breakpoint moved from `sm:` to `md:` so 3 icons + chip + brand do not
  crowd the small-tablet header.

### Issue #3 — redundant tiny GitHub mark on the LiveSignal chip at sm+
- [app/components/Ui/LiveSignal.vue](../../app/components/Ui/LiveSignal.vue):
  the inline GitHub mark SVG now carries
  `class="h-3 w-3 shrink-0 text-paper-white/70 sm:hidden"`. Mobile keeps the
  glyph (the `Koshux/Portfolio` label is hidden via `hidden sm:inline`);
  desktop drops it because the visible repo label already supplies the
  context.

### Stale-test sync (no production drift, just catch-up to iteration-1 polish + iteration-7 surface)
Five unit specs realigned with the shipped components:
- [tests/unit/scripts/fetch-live-signal.spec.ts](../../tests/unit/scripts/fetch-live-signal.spec.ts)
  — endpoint user `jameslanzon` → `koshux`.
- [tests/unit/components/Ui/LiveSignal.spec.ts](../../tests/unit/components/Ui/LiveSignal.spec.ts)
  — assert `recent activity` text + `aria-label` matches `/GitHub/i` instead
  of the legacy `GitHub · recent activity` literal.
- [tests/unit/components/Section/Hero.spec.ts](../../tests/unit/components/Section/Hero.spec.ts)
  — tagline assertion inverted (hidden in iteration-1 polish).
- [tests/unit/components/Timeline/Role.spec.ts](../../tests/unit/components/Timeline/Role.spec.ts)
  — bullet assertions inverted (hidden in iteration-1 polish).
- [tests/unit/components/Section/Contact.spec.ts](../../tests/unit/components/Section/Contact.spec.ts)
  — "CV available on request" → "Available on request"; LinkedIn assertion
  inverted (now header-owned); new dynamic-year copyright assertion.

## Tests added / changed
- [tests/unit/components/Ui/ContactMenu.spec.ts](../../tests/unit/components/Ui/ContactMenu.spec.ts)
  — **new**, 8 cases: details/summary semantics, Escape closes the panel,
  three-link panel content, `target`/`rel` attributes, desktop `md:flex`
  cluster.
- [tests/e2e/home.smoke.spec.ts](../../tests/e2e/home.smoke.spec.ts) —
  expanded from 1 → 4 tests (page render, hero CTA hash navigation, mailto,
  no `<footer>`).
- [tests/integration/landmarks.spec.ts](../../tests/integration/landmarks.spec.ts),
  [tests/integration/content.spec.ts](../../tests/integration/content.spec.ts),
  [tests/integration/live-signal.spec.ts](../../tests/integration/live-signal.spec.ts)
  — updated for the iteration-7 SSR surface.
- [tests/e2e/no-js.spec.ts](../../tests/e2e/no-js.spec.ts) — patched the
  legacy `GitHub · recent activity` and `LinkedIn-in-#contact` assertions to
  the iteration-7 truth.
- [docs/specs/SPEC-001-portfolio-revamp-iteration-1.md](../specs/SPEC-001-portfolio-revamp-iteration-1.md)
  — corresponding test-plan checkboxes ticked by the test-author subagent.

## Commands run
```
npm run typecheck      # exit 0
npm run lint           # exit 0
npm run test:unit      # 89 / 89
npm run test:int       # 33 pass, 3 pre-existing describe.skip, 0 failures
SKIP_LIVE_SIGNAL_FETCH=1 npm run generate   # exit 0
npm run dev            # HTTP 200 on http://localhost:3000 (verified, killed)
npx playwright test --list tests/e2e/       # 32 specs across 3 files compile clean
```

## Issues encountered & resolution

- **Symptom**: `npm run dev` exited with
  `Cannot find module '/css/tailwind.css' imported from 'virtual:nuxt:.../.nuxt/css.mjs'`.
  **Diagnosis**: explicit `css: ['~/assets/css/tailwind.css']` in
  `nuxt.config.ts` collided with `@nuxtjs/tailwindcss` auto-injection under
  Nuxt 4's `srcDir = 'app/'`; the alias resolved against project root, not
  the srcDir.
  **Fix**: removed the explicit `css:` entry. The module's "Using default
  Tailwind CSS file" log now appears and dev returns 200.

- **Symptom**: `tests/unit/components/Section/Hero.spec.ts` and
  `tests/unit/components/Timeline/Role.spec.ts` failed with assertions
  expecting visible tagline/bullet text.
  **Diagnosis**: those surfaces were hidden during iteration-1 polish; the
  unit specs had not been updated.
  **Fix**: inverted the assertions to expect the elements to be absent /
  hidden. No production code change.

- **Symptom**: `tests/unit/components/Ui/LiveSignal.spec.ts` failed on the
  literal `GitHub · recent activity` aria-label.
  **Diagnosis**: iteration-7 split the GitHub label into a hidden-on-mobile
  `Koshux/Portfolio` chip text and an `aria-label` containing "GitHub".
  **Fix**: relaxed assertion to `recent activity` text + `/GitHub/i`
  aria-label match.

- **Symptom**: `tests/e2e/no-js.spec.ts` would have asserted LinkedIn lives
  inside `#contact`.
  **Diagnosis**: iteration-7 promotes LinkedIn to the header `ContactMenu`;
  the only #contact-area attribution is now the dynamic-year copyright.
  **Fix**: assertion updated to match header ownership.

- **Symptom**: header crowded on small tablets (Pixel-7-class) when 3 icons
  + live chip + brand stacked at `sm:`.
  **Diagnosis**: breakpoint set too low for the new third (LinkedIn) link.
  **Fix**: bumped the inline cluster's breakpoint from `sm:flex` to
  `md:flex`; mobile `<details>` now persists through small tablets.

## Decisions made (link any new ADRs)
- No new ADRs. Decisions in this session were tactical (component-local) and
  do not warrant ADR-level records.

## State at end of session
- Spec checkboxes ticked this session: test-plan rows updated by test-author
  subagent in [SPEC-001](../specs/SPEC-001-portfolio-revamp-iteration-1.md)
  (T-test rows for ContactMenu unit, home smoke, landmarks/content/live-signal
  integration, no-js e2e).
- Spec checkboxes remaining: AC items still covered only by e2e — axe
  `wcag22aa`, reduced-motion preference, skip-link Tab→Enter, Lighthouse
  performance budget. Flagged, not regressed.
- Branch: `feature/SPEC-001-portfolio-revamp`.
- Last commit before this log: `9e606bb feat(ui): mobile contact dropdown,
  GitHub mark on live-signal, contractual part-time copy`.
- Quality gates: typecheck 0, lint 0, unit 89/89, integration 33 pass / 3
  skipped / 0 fail, generate 0, dev 200. E2E executed list-only (32 specs
  compile).

## Hand-off notes (for the next agent)

- **Run `npm run test:e2e`** before the next merge to `main`. Playwright
  browsers may need installing (`npx playwright install`). The full suite
  has not been executed end-to-end this iteration —
  [tests/e2e/JNY-001-recruiter-scan.spec.ts](../../tests/e2e/JNY-001-recruiter-scan.spec.ts)
  (axe pass) and [tests/e2e/no-js.spec.ts](../../tests/e2e/no-js.spec.ts)
  in particular have not run against a freshly generated build.
- **AC tail**: a handful of acceptance criteria are covered only by e2e
  (axe `wcag22aa`, `prefers-reduced-motion`, skip-link Tab→Enter,
  Lighthouse perf). These are flagged in the spec test plan; verify them
  before declaring SPEC-001 `done`.
- **Do not re-introduce** an explicit `css:` entry in `nuxt.config.ts` —
  see Issue #1 above. `@nuxtjs/tailwindcss` handles injection.
- **Header breakpoint** for the inline contact cluster is now `md:`, not
  `sm:`. Anything below `md` lives in the `<details>` dropdown.
- This session ends with uncommitted changes to be committed onto
  `feature/SPEC-001-portfolio-revamp` (NOT `main`) and pushed to origin.
