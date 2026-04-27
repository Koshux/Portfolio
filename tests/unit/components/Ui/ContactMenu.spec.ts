// @vitest-environment nuxt
//
// Iteration-7 — ContactMenu (header right cluster).
//
// On mobile (< md) the contact group collapses into a native
// <details>/<summary> disclosure carrying GitHub / Email / LinkedIn.
// On md+ the same three actions render inline as IconLinks.
//
// We mount with `attachTo: document.body` so the JSDOM `pointerdown` /
// `keydown` listeners installed by the component fire against the same
// document the wrapper renders into.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ContactMenu from '../../../../app/components/Ui/ContactMenu.vue'

let host: HTMLElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  host.remove()
})

describe('ContactMenu — mobile <details> dropdown', () => {
  it('renders a single <details> element marked md:hidden so it never duplicates the inline cluster', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const details = wrapper.findAll('details')
    expect(details).toHaveLength(1)
    expect(details[0]!.classes()).toContain('md:hidden')
  })

  it('exposes a <summary> with an accessible name and the SVG marker hidden from AT', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const summary = wrapper.get('summary')
    expect(summary.attributes('aria-label')).toBe('Contact menu')
    const icon = summary.get('svg')
    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.attributes('focusable')).toBe('false')
  })

  it('toggles the open state when the <summary> is activated', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const details = wrapper.get('details').element as HTMLDetailsElement
    expect(details.open).toBe(false)
    // Native <details> opens via a click on <summary> in JSDOM, which
    // also dispatches the `toggle` event the component listens to.
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await wrapper.vm.$nextTick()
    expect(details.open).toBe(true)
  })

  it('closes when Escape is pressed and the panel is open', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const details = wrapper.get('details').element as HTMLDetailsElement
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await wrapper.vm.$nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(details.open).toBe(false)
  })

  it('renders four links in the dropdown panel: GitHub, Email, LinkedIn, Privacy', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const panelLinks = wrapper.findAll('details a')
    expect(panelLinks).toHaveLength(4)
    const hrefs = panelLinks.map(a => a.attributes('href'))
    expect(hrefs.some(h => h?.startsWith('https://github.com/'))).toBe(true)
    expect(hrefs.some(h => h?.startsWith('mailto:lanzonprojects@gmail.com'))).toBe(true)
    expect(hrefs.some(h => h?.includes('linkedin.com/in/james-lanzon'))).toBe(true)
    // SPEC-002 AC-26 — always-on Privacy link inside the mobile dropdown.
    expect(hrefs.some(h => h === '/legal/privacy')).toBe(true)
  })

  it('opens the LinkedIn link in a new tab with rel="noopener noreferrer"', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const linkedin = wrapper
      .findAll('details a')
      .find(a => a.attributes('href')?.includes('linkedin.com'))
    expect(linkedin).toBeDefined()
    expect(linkedin!.attributes('target')).toBe('_blank')
    const rel = linkedin!.attributes('rel') ?? ''
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
  })
})

describe('ContactMenu — desktop inline cluster', () => {
  it('renders the inline desktop cluster gated to md:flex with all three IconLinks plus a Privacy text link', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    // The inline cluster lives in a sibling <div> with `md:flex` so it is
    // hidden below the breakpoint and visible from md upwards.
    const inline = wrapper.findAll('div').find(d => d.classes().includes('md:flex'))
    expect(inline).toBeDefined()
    expect(inline!.classes()).toContain('hidden')
    const links = inline!.findAll('a')
    const hrefs = links.map(a => a.attributes('href'))
    expect(hrefs.some(h => h?.startsWith('https://github.com/'))).toBe(true)
    expect(hrefs.some(h => h?.startsWith('mailto:lanzonprojects@gmail.com'))).toBe(true)
    expect(hrefs.some(h => h?.includes('linkedin.com/in/james-lanzon'))).toBe(true)
    // SPEC-002 AC-26 — inline Privacy text link (NOT an icon).
    const privacy = links.find(a => a.attributes('href') === '/legal/privacy')
    expect(privacy).toBeDefined()
    expect(privacy!.text()).toBe('Privacy')
  })

  it('marks the inline LinkedIn IconLink as external (target=_blank + rel)', async () => {
    const wrapper = await mountSuspended(ContactMenu, { attachTo: host })
    const inline = wrapper.findAll('div').find(d => d.classes().includes('md:flex'))!
    const linkedin = inline
      .findAll('a')
      .find(a => a.attributes('href')?.includes('linkedin.com'))
    expect(linkedin).toBeDefined()
    expect(linkedin!.attributes('target')).toBe('_blank')
    const rel = linkedin!.attributes('rel') ?? ''
    expect(rel).toContain('noopener')
    expect(rel).toContain('noreferrer')
  })
})

