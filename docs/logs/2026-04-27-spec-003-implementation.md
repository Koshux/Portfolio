---
date: 2026-04-27
session: "spec-003-implementation"
agent: "copilot"
spec: SPEC-003
journey: JNY-003
status: in-progress
duration-min: 90
---

# Log — 2026-04-27 — SPEC-003 HTTPS implementation (repo-side)

## Context

Walked SPEC-003 tasks T1–T8, T11, T12 on `feature/spec-003`
(branched from `feat/revamp` after SPEC-002's GA env-var fix was
merged). Goal: deliver every repository-side artefact required by
SPEC-003 — runbook, ADR, defence-in-depth `.gitignore`, mixed-content
guard, no-cert-files guard, production smoke spec, Playwright project
gating, nightly health workflow, README cross-references — so that
T9 (the manual GoDaddy + GitHub Pages runbook) is the only remaining
work between today and a green `npm run test:e2e:prod` against a live
`https://jameslanzon.com`.

T9 (manual runbook execution), T10 (production smoke against the
live origin), and T13/T14 (log + status flips that depend on T9/T10)
are deferred to a follow-up session that has GoDaddy console access.

## What was done

### Documentation

- [`docs/runbooks/https-godaddy-github-pages.md`](../runbooks/https-godaddy-github-pages.md)
  — new authoritative manual checklist. Mirrors SPEC-003 §Runbook
  step-for-step with Verification clauses, hard rules (do not toggle
  the GitHub custom-domain field; do not edit MX/SPF/DMARC), a
  failure-modes table, and an explicit "rollback is not supported by
  design" note grounded in the HSTS contract.
- [`docs/decisions/ADR-002-https-on-github-pages.md`](../decisions/ADR-002-https-on-github-pages.md)
  — new ADR. Status `proposed` (flips to `accepted` once T9 lands).
  Captures: registrar = GoDaddy (DNS only), CDN = none, cert provider
  = Let's Encrypt via GitHub Pages, HSTS without preload, canonical
  host = apex. Alternatives table covers GoDaddy SSL, Cloudflare
  proxy, Cloudflare DNS-only, self-host, and the chosen option, each
  with explicit pros/cons.
- [`README.md`](../../README.md) — added a "Custom domain & HTTPS
  (SPEC-003)" section under "Deployment" linking the runbook, ADR,
  guards, smoke, and nightly workflow, plus the explicit
  `PLAYWRIGHT_PROJECT=production-smoke npm run test:e2e:prod`
  invocation.

### Repository-side guards

- `.gitignore` — appended `*.pem`, `*.key`, `*.crt`, `*.csr`,
  `*.p12` belt-and-braces patterns (AC-11). The integration spec is
  the primary guard; `.gitignore` is defence-in-depth.
- [`tests/integration/no-cert-files.spec.ts`](../../tests/integration/no-cert-files.spec.ts)
  — new (AC-11 + AC-12). Walks the working tree skipping
  `node_modules`/`.output`/`.nuxt`/`.data`/`.cache`/`.nitro`/
  `dist`/`coverage`/`test-results`/`playwright-report`/`.git` and
  fails on any `*.pem|*.key|*.crt|*.csr|*.p12`. Asserts the absence
  of `.well-known/acme-challenge/` at any depth in `public/` and
  `.output/public/`. Includes a sanity-check that the walker visits
  >50 files (guards against a future SKIP_DIRS regression silently
  passing).
- [`tests/integration/cname.spec.ts`](../../tests/integration/cname.spec.ts)
  — extended with the AC-14 mixed-content guard. Scans `app/`,
  `content/`, `public/` (text extensions only — `.vue/.ts/.js/.json/
  .md/.html/.css/.scss/.txt/.xml/.yml/.yaml/.webmanifest` and
  variants) for any `http://(www\.)?jameslanzon\.com` literal,
  case-insensitive. `tests/` and `docs/` are deliberately exempt
  because they document/assert the redirect behaviour. Existing
  `/CNAME` and `.nojekyll` assertions retained.

### Production smoke

