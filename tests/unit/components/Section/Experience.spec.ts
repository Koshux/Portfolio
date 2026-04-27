// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Experience from '../../../../app/components/Section/Experience.vue'
import type { Role } from '../../../../app/types/cv'

const roles: Role[] = [
  { title: 'Newer', organisation: 'N', start: '2024-06', end: null, current: true, bullets: ['b1'] },
  { title: 'Middle', organisation: 'M', start: '2021-03', end: '2024-05', current: false, bullets: ['b2'] },
  { title: 'Older', organisation: 'O', start: '2018', end: '2020', current: false, bullets: ['b3'] },
]

describe('Section/Experience', () => {
  it('renders an H2 named Experience', async () => {
    const wrapper = await mountSuspended(Experience, { props: { roles } })
    const h2 = wrapper.get('h2')
    expect(h2.text()).toBe('Experience')
  })

  it('renders one ordered list item per role in the supplied order', async () => {
    const wrapper = await mountSuspended(Experience, { props: { roles } })
    expect(wrapper.find('ol').exists()).toBe(true)
    const items = wrapper.findAll('ol > li')
    expect(items.length).toBe(3)
    const titles = wrapper.findAll('h3').map(h => h.text())
    expect(titles).toEqual(['Newer', 'Middle', 'Older'])
  })

  it('does not collapse roles inside <details>', async () => {
    const wrapper = await mountSuspended(Experience, { props: { roles } })
    expect(wrapper.find('details').exists()).toBe(false)
  })
})
