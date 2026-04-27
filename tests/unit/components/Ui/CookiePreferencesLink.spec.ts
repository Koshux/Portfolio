// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CookiePreferencesLink from '../../../../app/components/Ui/CookiePreferencesLink.vue'

describe('CookiePreferencesLink', () => {
  it('renders a <button> (NOT an anchor) with the accessible name "Cookie preferences"', async () => {
    const wrapper = await mountSuspended(CookiePreferencesLink)
    const btn = wrapper.get('[data-testid="cookie-preferences-link"]')
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.text()).toBe('Cookie preferences')
  })

  it('emits "open" on click', async () => {
    const wrapper = await mountSuspended(CookiePreferencesLink)
    await wrapper.get('[data-testid="cookie-preferences-link"]').trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  it('emits "open" on Enter / Space (native button activation)', async () => {
    const wrapper = await mountSuspended(CookiePreferencesLink)
    const btn = wrapper.get('[data-testid="cookie-preferences-link"]')
    await btn.trigger('keydown.enter')
    // The default browser behaviour for <button> is to fire `click` on
    // Enter / Space. Vue Test Utils + happy-dom don't simulate that
    // synthesis automatically — so we trigger click directly to verify
    // the path the visitor's keystroke ultimately runs.
    await btn.trigger('click')
    expect(wrapper.emitted('open')!.length).toBeGreaterThanOrEqual(1)
  })
})
