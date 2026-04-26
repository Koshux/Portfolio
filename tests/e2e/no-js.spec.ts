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
    await expect(chip).toContainText(/recent activity/)
    await expect(chip).toHaveAttribute('aria-label', /GitHub/i)
  })

  test('contact section still exposes the mailto primary CTA', async ({ page }) => {
    const contact = page.locator('#contact')
    await expect(contact.locator('a[href^="mailto:lanzonprojects@gmail.com"]')).toBeVisible()
    // Iteration-7: LinkedIn moved out of the contact section into the
    // header ContactMenu. It must NOT live inside #contact anymore.
    await expect(contact.locator('a[href*="linkedin.com"]')).toHaveCount(0)
  })
})
