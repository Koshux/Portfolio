// content.config.ts — collection schemas for @nuxt/content v3.
import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import {
  cvFrontmatterSchema,
  liveSignalSchema,
  consentFrontmatterSchema,
} from './shared/content-schemas'

export {
  roleSchema,
  skillGroupSchema,
  socialLinkSchema,
  projectSchema,
  cvFrontmatterSchema,
  liveSignalSchema,
  consentFrontmatterSchema,
} from './shared/content-schemas'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      // Exclude cv.md, the legal/* tree (own collections), so they are
      // not picked up twice.
      source: { include: '**/*.md', exclude: ['cv.md', 'legal/**'] },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string().optional(),
        draft: z.boolean().default(false),
      }),
    }),
    cv: defineCollection({
      type: 'page',
      source: 'cv.md',
      schema: cvFrontmatterSchema,
    }),
    liveSignal: defineCollection({
      type: 'data',
      source: 'live-signal.json',
      schema: liveSignalSchema,
    }),
    // SPEC-002 — consent prompt copy + privacy notice.
    legal: defineCollection({
      type: 'page',
      source: 'legal/**.md',
      schema: consentFrontmatterSchema,
    }),
  },
})
