---
description: "Capture a new user journey under docs/journeys/. Interviews the user when details are missing, then writes JNY-XXX-*.md from the template."
agent: "agent"
argument-hint: "Who is the user and what do they want to do?"
---

You are starting **Phase 1** of the portfolio SDLC: writing a user journey.

1. Read [AGENTS.md §3](../../AGENTS.md#3-the-sdlc-for-ai-agents) and
   [docs/sdlc/README.md](../../docs/sdlc/README.md) so you understand the rules.
2. Read [docs/journeys/_TEMPLATE.md](../../docs/journeys/_TEMPLATE.md). Do **not**
   deviate from its sections.
3. List existing files under `docs/journeys/` and pick the next free
   `JNY-XXX` ID (zero-padded, 3 digits).
4. If the user's request is too thin to fill the template, ask them — using the
   ask-questions tool if available — for: persona, trigger, success criteria,
   failure modes, and out-of-scope items. **Do not invent a persona.**
5. Write the file as `docs/journeys/JNY-XXX-<kebab-slug>.md`.
6. Set `status: draft` and leave `related-specs: []` until a spec exists.
7. End your message with a single line: `Next: run /spec to design the
   implementation.`

Constraints:
- No solution language in the journey body. If you catch yourself naming
  components or APIs, move the sentence into a new spec instead.
- Prefer delegating to the `journey-author` subagent if it is available.
