# Claude Code

This project's operating manual lives in [`AGENTS.md`](../AGENTS.md) at the
repo root. Claude Code reads `AGENTS.md` natively, so there is intentionally
no separate `CLAUDE.md`.

If you need Claude-specific overrides (model preferences, local-only hooks),
add them in `.claude/settings.local.json` — that file is git-ignored.

## Specialist agents
Mirror of the Copilot custom agents under
[../.github/agents/](../.github/agents/). Claude Code picks them up from
either location.

## Skills
The orchestrator skill lives at
[../.github/skills/sdlc-workflow/SKILL.md](../.github/skills/sdlc-workflow/SKILL.md).
Claude Code also scans `.claude/skills/` — symlink or copy if you want it
discoverable from both roots.
