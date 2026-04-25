---
description: "Record an architecture decision in docs/decisions/ as ADR-XXX. Use when the agent or user makes a choice with long-term consequences (framework, deployment, schema, vendor)."
agent: "agent"
argument-hint: "Short title of the decision"
---

You are recording an Architecture Decision Record.

1. Read [docs/decisions/_TEMPLATE.md](../../docs/decisions/_TEMPLATE.md).
2. Pick the next free `ADR-XXX` by listing `docs/decisions/`.
3. Fill every section. The **Alternatives considered** table must contain at
   least two rejected options — if you can't think of any, the decision is
   probably not worth an ADR.
4. Set `status: proposed` unless the user has explicitly accepted it.
5. Cross-link from the relevant spec's frontmatter `adrs:` array.
