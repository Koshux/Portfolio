// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Hero from '../../../../app/components/Section/Hero.vue'

const hero = {
  name: 'James Lanzon',
  title: 'UX Architect & Accessibility Expert',
  employer: 'European Commission',
  tagline: 'Architecting accessible, scalable systems.',
}

describe('Section/Hero', () => {
  it('renders the H1 with James Lanzon', async () => {
    const wrapper = await mountSuspended(Hero, { props: { hero } })
    const h1 = wrapper.get('h1')
    expect(h1.text()).toContain('James Lanzon')
  })

  it('renders the title and employer joined by an em dash', async () => {
    const wrapper = await mountSuspended(Hero, { props: { hero } })
    expect(wrapper.text()).toContain('UX Architect & Accessibility Expert')
    expect(wrapper.text()).toContain('European Commission')
    expect(wrapper.text()).toMatch(/UX Architect.*—.*European Commission/)
  })

  it('does not render the tagline (intentionally hidden in iteration 1 polish)', async () => {
    const wrapper = await mountSuspended(Hero, { props: { hero } })
    expect(wrapper.text()).not.toContain(hero.tagline)
  })

  it('renders a hero CTA targeting #contact with data-testid="hero-cta"', async () => {
    const wrapper = await mountSuspended(Hero, { props: { hero } })
    const cta = wrapper.get('[data-testid="hero-cta"]')
    expect(cta.attributes('href')).toBe('#contact')
  })

  it('does not render an <img> or <NuxtImg> portrait', async () => {
    const wrapper = await mountSuspended(Hero, { props: { hero } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.html()).not.toMatch(/<nuxt-img|<NuxtImg|<NuxtPicture/i)
  })
})
