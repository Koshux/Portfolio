import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import type {
  ContactBlock,
  CvDocument,
  HeroBlock,
  OgBlock,
  Project,
  Role,
  SkillGroup,
} from '../types/cv'
import { sortRoles } from '../utils/sortRoles'

interface UseCvContent {
  hero: ComputedRef<HeroBlock>
  overview: ComputedRef<string>
  projects: ComputedRef<Project[]>
  experience: ComputedRef<Role[]>
  skills: ComputedRef<SkillGroup[]>
  contact: ComputedRef<ContactBlock>
  updated: ComputedRef<string>
  og: ComputedRef<OgBlock>
  pending: Ref<boolean>
  error: Ref<Error | null>
}

const EMPTY_HERO: HeroBlock = { name: '', title: '', employer: '', tagline: '' }
const EMPTY_CONTACT: ContactBlock = { email: '', location: '', social: [] }
const EMPTY_OG: OgBlock = { image: '', url: '' }

/**
 * Single source of truth for the CV page. Wraps a `useAsyncData` query
 * against the `cv` content collection so the result is serialised into
 * the static build and hydrated on the client. `experience` is sorted
 * reverse-chronologically before being exposed.
 *
 * Memoised across components by re-using the same `useAsyncData` key.
 */
export async function useCvContent(): Promise<UseCvContent> {
  const { data, pending, error } = await useAsyncData('cv', () =>
    queryCollection('cv').first(),
  )

  const doc = computed<CvDocument | null>(() => (data.value as unknown as CvDocument | null) ?? null)

  const hero = computed<HeroBlock>(() => doc.value?.hero ?? EMPTY_HERO)
  const overview = computed<string>(() => doc.value?.overview ?? '')
  const projects = computed<Project[]>(() => doc.value?.projects ?? [])
  const experience = computed<Role[]>(() => sortRoles(doc.value?.experience ?? []))
  const skills = computed<SkillGroup[]>(() => doc.value?.skills ?? [])
  const contact = computed<ContactBlock>(() => doc.value?.contact ?? EMPTY_CONTACT)
  const updated = computed<string>(() => doc.value?.updated ?? '')
  const og = computed<OgBlock>(() => doc.value?.og ?? EMPTY_OG)

  return {
    hero,
    overview,
    projects,
    experience,
    skills,
    contact,
    updated,
    og,
    pending,
    error: error as unknown as Ref<Error | null>,
  }
}
