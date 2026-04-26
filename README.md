# jameslanzon.com — Portfolio

Personal portfolio for [jameslanzon.com](https://jameslanzon.com), built with
**Nuxt 4** and statically generated to **GitHub Pages**.

## For AI agents

Read [`AGENTS.md`](./AGENTS.md) first. It is the operating manual used by
both **GitHub Copilot** and **Claude Code**, and it points to:

- The SDLC playbook → [docs/sdlc/README.md](./docs/sdlc/README.md)
- File-scoped instructions → [.github/instructions/](./.github/instructions/)
- Specialist subagents → [.github/agents/](./.github/agents/)
- The orchestrator skill → [.github/skills/sdlc-workflow/SKILL.md](./.github/skills/sdlc-workflow/SKILL.md)
- Slash-command prompts → [.github/prompts/](./.github/prompts/) (`/journey`, `/spec`, `/implement`, `/test`, `/log`, `/adr`)

## For humans

```bash
npm install            # install deps
node scripts/setup-dev.mjs  # one-shot: skip-worktree on content/live-signal.json
npm run dev            # local dev server (rarely needed)
npm run generate       # produce static .output/public
npm run preview        # serve the generated output
npm run typecheck      # nuxt typecheck (vue-tsc)
npm test               # unit + integration + e2e
npm run test:unit      # vitest unit + component
npm run test:int       # vitest + @nuxt/test-utils
npm run test:e2e       # playwright against generated output
```

### Live-signal chip

The header chip ("commit · X days ago") is generated **at build time** by
[`scripts/fetch-live-signal.mjs`](./scripts/fetch-live-signal.mjs), which
hits the public GitHub events API and writes `content/live-signal.json`.
The build never fails: every error path writes the unavailable fallback
and the chip degrades to "GitHub · recent activity". See
[ADR-001](./docs/decisions/ADR-001-live-signal-build-time.md).

| Env var | Effect |
|---|---|
| `GITHUB_TOKEN` | _Optional_. Lifts the unauthenticated rate limit (60/h → 5 000/h). Read from `process.env`, never written to disk. |
| `SKIP_LIVE_SIGNAL_FETCH=1` | Skip the API call entirely. Used by tests + CI to keep `content/live-signal.json` deterministic. |

`content/live-signal.json` is **tracked** (with the unavailable
placeholder) so fresh clones build out-of-the-box. Running
`node scripts/setup-dev.mjs` after `npm install` applies
`git update-index --skip-worktree` so subsequent build-time writes don't
appear in `git status`. CI runs ephemeral checkouts and is unaffected.

### Editorial source for the CV

[`docs/cv/cv.md`](./docs/cv/cv.md) is the editorial source of truth for
James' CV. `content/cv.md` carries only the frontmatter consumed by
`@nuxt/content`. To update copy: edit the editorial file, then mirror the
relevant frontmatter into `content/cv.md`.

### Legacy site

The 2016–2018 static site lives under
[`docs/legacy/website-2016-2018/`](./docs/legacy/website-2016-2018/) for
reference only. Do not extend it — new work belongs under `app/`.

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

## Project structure

```
app/                  # Nuxt 4 source
public/               # Static passthrough
website/              # Legacy static site (read-only, kept for reference)
docs/                 # Journeys, specs, logs, decisions
tests/{unit,integration,e2e}
.github/
  instructions/       # File-scoped agent guidance
  prompts/            # SDLC slash-commands
  agents/             # Specialist subagents
  skills/             # Bundled SDLC workflow
  workflows/          # GitHub Actions
.claude/              # Claude Code settings (reads AGENTS.md from root)
```

## Deployment

Pushes to `main` trigger [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)
which generates the static site and publishes it to GitHub Pages. CI
quality gates (typecheck, unit, integration, e2e) run via
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
