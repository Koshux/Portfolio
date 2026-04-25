---
name: sdlc-workflow
description: "Drive a feature from idea to merged code through the portfolio SDLC: journey → spec → implement → test → log. Use when the user says 'I want to add/change/build X' on the portfolio and there is no existing journey or spec yet. Walks every phase using the templates in docs/ and the specialist subagents under .github/agents/."
argument-hint: "Describe the feature or change you want to make"
---

# SDLC Workflow

End-to-end orchestration of the portfolio SDLC defined in
[AGENTS.md](../../../AGENTS.md) and
[docs/sdlc/README.md](../../../docs/sdlc/README.md).

## When to Use
- Starting a new feature or significant change to the portfolio.
- The user has an *intent* but no journey/spec yet.
- Resuming work where logs show the previous session stopped mid-phase.

## When NOT to Use
- Pure copy edits inside `content/` (skip to a log).
- Dependency bumps (skip to ADR + log).
- Single-file refactors with no user-visible change (skip journey, go straight
  to `/spec`).

## Procedure

### 0. Bootstrap
1. Read [AGENTS.md](../../../AGENTS.md).
2. Read [docs/sdlc/README.md](../../../docs/sdlc/README.md).
3. Use the todo tool to create one item per phase below.

### 1. Journey
- Delegate to the `journey-author` subagent (or run [/journey](../../prompts/journey.prompt.md)).
- Confirm the journey is `status: approved` before continuing. If the user
  has not approved, stop and ask.

### 2. Spec
- Delegate to the `spec-author` subagent (or run [/spec](../../prompts/spec.prompt.md)).
- Confirm every acceptance criterion has a row in the test plan. If not,
  loop back.
- Confirm `status: approved` before continuing.

### 3. Implement
- Delegate to the `implementer` subagent (or run [/implement](../../prompts/implement.prompt.md)).
- Track progress via the spec's Task breakdown checkboxes.

### 4. Test
- Delegate to the `test-author` subagent (or run [/test](../../prompts/test.prompt.md)).
- Run `npm run typecheck && npm test`. Do not advance until green.

### 5. Log
- Delegate to the `log-keeper` subagent (or run [/log](../../prompts/log.prompt.md)).
- The session is not complete until the log file exists.

### 6. Optional review
- For non-trivial work, delegate to the `reviewer` subagent. Address
  blockers and majors before proposing a PR.

## Output
On success, return:
- Journey ID and path
- Spec ID and path, with all checkboxes ticked
- Test result summary
- Log file path
- Suggested commit message: `<type>(<scope>): <summary> (SPEC-XXX)`

## Recovery
If a previous session stopped mid-phase, find the most recent file in
`docs/logs/`, read its **State at end of session** and **Hand-off notes**,
then resume from the phase that contains the next unchecked task.
