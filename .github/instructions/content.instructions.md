---
description: "Use when adding or editing markdown content in content/ for @nuxt/content. Covers frontmatter schemas, collections, querying, and how copy flows from content into components."
applyTo: "content/**/*.{md,yml,yaml,json}"
---

# Content rules (`@nuxt/content` v3)

Copy belongs in `content/`, not in `.vue` files. Components are dumb renderers.

## Collections
Collections are declared in `content.config.ts` at the project root. Each
collection has a Zod schema that defines its frontmatter shape. Add a new
collection only when an existing one cannot host the document.

Current collections (extend as the migration progresses):
- `projects/` — portfolio case studies
- `posts/` — long-form writing
- `pages/` — singletons backing top-level pages (about, contact)

## Frontmatter
Every doc requires:

```yaml
---
title: "<title>"
description: "<160-char SEO description>"
date: YYYY-MM-DD
draft: false
---
```

Collection-specific fields are validated by the Zod schema — read it before
adding new keys.

## Querying
- Inside pages: `const { data } = await useAsyncData('key', () => queryCollection('projects').all())`.
- Always wrap in `useAsyncData` so the result is serialized into the static build.
- Sort and filter in the query, not in the template, so the work happens at build time.

## Rendering
- Long-form bodies render via `<ContentRenderer :value="doc" />`.
- For one-off snippets (e.g. hero copy), expose them as frontmatter fields and bind directly.

## Anti-patterns
- ❌ Inline copy in `.vue` files for anything longer than a label.
- ❌ Querying content from a component — query in the page, pass props down.
- ❌ Editing schemas without updating affected docs in the same commit.
