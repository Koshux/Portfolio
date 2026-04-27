// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Skills from '../../../../app/components/Section/Skills.vue'

const groups = [
  { label: 'Engineering', items: ['TypeScript', 'Vue 3 / Nuxt 4'] },
  { label: 'UX & Accessibility', items: ['WCAG 2.2 AA'] },
]

describe('Section/Skills', () => {
  it('renders a single H2 named Skills', async () => {
    const wrapper = await mountSuspended(Skills, { props: { groups } })
    const h2s = wrapper.findAll('h2')
    expect(h2s).toHaveLength(1)
    expect(h2s[0]!.text()).toBe('Skills')
  })

  it('renders one H3 per skill group with the group label', async () => {
    const wrapper = await mountSuspended(Skills, { props: { groups } })
    const h3s = wrapper.findAll('h3').map(h => h.text())
    expect(h3s).toEqual(['Engineering', 'UX & Accessibility'])
  })

  it('renders every skill item under its group', async () => {
    const wrapper = await mountSuspended(Skills, { props: { groups } })
    expect(wrapper.text()).toContain('TypeScript')
    expect(wrapper.text()).toContain('Vue 3 / Nuxt 4')
    expect(wrapper.text()).toContain('WCAG 2.2 AA')
  })
})
