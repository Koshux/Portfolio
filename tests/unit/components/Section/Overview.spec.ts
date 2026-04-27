// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Overview from '../../../../app/components/Section/Overview.vue'

describe('Section/Overview', () => {
  it('renders a single paragraph of overview prose', async () => {
    const wrapper = await mountSuspended(Overview, {
      props: { overview: 'James does the things.' },
    })
    const ps = wrapper.findAll('p')
    expect(ps.length).toBe(1)
    expect(ps[0]!.text()).toBe('James does the things.')
  })

  it('splits double-newline blocks into multiple paragraphs', async () => {
    const wrapper = await mountSuspended(Overview, {
      props: { overview: 'First para.\n\nSecond para.' },
    })
    const ps = wrapper.findAll('p')
    expect(ps.length).toBe(2)
    expect(ps[0]!.text()).toBe('First para.')
    expect(ps[1]!.text()).toBe('Second para.')
  })
})
