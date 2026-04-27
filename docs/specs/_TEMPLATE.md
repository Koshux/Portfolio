---
id: SPEC-XXX
title: "<short technical title>"
status: draft   # draft | approved | in-progress | done | superseded
created: YYYY-MM-DD
owner: "<name>"
journeys: [JNY-XXX]
adrs: []
---

# SPEC-XXX — <title>

## Summary
One paragraph. What are we building and why (link the journeys).

## Acceptance criteria
The contract. Each must be verifiable by a test or manual check.

- [ ] AC-1: …
- [ ] AC-2: …
- [ ] AC-3: …

## Non-goals
What this spec explicitly does **not** cover.

- …

## Design

### Affected areas
| Path | Change |
|---|---|
| `app/pages/...` | … |
| `app/components/...` | … |
| `content/...` | … |

### Data shapes
TypeScript interfaces, content schemas, route params, etc.

```ts
// example
```

### Routing / pages
List new or modified routes.

### Component tree
ASCII or short bullet list.

### State / composables
What state lives where? Which composables are introduced or modified?

## Edge cases
- …

## Test plan

| Layer | Test | Covers AC |
|---|---|---|
| unit | `tests/unit/...spec.ts` | AC-1 |
| integration | `tests/integration/...spec.ts` | AC-2 |
| e2e | `tests/e2e/...spec.ts` | AC-3 |

## Task breakdown
Ordered checklist the implementer ticks as they go.

- [ ] T1: …
- [ ] T2: …
- [ ] T3: …
- [ ] T4: write tests
- [ ] T5: write log entry

## Risks & rollback
- Risk: …
- Rollback: revert commit `<sha>` / re-run `npm run generate` from previous tag.

## Open questions
- …
