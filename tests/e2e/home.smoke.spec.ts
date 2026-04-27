import { test, expect } from '@playwright/test'

// Smoke test for the static-generated home page. Every public route must
// have at least one e2e spec — see .github/instructions/testing.instructions.md.
//
// Iteration-7 surface checks (kept intentionally narrow so this stays a
// fast smoke test; deeper journey assertions live in
// tests/e2e/JNY-001-recruiter-scan.spec.ts).
test.describe('home page — smoke', () => {
  test('page renders with a title and the hero H1', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/James Lanzon/i)
  })

  test('hero CTA scrolls to #contact', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('[data-testid="hero-cta"]').first()
    await expect(cta).toBeVisible()
    await cta.click()
    // Wait for the hash to update; the CTA is an in-page anchor link.
    await page.waitForFunction(() => window.location.hash === '#contact')
    await expect(page.locator('#contact')).toBeInViewport()
  })

  test('contact section exposes a mailto link', async ({ page }) => {
    await page.goto('/')
    const mailto = page.locator('#contact a[href^="mailto:lanzonprojects@gmail.com"]').first()
    await expect(mailto).toBeVisible()
  })

  test('header contact menu exposes the always-on Privacy link (SPEC-002 AC-26 revised)', async ({ page }) => {
    await page.goto('/')
    // No sitewide footer in the minimum-legal placement.
    await expect(page.locator('footer')).toHaveCount(0)
    // The layout always renders the Privacy link in BOTH the mobile
    // <details> dropdown and the desktop inline cluster — Tailwind
    // hides whichever doesn't match the viewport. Assert presence in
    // both surfaces; visibility is project (mobile/desktop) dependent
    // and covered by the visit-and-click flow in the ga-consent spec.
    const dropdownLink = page.locator('header details a[href="/legal/privacy"]')
    const inlineLink = page.locator('header div.md\\:flex a[href="/legal/privacy"]')
    await expect(dropdownLink).toHaveCount(1)
    await expect(inlineLink).toHaveCount(1)
    await expect(dropdownLink).toHaveText('Privacy')
    await expect(inlineLink).toHaveText('Privacy')
  })
})
