---
date: YYYY-MM-DD
session: "<short slug>"
agent: "<copilot | claude-code | human>"
spec: SPEC-XXX
journey: JNY-XXX
status: done   # in-progress | done | abandoned | blocked
duration-min: 0
---

# Log — YYYY-MM-DD — <session slug>

## Context
What was the goal of this session, in one paragraph.

## What was done
Bullet, past tense, file-level when useful.

- …
- …

## Tests added / changed
- `tests/.../...spec.ts` — covers AC-X

## Commands run
```
npm run typecheck
npm test
```

## Issues encountered & resolution
For each problem: **symptom → diagnosis → fix**. This is the section future
agents will grep when they hit the same wall.

- **Symptom**: …
  **Diagnosis**: …
  **Fix**: …

## Decisions made (link any new ADRs)
- …

## State at end of session
- Spec checkboxes ticked: T1, T2
- Spec checkboxes remaining: T3, T4
- Branch: `feature/...`
- Last commit: `<sha>`

## Hand-off notes (for the next agent)
- Start by … 
- Watch out for …
- Don't change … without re-reading SPEC-XXX §Design.
