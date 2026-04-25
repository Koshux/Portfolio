---
description: "Write or extend tests to satisfy a SPEC-XXX-*.md test plan. Picks the lowest viable test layer for each acceptance criterion."
agent: "agent"
argument-hint: "SPEC-XXX id whose test plan should be implemented"
---

You are in **Phase 4** of the portfolio SDLC: testing.

1. Read [AGENTS.md §5](../../AGENTS.md#5-testing-strategy) and
   [.github/instructions/testing.instructions.md](../instructions/testing.instructions.md).
2. Open the named spec and its **Test plan** table.
3. For each row in the test plan:
   - Pick the lowest layer that can prove the AC.
   - Mirror the source path in the test path.
   - Use `getByRole`/`getByText` selectors for Playwright; never CSS.
4. Run the relevant scripts to confirm green:
   - `npm run test:unit`
   - `npm run test:int`
   - `npm run test:e2e` (only if you touched e2e specs)
5. If a test cannot be written without code changes, return to `/implement`
   instead of writing a brittle workaround.

Prefer delegating to the `test-author` subagent if it is available.
