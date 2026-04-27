# SDLC Playbook

This is the day-to-day workflow for any agent (or human) making changes to the
portfolio. It exists so that work is **traceable**, **resumable across agent
sessions**, and **safe to ship** to GitHub Pages.

```
┌──────────┐   ┌──────┐   ┌────────────┐   ┌──────┐   ┌──────┐
│ Journey  │ → │ Spec │ → │ Implement  │ → │ Test │ → │ Log  │
└──────────┘   └──────┘   └────────────┘   └──────┘   └──────┘
```

## Phase 1 — Journey (`/journey`)

**Goal**: capture the user's perspective before any code is written.

- Output: `docs/journeys/JNY-XXX-<slug>.md`
- Template: [_TEMPLATE.md](../journeys/_TEMPLATE.md)
- Specialist subagent: `journey-author`

A journey describes **who**, **what they want**, **why it matters**, and **how
we will know they succeeded**. No solution language. If the journey starts
prescribing implementation, push it back into the spec phase.

## Phase 2 — Spec (`/spec`)

**Goal**: turn one or more journeys into an implementable plan.

- Input: one or more `JNY-*.md` files
- Output: `docs/specs/SPEC-XXX-<slug>.md`
- Template: [_TEMPLATE.md](../specs/_TEMPLATE.md)
- Specialist subagent: `spec-author`

A spec defines acceptance criteria, file-level changes, data shapes, edge
cases, and the test plan. The spec is the contract the implementation phase
must satisfy.

## Phase 3 — Implement (default agent)

**Goal**: turn the spec into working code.

- Input: a single `SPEC-*.md`
- Output: code under `app/`, `public/`, `content/`
- Specialist subagent: `implementer`

The implementer **must**:
1. Re-read the spec at the start.
2. Work in small commits aligned with the spec's task list.
3. Update the spec's checkboxes as it goes.
4. Hand off to the `test-author` before declaring done.

## Phase 4 — Test (`/test`)

**Goal**: prove the spec's acceptance criteria.

- Specialist subagent: `test-author`
- Layers: see [AGENTS.md §5](../../AGENTS.md#5-testing-strategy)

Tests live next to the layer they cover. The CI workflow runs all four layers.

## Phase 5 — Log (`/log`)

**Goal**: leave the next agent enough context to continue.

- Output: `docs/logs/YYYY-MM-DD-<slug>.md`
- Template: [_TEMPLATE.md](../logs/_TEMPLATE.md)
- Specialist subagent: `log-keeper`

Every session ends with a log. Logs are append-only and **never deleted**.

## Out-of-band: ADRs

When a decision has long-term consequences (framework choice, deployment
target, content schema), record it as an ADR under
[docs/decisions/](../decisions/). Use [_TEMPLATE.md](../decisions/_TEMPLATE.md).

## ID allocation

IDs are simple zero-padded counters per category. Before creating a new file,
list the directory and pick `max(existing) + 1`:

```bash
ls docs/journeys | grep -oE 'JNY-[0-9]+' | sort -V | tail -1
```

## When to skip phases

| Change | Skip? |
|---|---|
| Typo / copy fix in `content/` | Skip journey + spec, still write a log |
| New page / feature | Full pipeline |
| Refactor with no user-visible change | Skip journey, write spec + log |
| Dependency bump | Skip journey + spec, write log + ADR if breaking |
| Tooling / CI | Skip journey, write spec + log |
