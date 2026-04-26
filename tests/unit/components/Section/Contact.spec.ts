// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Contact from '../../../../app/components/Section/Contact.vue'

const contact = {
  email: 'lanzonprojects@gmail.com',
  location: 'Malta',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jameslanzon' },
  ],
}

describe('Section/Contact', () => {
  it('renders an H2 named Contact and an id="contact" anchor target', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    expect(wrapper.get('h2').text()).toBe('Contact')
    expect(wrapper.get('section').attributes('id')).toBe('contact')
  })

  it('renders the email as a mailto link with visible address text', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    const mailto = wrapper.get('a[href="mailto:lanzonprojects@gmail.com"]')
    expect(mailto.text()).toContain('lanzonprojects@gmail.com')
  })

  it('renders the literal "Available on request" line as plain text (not a link)', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    expect(wrapper.text()).toContain('Available on request')
    // The exact phrase must not appear inside any anchor element.
    const anchors = wrapper.findAll('a')
    for (const a of anchors) {
      expect(a.text()).not.toContain('Available on request')
    }
  })

  it('renders the dynamic-year copyright in place of a sitewide footer', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    const year = new Date().getFullYear().toString()
    expect(wrapper.text()).toContain(`© ${year} James Lanzon`)
    expect(wrapper.text()).toContain('All rights reserved')
  })

  it('renders no download anchors and no ?v= query strings', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    const html = wrapper.html()
    expect(html).not.toMatch(/\bdownload\b/i)
    expect(html).not.toMatch(/\?v=/)
  })

  it('does not render a LinkedIn link in the contact section (header owns it)', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    expect(wrapper.html()).not.toMatch(/linkedin\.com/i)
  })

  it('does not render a GitHub link in the contact section (header owns it)', async () => {
    const wrapper = await mountSuspended(Contact, { props: { contact } })
    expect(wrapper.html()).not.toMatch(/github\.com/i)
  })
})
