// content.config.ts — collection schemas for @nuxt/content v3.
import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import {
  cvFrontmatterSchema,
  liveSignalSchema,
} from './shared/content-schemas'

export {
  roleSchema,
  skillGroupSchema,
  socialLinkSchema,
  projectSchema,
  cvFrontmatterSchema,
  liveSignalSchema,
} from './shared/content-schemas'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      // Exclude cv.md so it is not picked up by both `content` and `cv`.
      source: { include: '**/*.md', exclude: ['cv.md'] },
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
  },
})