- [`tests/e2e/https-health.spec.ts`](../../tests/e2e/https-health.spec.ts)
  — new (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-13). Eight tests:
  apex 200; HSTS `max-age >= 31536000` and no `preload`;
  `http://apex` 301/308 → `https://apex/` in one hop;
  `https://www` 301/308 → `https://apex/`; `http://www` redirects
  (chain allowed) to `https://apex/`; LE issuer + apex SAN; LE
  issuer + www SAN; cert `notAfter ≥ 14 days` and lifetime ≤ 90d.
  Uses `node:tls.connect` for SAN extraction (Playwright's
  `securityDetails()` lacks SAN) and the global `fetch` with
  `redirect: 'manual'` for redirect status assertions.
- [`playwright.config.ts`](../../playwright.config.ts) — added the
  `production-smoke` project (`testMatch: ['**/https-health.spec.ts']`,
  `baseURL: https://jameslanzon.com`) and `testIgnore` on the
  `mobile`/`desktop` projects so the smoke is exclusive to its own
  project. The local `webServer` is conditionally `undefined` when
  `PLAYWRIGHT_PROJECT === 'production-smoke'` so production-smoke
  never spins up `npm run generate && npm run preview`.
- [`package.json`](../../package.json) — added `test:e2e:prod`;
  changed `test:e2e` and `test:e2e:ui` to scope explicitly to
  `--project=mobile --project=desktop` (otherwise the production
  smoke would also run on every `npm test` and fail until HTTPS is
  live).

### CI

- [`.github/workflows/nightly-https-health.yml`](../../.github/workflows/nightly-https-health.yml)
  — new. `cron: '30 5 * * *'` UTC, `push: main`, `workflow_dispatch`.
  Installs deps + Chromium, runs `npm run test:e2e:prod`. On failure,
  ensures the `https-health` label exists (`gh label create … --force`,
  idempotent), looks up an existing open issue with that label
  (`gh issue list --label https-health --state open --search 'HTTPS health failure' --json number --jq '.[0].number'`),
  and either comments on it or creates a new one — guaranteeing one
  open issue per outage rather than one per cron tick. Uploads the
  `playwright-report` artefact regardless.
- `.github/workflows/ci.yml` — unchanged. The default `npm run
  test:e2e` now scopes to `mobile` + `desktop`, so PR CI continues
  to run unaltered (just with explicit project flags).
- `.github/workflows/deploy-pages.yml` — unchanged (per spec).

## Tests added / changed

- `tests/integration/no-cert-files.spec.ts` — covers AC-11, AC-12. (5 tests, green.)
- `tests/integration/cname.spec.ts` — extended; covers AC-10, AC-14. (4 tests, green.)
- `tests/e2e/https-health.spec.ts` — covers AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-13. (8 tests, requires live HTTPS — gated on T9/T10.)

## Commands run

```
npm run typecheck                                  # green
npm run lint                                       # green
npx vitest run --config vitest.integration.config.ts \
  tests/integration/no-cert-files.spec.ts \
  tests/integration/cname.spec.ts                  # 9/9 green
npx playwright test --project=production-smoke --list   # 8 tests listed
npx playwright test --project=mobile --project=desktop --list  # 56 tests (production-smoke excluded)
```

`npm run test:int` (full integration suite) reports two pre-existing
failures unrelated to SPEC-003 — see Issues encountered below.

## Issues encountered & resolution

