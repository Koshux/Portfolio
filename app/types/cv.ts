// Shared CV-related types. Keep in sync with content.config.ts schemas.

export interface Role {
  title: string
  organisation: string
  /** ISO `YYYY` or `YYYY-MM` */
  start: string
  /** ISO `YYYY` or `YYYY-MM`, or `null` for "present" */
  end: string | null
  current?: boolean
  bullets: string[]
}

export interface SkillGroup {
  label: string
  items: string[]
}

export interface SocialLink {
  label: string
  href: string
}

export interface Project {
  title: string
  href: string
  summary: string
  role?: string
  repo?: string
}

export interface HeroBlock {
  name: string
  title: string
  employer: string
  tagline: string
}

export interface ContactBlock {
  email: string
  location: string
  social: SocialLink[]
}

export interface OgBlock {
  image: string
  url: string
}

export interface CvDocument {
  title: string
  description: string
  updated: string
  hero: HeroBlock
  overview: string
  projects: Project[]
  experience: Role[]
  skills: SkillGroup[]
  contact: ContactBlock
  og: OgBlock
}

export type LiveSignal =
  | { unavailable: true; fetchedAt: string }
  | { repo: string; sha: string; timestamp: string; fetchedAt: string }
