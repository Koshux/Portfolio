// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ConsentPrompt from '../../../../app/components/Ui/ConsentPrompt.vue'

const props = {
  title: 'Cookies & analytics',
  prompt: 'We use Google Analytics 4. Choose below.',
  acceptLabel: 'Accept',
  declineLabel: 'Decline',
  privacyHref: '/legal/privacy',
}

describe('ConsentPrompt', () => {
  it('renders an aside region labelled by consent-title', async () => {
    const wrapper = await mountSuspended(ConsentPrompt, { props })
    const aside = wrapper.get('aside')
    expect(aside.attributes('role')).toBe('region')
    expect(aside.attributes('aria-labelledby')).toBe('consent-title')
    expect(wrapper.get('#consent-title').text()).toBe('Cookies & analytics')
  })

  it('renders both buttons sharing the .btn-consent class set (AC-4)', async () => {
    const wrapper = await mountSuspended(ConsentPrompt, { props })
    const accept = wrapper.get('[data-testid="consent-accept"]')
    const decline = wrapper.get('[data-testid="consent-decline"]')
    // Both must be <button type="button"> (no <a>, no submit).
    expect(accept.element.tagName).toBe('BUTTON')
    expect(decline.element.tagName).toBe('BUTTON')
    expect(accept.attributes('type')).toBe('button')
    expect(decline.attributes('type')).toBe('button')
    // Equal-weight: both share the base .btn-consent class.
    expect(accept.classes()).toContain('btn-consent')
    expect(decline.classes()).toContain('btn-consent')
  })

  it('emits accept / decline on the corresponding clicks', async () => {
    const wrapper = await mountSuspended(ConsentPrompt, { props })
    await wrapper.get('[data-testid="consent-accept"]').trigger('click')
    await wrapper.get('[data-testid="consent-decline"]').trigger('click')
    expect(wrapper.emitted('accept')).toHaveLength(1)
    expect(wrapper.emitted('decline')).toHaveLength(1)
  })

  it('renders the supplied prompt text and a link to privacyHref', async () => {
    const wrapper = await mountSuspended(ConsentPrompt, { props })
    expect(wrapper.text()).toContain('We use Google Analytics 4')
    const links = wrapper.findAll('a')
    const hrefs = links.map(a => a.attributes('href'))
    // NuxtLink may render as <a href="/legal/privacy"> in mounted output.
    expect(hrefs.some(h => h === '/legal/privacy')).toBe(true)
  })

  // Issue 3 regression — when the parent (mistakenly) passes an
  // object as the `prompt` prop (e.g. because @nuxt/content v3 surfaces
  // the parsed AST under `body` and shadows a frontmatter `body`
  // field), the prior implementation rendered "[object Object]". The
  // rename to `prompt` plus a string-typed prop prevents recurrence;
  // this test pins that behaviour.
  it('renders a plain string prompt without serialising as [object Object]', async () => {
    const wrapper = await mountSuspended(ConsentPrompt, {
      props: { ...props, prompt: 'Hello world' },
    })
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).not.toContain('[object Object]')
  })
})
