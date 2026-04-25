// content.config.ts — collection schemas for @nuxt/content v3.
// Extend as the migration progresses (projects, posts, pages…).
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // Default catch-all so @nuxt/content stops warning at startup.
    // Replace with concrete collections (projects/, posts/, pages/) per spec.
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string().optional(),
        draft: z.boolean().default(false),
      }),
    }),
  },
})
