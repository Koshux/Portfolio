// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IconLink from '../../../../app/components/Ui/IconLink.vue'

describe('IconLink', () => {
  it('renders an anchor with the supplied aria-label and sr-only text', async () => {
    const wrapper = await mountSuspended(IconLink, {
      props: {
        href: 'https://github.com/jameslanzon',
        label: "James' GitHub profile",
        srLabel: 'GitHub',
      },
      slots: {
        default: '<svg aria-hidden="true" focusable="false"><path d="" /></svg>',
      },
    })
    const a = wrapper.get('a')
    expect(a.attributes('aria-label')).toBe("James' GitHub profile")
    expect(a.attributes('href')).toBe('https://github.com/jameslanzon')
    const srText = wrapper.get('.sr-only')
    expect(srText.text()).toBe('GitHub')
  })

  it('passes through an icon slot whose svg carries aria-hidden and focusable=false', async () => {
    const wrapper = await mountSuspended(IconLink, {
      props: {
        href: '#contact',
        label: 'Email James',
        srLabel: 'Email',
      },
      slots: {
        default: '<svg aria-hidden="true" focusable="false"><circle r="1" /></svg>',
      },
    })
    const svg = wrapper.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
  })

  it('adds target=_blank and rel=noopener noreferrer when external is true', async () => {
    const wrapper = await mountSuspended(IconLink, {
      props: {
        href: 'https://github.com/jameslanzon',
        label: "James' GitHub profile",
        srLabel: 'GitHub',
        external: true,
      },
    })
    const a = wrapper.get('a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toBe('noopener noreferrer')
  })

  it('omits target and rel when external is false (default)', async () => {
    const wrapper = await mountSuspended(IconLink, {
      props: {
        href: 'mailto:lanzonprojects@gmail.com',
        label: 'Email James',
        srLabel: 'Email',
      },
    })
    const a = wrapper.get('a')
    expect(a.attributes('target')).toBeUndefined()
    expect(a.attributes('rel')).toBeUndefined()
  })
})
