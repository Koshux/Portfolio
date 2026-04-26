import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

// JNY-001 — Recruiter scan
//
// A recruiter on a 4G phone arrives, scans the page in 30 seconds, and
// gets enough signal to invite James to interview. This e2e spec defends
// every UX promise from JNY-001:
//   1. Hero is above the fold.
//   2. Contact section exposes a plain mailto: + LinkedIn link.
//   3. Sticky header keeps LiveSignal + GitHub + Email reachable while
//      scrolling.
//   4. Axe finds zero serious/critical WCAG 2.2 AA violations.
//   5. Tab → skip link → Enter focuses #main.
//   6. Reduced-motion users see no transition on the hero CTA.
//   7. Lighthouse TTI on Slow 4G (mobile) is < 1800 ms.

async function expectVisible(page: Page, selector: string) {
  await expect(page.locator(selector).first()).toBeVisible()
}

test.describe('JNY-001 recruiter scan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('hero is visible above the fold with the CTA', async ({ page }) => {
    await expectVisible(page, 'h1')
    const cta = page.locator('[data-testid="hero-cta"]')
    await expect(cta).toBeVisible()
    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()
    expect(box!.y).toBeLessThan(viewport!.height)
  })

  test('header right cluster exposes Email + GitHub with accessible names', async ({ page }) => {
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: /James'? GitHub profile|GitHub/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /Email James/i })).toBeVisible()
  })

  test('live-signal chip is announced as a polite status region', async ({ page }) => {
    const chip = page.locator('[role="status"][aria-live="polite"]').first()
    await expect(chip).toBeVisible()
    await expect(chip).toContainText(/CES?T/)
  })

  test('contact section exposes mailto and LinkedIn (no GitHub duplicate, no CV download)', async ({ page }) => {
    const contact = page.locator('#contact')
    await expect(contact).toBeVisible()
    await expect(contact.locator('a[href^="mailto:lanzonprojects@gmail.com"]')).toBeVisible()
    await expect(contact.getByText(/CV available on request/i)).toBeVisible()
    await expect(contact.locator('a[href*="linkedin.com"]')).toBeVisible()
    await expect(contact.locator('a[href$=".pdf"]')).toHaveCount(0)
  })

  test('sticky header keeps the right cluster visible after scrolling to contact', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('header').getByRole('link', { name: /Email James/i })).toBeVisible()
  })

  test('skip link: Tab once, Enter, focus lands on #main', async ({ page }) => {
    await page.keyboard.press('Tab')
    const skip = page.locator('a[href="#main"]').first()
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? '')
    expect(focusedId).toBe('main')
  })

  test('reduced-motion users see no transition on the hero CTA', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const cta = page.locator('[data-testid="hero-cta"]')
    const duration = await cta.evaluate(el => getComputedStyle(el as HTMLElement).transitionDuration)
    expect(duration.split(',').every(d => d.trim() === '0s' || d.trim() === '')).toBe(true)
    await context.close()
  })

  test('axe finds zero serious or critical WCAG 2.2 AA violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const blocking = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
  })
})

// Lighthouse — drives a fresh Chrome with --remote-debugging-port and reads
// the LHR directly so we can assert the explicit TTI budget from JNY-001
// (< 1800 ms on mobile Slow 4G), independent of the project matrix. Set
// SKIP_LIGHTHOUSE=1 to bypass on slow workstations.
test.describe('JNY-001 lighthouse — mobile Slow 4G', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Lighthouse needs Chromium')
  test.skip(!!process.env.SKIP_LIGHTHOUSE, 'SKIP_LIGHTHOUSE=1 set')
  test.setTimeout(120_000)

  test('TTI < 1800 ms', async ({ playwright }) => {
    const port = 9222 + Math.floor(Math.random() * 100)
    const browser = await playwright.chromium.launch({
      args: [`--remote-debugging-port=${port}`],
    })
    try {
      const context = await browser.newContext()
      const page = await context.newPage()
      const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
      await page.goto(baseURL)

      const lighthouse = (await import('lighthouse')).default
      const lhr = await lighthouse(baseURL, {
        port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance'],
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 600,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      })

      expect(lhr).toBeTruthy()
      const audits = lhr!.lhr.audits
      const tti = audits['interactive']?.numericValue ?? Infinity
      console.log(`[lighthouse] TTI = ${Math.round(tti)} ms (perf score = ${(lhr!.lhr.categories.performance.score ?? 0) * 100})`)
      expect(tti).toBeLessThan(1800)
    }
    finally {
      await browser.close()
    }
  })
})
