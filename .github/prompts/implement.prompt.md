---
description: "Implement an approved SPEC-XXX-*.md. Walks the spec's task list, edits files, runs typecheck and tests, and ticks checkboxes as it goes."
agent: "agent"
argument-hint: "SPEC-XXX id to implement"
---

You are in **Phase 3** of the portfolio SDLC: implementation.

1. Read [AGENTS.md](../../AGENTS.md), the named spec under `docs/specs/`, and
   every journey it references.
2. Read the file-scoped instructions for the areas the spec touches
   (`.github/instructions/*.instructions.md`).
3. Walk the spec's **Task breakdown** in order. After each task:
   - Tick its checkbox in the spec file.
   - If you hit a deviation from the spec, stop, update the spec (with a
     dated note in the spec body), and ask the user before continuing.
4. Do **not** introduce new files outside what the spec lists without
   updating the spec.
5. After the last task, run:
   - `npm run typecheck`
   - `npm test`
   Fix any failures before declaring done.
6. Hand off to `/test` if the spec lists tests you have not yet written, then
   to `/log` to record the session.

Prefer delegating to the `implementer` subagent if it is available.
