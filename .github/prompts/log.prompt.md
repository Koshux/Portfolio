---
description: "Append a session log to docs/logs/. Records what was done, what failed, what's still open, and hand-off notes for the next agent. Mandatory at the end of every implementation session."
agent: "agent"
argument-hint: "Short slug for the session (e.g. 'hero-redesign')"
---

You are in **Phase 5** of the portfolio SDLC: logging.

1. Read [docs/logs/_TEMPLATE.md](../../docs/logs/_TEMPLATE.md). Use every
   section.
2. Filename: `docs/logs/YYYY-MM-DD-<slug>.md` using today's date.
3. Be specific in the **Issues encountered & resolution** section — symptom →
   diagnosis → fix. Future agents grep this section.
4. The **State at end of session** section must list the spec checkboxes
   ticked and the ones still open, plus the current branch and last commit.
5. The **Hand-off notes** section is for the next agent. Write it as if you
   were briefing a stranger who has never seen this codebase.
6. **Never delete an existing log.** If you need to correct one, write a new
   log that references the old one.

Prefer delegating to the `log-keeper` subagent if it is available.
