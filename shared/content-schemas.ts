// Re-usable Zod schemas for the cv + liveSignal collections.
// Imported by content.config.ts and tests/integration/content/cv-schema.spec.ts.
import { z } from 'zod'

export const roleSchema = z.object({
  title: z.string(),
  organisation: z.string(),
  start: z.string().regex(/^\d{4}(-\d{2})?$/),
  end: z.string().regex(/^\d{4}(-\d{2})?$/).nullable(),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).min(1),
})

export const skillGroupSchema = z.object({
  label: z.string(),
  items: z.array(z.string()).min(1),
})

export const socialLinkSchema = z.object({
  label: z.string(),
  href: z.string().url(),
})

export const projectSchema = z.object({
  title: z.string(),
  href: z.string().url(),
  summary: z.string(),
  role: z.string().optional(),
  repo: z.string().url().optional(),
})

export const cvFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hero: z.object({
    name: z.string(),
    title: z.string(),
    employer: z.string(),
    tagline: z.string().max(200),
  }),
  overview: z.string(),
  projects: z.array(projectSchema).default([]),
  experience: z.array(roleSchema).min(1),
  skills: z.array(skillGroupSchema).min(1),
  contact: z.object({
    email: z.string().email(),
    location: z.string(),
    social: z.array(socialLinkSchema).default([]),
  }),
  og: z.object({
    image: z.string().url().default('https://jameslanzon.com/og/og-image.png'),
    url: z.string().url(),
  }),
})

export const liveSignalSchema = z.union([
  z.object({
    unavailable: z.literal(true),
    fetchedAt: z.string().datetime(),
  }),
  z.object({
    repo: z.string(),
    sha: z.string(),
    timestamp: z.string().datetime(),
    fetchedAt: z.string().datetime(),
  }),
])

// SPEC-002 — consent prompt + privacy notice copy lives in
// content/legal/*.md. The consent doc requires the prompt copy fields;
// the privacy doc only needs `title`. Optional fields keep both
// document shapes valid under a single schema.
//
// NOTE: the prompt body field is named `prompt` (not `body`) because
// @nuxt/content v3 surfaces the parsed-markdown AST under `body` for
// any `type: 'page'` collection, which would shadow a frontmatter
// `body` field and cause it to render as `[object Object]`.
export const consentFrontmatterSchema = z.object({
  title: z.string().max(120),
  prompt: z.string().max(280).optional(),
  acceptLabel: z.string().max(20).optional(),
  declineLabel: z.string().max(20).optional(),
  privacyHref: z.string().default('/legal/privacy'),
})