- **Symptom**: `npm run test:int` reports failures in
  `tests/integration/pages/analytics-build.spec.ts` and
  `tests/integration/pages/legal-privacy.spec.ts` ("expected
  generated HTML not to contain the inlined GA measurement ID").
  **Diagnosis**: SPEC-002's `tests/integration/global-setup.ts`
  invokes `npx nuxt generate --dotenv tests/integration/.env.empty`
  to isolate the integration build from the developer's repo-level
  `.env`. On this machine the local `.env` contains the real GA4
  measurement ID and Nuxt 4 / c12 still picks it up — possibly
  because `--dotenv` no longer fully overrides auto-discovery in this
  Nuxt version, or the empty fixture file isn't suppressing the
  default discovery path. The integration build inlines
  `measurementId:"G-GHHEB7CTKV"` into the generated HTML, breaking
  the inert-path assertions.
  **Fix**: not in scope for SPEC-003. Left untouched and called out
  here so the next agent can either (a) move the env-var override
  earlier in the build pipeline, (b) use a `.env.empty` strategy
  Nuxt 4 honours, or (c) temporarily rename the dev `.env` before
  running the integration suite. SPEC-003's own integration specs
  (`cname.spec.ts`, `no-cert-files.spec.ts`) are independent of
  this and pass cleanly.
- **Symptom**: Default `npx playwright test --list` includes the 8
  `production-smoke` tests in addition to mobile + desktop, so
  `npm run test:e2e` would attempt to hit the live origin during
  CI (and fail until HTTPS is live).
  **Diagnosis**: Playwright runs every project unless you filter.
  **Fix**: changed `package.json` `test:e2e` to
  `playwright test --project=mobile --project=desktop` (and the
  same for `test:e2e:ui`). `test:e2e:prod` already scopes to
  `--project=production-smoke`. The new
  `nightly-https-health.yml` workflow sets `PLAYWRIGHT_PROJECT=production-smoke`
  and runs `npm run test:e2e:prod`.
- **Symptom**: When a future agent edits a content file or component
  and pastes a `http://jameslanzon.com` link, the CI build would
  fail without an obvious cause.
  **Diagnosis**: AC-14's mixed-content guard is implemented inside
  `tests/integration/cname.spec.ts`. The error message includes
  `file:line → text` for every offender so the fix is mechanical.
  **Fix**: documented in the spec; the test message is
  self-explanatory.

## Decisions made

- ADR-002 captures the architectural choices (registrar, CDN, cert
  provider, HSTS posture, canonical host).
- Default `npm run test:e2e` scoped to `mobile + desktop` projects
  rather than gating production-smoke via env var, so the live
  origin is decoupled from PRs by configuration rather than runtime
  branching.

## State at end of session

- Spec checkboxes ticked: T1, T2, T3, T4, T5, T6, T7, T8, T11. T12
  partial (~) — typecheck/lint/unit and the SPEC-003 integration
  specs are green; pre-existing SPEC-002 integration failures
  flagged but not addressed.
- Spec checkboxes remaining: T9 (manual runbook execution at
  GoDaddy + GitHub Pages), T10 (production smoke against the live
  origin once T9 lands), T13 (final implementation log after T9/T10),
  T14 (status flips: ADR-002 → accepted, SPEC-003 → done, JNY-003 →
  implemented).
- ADR-002 status: `proposed`. Flips to `accepted` after T9.
- SPEC-003 status: `draft`. Flips to `done` after T14.
- JNY-003 status: `approved`. Flips to `implemented` after T14.
- Branch: `feature/spec-003`.
- Last commit: `b6de58a` (pre-implementation; the SPEC-003 changes
  are uncommitted on the branch as of this log).

## Hand-off notes (for the next agent)

- Start by **executing the runbook** at
  [docs/runbooks/https-godaddy-github-pages.md](../runbooks/https-godaddy-github-pages.md)
  step-by-step. Paste every `dig`/`curl` output and every console
  screenshot into a follow-up log
  (`docs/logs/<YYYY-MM-DD>-spec-003-runbook.md`).
- Watch out for the Let's Encrypt rate limit (5 issuances per
  registered domain per week). Do **not** toggle the GitHub
  custom-domain field while troubleshooting DNS — fix `dig` output
  first, only then click `Save`.
- Don't change `public/CNAME` without re-reading SPEC-003 §Design
  (the redirect target depends on the apex form).
- After HTTPS is live, run `PLAYWRIGHT_PROJECT=production-smoke
  npm run test:e2e:prod` locally and paste the run output into the
  follow-up log. Then flip ADR-002 → `accepted`, SPEC-003 →
  `done`, JNY-003 → `implemented`.
- The pre-existing SPEC-002 integration test leakage (developer
  `.env` GA ID into the inert build) is unrelated to SPEC-003 but
  blocks `npm run test:int` from being green on this machine.
  Either fix it before T14 or open a small follow-up spec.
