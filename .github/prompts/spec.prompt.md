---
description: "Turn one or more approved journeys into a SPEC-XXX-*.md technical spec under docs/specs/. Produces acceptance criteria, file-level changes, data shapes, edge cases, task list, and test plan."
agent: "agent"
argument-hint: "Which JNY-XXX file(s) should this spec cover?"
---

You are starting **Phase 2** of the portfolio SDLC: writing a technical spec.

1. Read [AGENTS.md](../../AGENTS.md) and
   [docs/sdlc/README.md](../../docs/sdlc/README.md).
2. Read the referenced journeys under `docs/journeys/`. If the user did not
   name them, list `docs/journeys/` and ask which one(s) this spec covers.
3. Read [docs/specs/_TEMPLATE.md](../../docs/specs/_TEMPLATE.md) and use every
   section. Replace empty sections with `n/a` rather than deleting them.
4. Pick the next free `SPEC-XXX` ID by listing `docs/specs/`.
5. Re-read the relevant file-scoped instructions before designing:
   - [.github/instructions/vue-nuxt.instructions.md](../instructions/vue-nuxt.instructions.md)
   - [.github/instructions/testing.instructions.md](../instructions/testing.instructions.md)
   - [.github/instructions/content.instructions.md](../instructions/content.instructions.md)
6. The **Test plan** section must map each acceptance criterion to a specific
   test layer and file path. No AC may be untested.
7. The **Task breakdown** is the to-do list the implementer will tick. Each
   task must be small enough to commit independently.
8. Write the file as `docs/specs/SPEC-XXX-<kebab-slug>.md`. Update each
   referenced journey's frontmatter `related-specs:` array.
9. End your message with: `Next: run the implementer (default agent) against
   SPEC-XXX.`

Prefer delegating to the `spec-author` subagent if it is available.
