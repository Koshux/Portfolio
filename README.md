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
npm run dev            # local dev server (rarely needed)
npm run generate       # produce static .output/public
npm run preview        # serve the generated output
npm run typecheck      # nuxt typecheck (vue-tsc)
npm test               # unit + integration + e2e
npm run test:unit      # vitest unit + component
npm run test:int       # vitest + @nuxt/test-utils
npm run test:e2e       # playwright against generated output
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
