// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SkipLink from '../../../../app/components/Ui/SkipLink.vue'

describe('SkipLink', () => {
  it('renders an anchor targeting #main with default label', async () => {
    const wrapper = await mountSuspended(SkipLink)
    const a = wrapper.get('a')
    expect(a.attributes('href')).toBe('#main')
    expect(a.text()).toBe('Skip to content')
  })

  it('is sr-only by default and becomes visible only on focus', async () => {
    const wrapper = await mountSuspended(SkipLink)
    const a = wrapper.get('a')
    const cls = a.classes()
    expect(cls).toContain('sr-only')
    // Tailwind focus modifier applies the visible state on :focus.
    expect(cls).toContain('focus:not-sr-only')
  })

  it('accepts a custom href and label', async () => {
    const wrapper = await mountSuspended(SkipLink, {
      props: { href: '#elsewhere', label: 'Jump' },
    })
    expect(wrapper.get('a').attributes('href')).toBe('#elsewhere')
    expect(wrapper.text()).toBe('Jump')
  })
})
