// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Role from '../../../../app/components/Timeline/Role.vue'

describe('Timeline/Role', () => {
  it('renders title as H3, organisation, and date range', async () => {
    const wrapper = await mountSuspended(Role, {
      props: {
        role: {
          title: 'Senior Engineer',
          organisation: 'Acme',
          start: '2020',
          end: '2022',
          current: false,
          bullets: ['Did things'],
        },
      },
    })
    const h3 = wrapper.get('h3')
    expect(h3.text()).toBe('Senior Engineer')
    expect(wrapper.text()).toContain('Acme')
    expect(wrapper.text()).toMatch(/2020.*–.*2022/)
  })

  it('renders "Present" when end is null', async () => {
    const wrapper = await mountSuspended(Role, {
      props: {
        role: {
          title: 'Current',
          organisation: 'Now',
          start: '2025',
          end: null,
          current: true,
          bullets: ['Doing it'],
        },
      },
    })
    expect(wrapper.text()).toMatch(/2025.*–.*Present/)
  })

  it('displays long bullets without truncation or line-clamp', async () => {
    const longBullet = 'x'.repeat(500)
    const wrapper = await mountSuspended(Role, {
      props: {
        role: {
          title: 'Long-bullet role',
          organisation: 'Org',
          start: '2024',
          end: null,
          current: true,
          bullets: [longBullet],
        },
      },
    })
    const html = wrapper.html()
    expect(wrapper.text()).toContain(longBullet)
    expect(html).not.toMatch(/line-clamp/)
    expect(html).not.toMatch(/truncate/)
  })

  it('renders one <li> per bullet', async () => {
    const wrapper = await mountSuspended(Role, {
      props: {
        role: {
          title: 'Multi',
          organisation: 'Org',
          start: '2024',
          end: null,
          current: true,
          bullets: ['one', 'two', 'three'],
        },
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(3)
  })
})
