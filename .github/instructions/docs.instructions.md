---
description: "Use when authoring documentation under docs/ — journeys, specs, logs, ADRs. Enforces template usage, ID allocation, and front-matter consistency."
applyTo: "docs/**/*.md"
---

# docs/ authoring rules

- **Always start from a template.** Templates live next to the docs they
  produce (`docs/<kind>/_TEMPLATE.md`). Copy the template, fill it in,
  do not delete unused sections — write `n/a` instead.
- **ID format**: `JNY-001`, `SPEC-001`, `ADR-001`. Zero-padded to 3 digits.
  Pick the next free number by listing the directory.
- **Filename**: `<ID>-<kebab-case-slug>.md`. Slug is derived from the title.
- **Frontmatter is mandatory.** All keys in the template must be present even
  if their value is `null` or `[]`.
- **Status transitions**:
  - Journey: `draft → approved → implemented → superseded`
  - Spec: `draft → approved → in-progress → done → superseded`
  - ADR: `proposed → accepted → deprecated → superseded`
- **Cross-link every doc.** A spec lists its journeys; a journey lists the
  specs that fulfil it; logs list both their spec and journey.
- **Logs are append-only.** Never edit a log after the session ends. If a
  later session contradicts it, write a new log that references the old one.
- **No code blobs in journeys.** Journeys describe user behaviour. Code goes
  in the spec.
