# jameslanzon.com — Portfolio

Personal portfolio for [jameslanzon.com](https://jameslanzon.com), built with
**Nuxt 4** (Composition API, `<script setup lang="ts">`) and statically
generated to **GitHub Pages** via `nitro.preset = 'github-pages'`. Tailwind 3
for styling, `@nuxt/content` for the CV/copy source of truth, `@nuxt/fonts`
for Inter, `@nuxt/image` for asset optimisation. Single-page layout: hero →
selected work (with hover/focus tooltips) → experience timeline → skills →
contact. Dark theme with `nuxt-green` accent. Live-signal chip in the header
exposes the latest commit on `koshux/Portfolio` at build time.

## For AI agents

Read [`AGENTS.md`](./AGENTS.md) first. It is the operating manual used by
both **GitHub Copilot** and **Claude Code**, and it points to:

- The SDLC playbook → [docs/sdlc/README.md](./docs/sdlc/README.md)
- File-scoped instructions → [.github/instructions/](./.github/instructions/)
- Specialist subagents → [.github/agents/](./.github/agents/)
- The orchestrator skill → [.github/skills/sdlc-workflow/SKILL.md](./.github/skills/sdlc-workflow/SKILL.md)
- Slash-command prompts → [.github/prompts/](./.github/prompts/) (`/journey`, `/spec`, `/implement`, `/test`, `/log`, `/adr`)

## For humans — pickup-and-go guide

### Prerequisites

- **Node.js 20.x** (Nitro and `@nuxt/content` v3 require ≥ 20.11). Verify
  with `node -v`.
- **npm 10.x** (ships with Node 20).
- A POSIX-ish shell (PowerShell 5.1+, bash, zsh — all fine).

### One-time setup

```bash
git clone https://github.com/koshux/Portfolio.git
cd Portfolio
npm install
node scripts/setup-dev.mjs   # marks content/live-signal.json skip-worktree
```

`setup-dev.mjs` runs `git update-index --skip-worktree` against
`content/live-signal.json` so the **build-time** writes by
`scripts/fetch-live-signal.mjs` don't pollute `git status` while you work.
CI checkouts are ephemeral and unaffected.

### Day-to-day commands

```bash
npm run dev            # Nuxt dev server with HMR (http://localhost:3000)
npm run generate       # static build → .output/public
npm run preview        # serve the generated output
npm run typecheck      # nuxt typecheck (vue-tsc)
npm run lint           # eslint (Nuxt + Vue rules)
npm test               # unit + integration + e2e
npm run test:unit      # vitest unit + component
npm run test:int       # vitest + @nuxt/test-utils
npm run test:e2e       # playwright against generated output
```

> **AGENTS.md hard rule:** never run `npm run dev` from automation. For
> verification, prefer `npm run generate && npm run preview`.

### Troubleshooting

#### `Cannot find module '/css/tailwind.css'` on `npm run dev`

This is a stale Nuxt cache, usually after switching between `dev` and
`generate`, or after pulling a branch that touched `nuxt.config.ts` or
`tailwind.config.js`. Wipe the build artefacts and restart:

```bash
# PowerShell
Remove-Item -Recurse -Force .nuxt, .output, .data, node_modules/.cache -ErrorAction SilentlyContinue
npm run dev

# bash / zsh
rm -rf .nuxt .output .data node_modules/.cache
npm run dev
```

The CSS lives at [`app/assets/css/tailwind.css`](./app/assets/css/tailwind.css)
and is registered in [`nuxt.config.ts`](./nuxt.config.ts) as
`css: ['~/assets/css/tailwind.css']`. Nothing about that path is wrong —
the cache is.

#### Live-signal chip says "recent activity"

The build-time fetch silently falls back when the GitHub API is rate-
limited or offline. Set `GITHUB_TOKEN` (any classic PAT, no scopes
needed) to lift the unauthenticated 60/h limit, or set
`SKIP_LIVE_SIGNAL_FETCH=1` to skip the fetch entirely (deterministic for
tests / offline work). See [ADR-001](./docs/decisions/ADR-001-live-signal-build-time.md).

#### `EBUSY: resource busy or locked, rmdir '.output'`

You have a `npm run preview` server still running. Stop it (Ctrl+C in
its terminal) before re-running `generate`.

### Live-signal chip — internals

The header chip ("commit · X days ago · Malta · CEST") is generated **at
build time** by [`scripts/fetch-live-signal.mjs`](./scripts/fetch-live-signal.mjs),
which hits the public GitHub events API and writes
`content/live-signal.json`. The build never fails: every error path
writes the unavailable fallback and the chip degrades gracefully.

| Env var | Effect |
|---|---|
| `GITHUB_TOKEN` | _Optional_. Lifts the unauthenticated rate limit (60/h → 5 000/h). Read from `process.env`, never written to disk. |
| `SKIP_LIVE_SIGNAL_FETCH=1` | Skip the API call entirely. Used by tests + CI to keep `content/live-signal.json` deterministic. |

`content/live-signal.json` is **tracked** (with the unavailable
placeholder) so fresh clones build out-of-the-box.

### Editorial source for the CV

[`docs/cv/cv.md`](./docs/cv/cv.md) is the editorial source of truth for
James' CV. `content/cv.md` carries only the frontmatter consumed by
`@nuxt/content`. To update copy: edit the editorial file, then mirror the
relevant frontmatter into `content/cv.md`.

### Project structure

```
app/
  assets/css/tailwind.css     # Tailwind entry — base + components + utilities
  components/
    Section/                  # Hero, Projects, Experience, Skills, Contact
    Timeline/                 # Role / experience timeline pieces
    Ui/                       # SkipLink, IconLink, ContactMenu, LiveSignal
  composables/                # useCvContent, useLiveSignal, useMaltaClock
  layouts/default.vue
  pages/index.vue
  types/cv.ts
content/
  cv.md                       # CV frontmatter consumed by @nuxt/content
  live-signal.json            # Build-time GitHub event payload
docs/
  cv/cv.md                    # Editorial CV source of truth
  journeys/  specs/  logs/  decisions/  sdlc/
public/                       # Static passthrough (favicons, robots, og)
scripts/
  fetch-live-signal.mjs       # Pre-build GitHub API fetch
  setup-dev.mjs               # One-shot dev environment bootstrap
shared/content-schemas.ts     # Zod schemas for @nuxt/content collections
tests/
  unit/  integration/  e2e/
.github/
  instructions/  prompts/  agents/  skills/  workflows/
.claude/                      # Claude Code reads AGENTS.md from root
```

## SDLC at a glance

```
┌──────────┐   ┌──────┐   ┌────────────┐   ┌──────┐   ┌──────┐
│ Journey  │ → │ Spec │ → │ Implement  │ → │ Test │ → │ Log  │
└──────────┘   └──────┘   └────────────┘   └──────┘   └──────┘
   /journey     /spec       (default)        /test     /log
```

| Artifact | Lives in | Purpose |
|---|---|---|
| Journeys | [docs/journeys/](./docs/journeys/) | Why — user perspective |
| Specs | [docs/specs/](./docs/specs/) | What — implementable contract |
| Logs | [docs/logs/](./docs/logs/) | What was done — audit trail |
| ADRs | [docs/decisions/](./docs/decisions/) | Long-term decisions |

Templates live alongside as `_TEMPLATE.md` in each folder.

## Deployment

Pushes to `main` trigger [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)
which generates the static site and publishes it to GitHub Pages. CI
quality gates (typecheck, unit, integration, e2e) run via
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

### Analytics — GA4 (SPEC-002)

GA4 is consent-gated. The measurement ID is inlined into the static
build via the `NUXT_PUBLIC_GA_MEASUREMENT_ID` env var.

| Env var | Effect |
|---|---|
| `NUXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID, e.g. `G-XXXXXXXXXX`. **Empty / unset = inert build** (no consent prompt, no GA tag, no Cookie preferences trigger on `/legal/privacy`). The Privacy link in the header contact menu is always rendered regardless. |

Set it as a **GitHub Actions repo secret** under
**Settings → Secrets and variables → Actions** (same name) so the
deploy workflow injects it on `nuxt generate`. CI deliberately runs
without the secret so the inert path is exercised on every PR
([SPEC-002 §Task breakdown T13](./docs/specs/SPEC-002-restore-analytics.md)).

The Playwright e2e suite uses a fixture ID (`G-TEST00000`) injected by
[`playwright.config.ts`](./playwright.config.ts) so consent-flow tests
(banner, accept → page_view) run locally without a real property.
