import { test, expect } from '@playwright/test'

// JNY-001 — no-JS fallback
//
// SSR + static generation must produce a complete page that works even
// when JavaScript is disabled (T21). This spec disables JS at the context
// level and asserts every section is still rendered, plus the live-signal
// chip degrades gracefully.

test.use({ javaScriptEnabled: false })

test.describe('home page — JavaScript disabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders all five sections', async ({ page }) => {
    // Hero: H1 with James' name.
    await expect(page.locator('h1')).toContainText(/James Lanzon/i)
    // Three H2 sections + the contact-section H2.
    await expect(page.getByRole('heading', { level: 2, name: /Experience/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /Skills/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /Contact/i })).toBeVisible()
    // Overview paragraphs are present.
    await expect(page.locator('main')).toContainText(/architect|design|accessibility/i)
  })

  test('live-signal chip falls back to the SSR placeholder + Malta time string', async ({ page }) => {
    const chip = page.locator('[role="status"][aria-live="polite"]').first()
    await expect(chip).toBeVisible()
    // Without JS the Malta clock cannot tick; the SSR fallback string
    // (Intl.DateTimeFormat with timeZone: 'Europe/Malta') still renders.
    await expect(chip).toContainText(/CES?T/)
    // And the unavailable-fallback chip text is still visible (since the
    // build seeded the placeholder JSON). Iteration-7 trimmed the visible
    // "GitHub ·" prefix; the GitHub context now lives in aria-label.
    await expect(chip).toContainText(/recent activity|last commit/)
    await expect(chip).toHaveAttribute('aria-label', /GitHub/i)
  })

  test('contact section still exposes the mailto primary CTA', async ({ page }) => {
    const contact = page.locator('#contact')
    await expect(contact.locator('a[href^="mailto:lanzonprojects@gmail.com"]')).toBeVisible()
    // Iteration-7: LinkedIn moved out of the contact section into the
    // header ContactMenu. It must NOT live inside #contact anymore.
    await expect(contact.locator('a[href*="linkedin.com"]')).toHaveCount(0)
  })

  // SPEC-002 AC-15 — JS-disabled output must not include the consent
  // prompt or the GA tag. The Cookie preferences trigger no longer
  // lives in the layout (it's on /legal/privacy under JS-gated render),
  // so the home route must not contain it at all. There is also no
  // sitewide <footer> in the minimum-legal placement (AC-26 revised).
  test('AC-15: no consent prompt, no GA tag, no Cookie preferences trigger, no <footer>', async ({ page }) => {
    const html = await page.content()
    expect(html).not.toMatch(/<script[^>]+gtag\/js/)
    expect(html).not.toMatch(/googletagmanager\.com\/gtag/)
    expect(html).not.toContain('id="consent-title"')
    expect(html).not.toContain('data-testid="consent-prompt"')
    // The Cookie preferences trigger lives only on /legal/privacy now.
    expect(html).not.toContain('data-testid="cookie-preferences-link"')
    // No sitewide footer.
    expect(html).not.toMatch(/<footer\b/)
  })
})
