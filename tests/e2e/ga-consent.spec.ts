// SPEC-002 — full consent-banner e2e journey (revised — minimum-legal
// placement: Privacy link in header contact menu, Cookie preferences
// trigger on /legal/privacy).
//
// Covers AC-1 (no requests pre-consent), AC-2 (no cookies pre-consent),
// AC-5 (keyboard order), AC-7 (persistence), AC-8 (privacy-page reopen + flip),
// AC-12 (decline = silent), AC-13 (Sec-GPC + DNT short-circuit),
// AC-22 (SPA page_view), AC-23 (page_view actually reaches GA4).
//
// Network strategy: we route Google hosts to `route.fulfill({ status: 204 })`
// so observability (page.on('request')) still records the URL while the
// browser doesn't actually depend on Google being reachable.

import { test, expect } from '@playwright/test'
import type { Page, Request } from '@playwright/test'

const GOOGLE_HOSTS = /^https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)\//

// Tiny gtag.js stub — replaces the real Google library so the test is
// fully offline. When `gtag('event', 'page_view', ...)` is called, the
// stub issues a fetch to /g/collect?en=page_view so page.on('request')
// can observe it (the /g/collect URL is stubbed below to 204). On load
// it also drains any commands the pre-script shim queued onto dataLayer
// before the real loader was supposed to take over.
const FAKE_GTAG_JS = `
(function(){
  var dataLayer = window.dataLayer = window.dataLayer || [];
  function emit(args) {
    if (args && args[0] === 'event' && args[1] === 'page_view') {
      try {
        var qp = encodeURIComponent(JSON.stringify(args[2] || {}));
        fetch('https://www.google-analytics.com/g/collect?en=page_view&dp=' + qp, { method: 'POST', mode: 'no-cors', keepalive: true });
      } catch (e) {}
    }
  }
  // Drain any queued commands pushed by the in-page shim before this loaded.
  var queued = [];
  for (var i = 0; i < dataLayer.length; i++) {
    var item = dataLayer[i];
    queued.push(item && item.length !== undefined ? Array.prototype.slice.call(item) : item);
  }
  queued.forEach(emit);
  // Replace the shim with one that emits going forward.
  window.gtag = function(){
    var args = Array.prototype.slice.call(arguments);
    dataLayer.push(args);
    emit(args);
  };
})();
`

async function captureGoogleRequests(page: Page): Promise<Request[]> {
  const requests: Request[] = []
  page.on('request', (req) => {
    if (GOOGLE_HOSTS.test(req.url())) requests.push(req)
  })
  // Stub the gtag.js loader with a fake that emits page_view fetches.
  await page.route(/^https:\/\/www\.googletagmanager\.com\//, (route) => {
    route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_GTAG_JS })
  })
  // Stub the analytics collect endpoints with 204 — observed but no real network.
  await page.route(/^https:\/\/(www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)\//, (route) => {
    route.fulfill({ status: 204, body: '' })
  })
  return requests
}

/**
 * Click the always-on Privacy link in the header contact menu. On the
 * mobile project the link lives inside a `<details>` panel that must
 * be opened first; on desktop it is rendered inline. This helper
 * tolerates both placements so the same spec runs across both
 * Playwright projects.
 */
async function clickHeaderPrivacyLink(page: Page): Promise<void> {
  // Try the desktop inline link (lives inside the .md:flex sibling
  // div). It is `display:none` below md, so isVisible() will be false
  // on the mobile project.
  const inline = page.locator('header div.md\\:flex a[href="/legal/privacy"]')
  if (await inline.count() > 0 && await inline.first().isVisible().catch(() => false)) {
    await inline.first().click()
    return
  }
  // Mobile: open the <details> dropdown then click the panel link.
  await page.locator('header details summary').click()
  await page.locator('header details a[href="/legal/privacy"]').click()
}

test.describe('consent banner — fresh visit', () => {
  test('AC-1 + AC-2: no Google requests and no _ga cookies before clicking Accept', async ({ page, context }) => {
    const requests = await captureGoogleRequests(page)
    await page.goto('/')
    // Wait for hydration so the consent prompt has had time to mount.
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeVisible()
    // No Google network traffic.
    expect(requests).toHaveLength(0)
    // No _ga / _gid / _gac / __utm cookies set.
    const cookies = await context.cookies()
    const trackingCookies = cookies.filter(c => /^(_ga|_gid|_gac|__utm)/.test(c.name))
    expect(trackingCookies).toHaveLength(0)
  })

  test('AC-3: hero <h1> stays visible above the prompt on a 360x600 mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 600 })
    await page.goto('/')
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    const h1Box = await h1.boundingBox()
    const promptBox = await page.locator('[data-testid="consent-prompt"]').boundingBox()
    expect(h1Box).not.toBeNull()
    expect(promptBox).not.toBeNull()
    // h1 ends before the prompt starts.
    expect(h1Box!.y + h1Box!.height).toBeLessThanOrEqual(promptBox!.y)
  })

  test('AC-5: keyboard order — Decline, then Accept (after Esc no-op)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeVisible()
    // Esc must NOT dismiss the prompt.
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeVisible()
    // Move focus into the prompt's decline button.
    await page.locator('[data-testid="consent-decline"]').focus()
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')))
      .toBe('consent-decline')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')))
      .toBe('consent-accept')
    // Note: the Cookie preferences trigger is no longer in the layout
    // focus chain (revised minimum-legal placement — it lives on
    // /legal/privacy and is not part of the prompt itself).
  })

  test('AC-12: decline → no GA4 script appears and no Google requests fire', async ({ page }) => {
    const requests = await captureGoogleRequests(page)
    await page.goto('/')
    await page.locator('[data-testid="consent-decline"]').click()
    // Give any rogue async injection a moment to (not) happen.
    await page.waitForTimeout(500)
    expect(await page.locator('script#ga4-tag').count()).toBe(0)
    expect(requests).toHaveLength(0)
  })

  test('AC-7: decision persists across reloads', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-testid="consent-decline"]').click()
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeHidden()
    await page.reload()
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeHidden()
    await page.reload()
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeHidden()
    const stored = await page.evaluate(() => localStorage.getItem('jl-consent-v1'))
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.analytics).toBe('denied')
  })

  test('AC-8: Cookie preferences trigger on /legal/privacy reopens the prompt and flipping clears _ga cookies', async ({ page, context }) => {
    await captureGoogleRequests(page)
    await page.goto('/')
    // Accept first so a `_ga` cookie can be (artificially) seeded.
    await page.locator('[data-testid="consent-accept"]').click()
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeHidden()
    // Seed a _ga cookie as a stand-in for what GA4 would set in
    // production (test routes Google requests to 204 so no real cookie
    // is dropped). This validates that flipping → denied clears it.
    await context.addCookies([
      { name: '_ga', value: 'GA1.1.test', url: page.url() },
    ])
    // Navigate to /legal/privacy where the trigger lives now.
    await clickHeaderPrivacyLink(page)
    await page.waitForURL('**/legal/privacy')
    // Reopen via the privacy-page Cookie preferences button.
    await page.locator('[data-testid="cookie-preferences-link"]').click()
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeVisible()
    // Flip to decline.
    await page.locator('[data-testid="consent-decline"]').click()
    await expect(page.locator('[data-testid="consent-prompt"]')).toBeHidden()
    // _ga cookie should now be gone.
    const cookies = await context.cookies()
    const remaining = cookies.filter(c => c.name === '_ga' && c.value === 'GA1.1.test')
    expect(remaining).toHaveLength(0)
    const stored = await page.evaluate(() => localStorage.getItem('jl-consent-v1'))
    expect(JSON.parse(stored!).analytics).toBe('denied')
  })

  test('AC-23: clicking Accept fires a GA4 page_view request within 5 s', async ({ page }) => {
    const requests = await captureGoogleRequests(page)
    await page.goto('/')
    await page.locator('[data-testid="consent-accept"]').click()
    // Wait up to 5 s for a /g/collect call carrying en=page_view.
    await expect.poll(
      () => requests.some(r => /\/g\/collect/.test(r.url()) && /(\?|&)en=page_view/.test(r.url())),
      { timeout: 5_000 },
    ).toBe(true)
  })

  test('AC-22: SPA navigation /  → /legal/privacy fires a second page_view', async ({ page }) => {
    const requests = await captureGoogleRequests(page)
    await page.goto('/')
    await page.locator('[data-testid="consent-accept"]').click()
    // Wait for the initial page_view.
    await expect.poll(
      () => requests.filter(r => /(\?|&)en=page_view/.test(r.url())).length,
      { timeout: 5_000 },
    ).toBeGreaterThanOrEqual(1)
    // SPA-navigate via the header Privacy link.
    await clickHeaderPrivacyLink(page)
    await page.waitForURL('**/legal/privacy')
    await expect.poll(
      () => requests.filter(r => /(\?|&)en=page_view/.test(r.url())).length,
      { timeout: 5_000 },
    ).toBeGreaterThanOrEqual(2)
  })
})

test.describe('consent banner — Sec-GPC short-circuit (AC-13)', () => {
  test.use({
    extraHTTPHeaders: { 'Sec-GPC': '1' },
  })

  test('Sec-GPC=1 hides the prompt on first paint and treats consent as denied', async ({ page }) => {
    const requests: Request[] = []
    page.on('request', (req) => {
      if (GOOGLE_HOSTS.test(req.url())) requests.push(req)
    })
    await page.route(GOOGLE_HOSTS, (route) => {
      route.fulfill({ status: 204, body: '' })
    })
    // Override navigator.globalPrivacyControl in the page so the
    // composable detects the GPC signal client-side too.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', {
        value: true,
        configurable: true,
      })
    })
    await page.goto('/')
    // The prompt must NOT auto-appear.
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="consent-prompt"]')).toHaveCount(0)
    expect(requests).toHaveLength(0)
    // Cookie preferences trigger lives on /legal/privacy in the
    // revised placement — navigate there and assert visibility so
    // GPC users can override.
    await clickHeaderPrivacyLink(page)
    await page.waitForURL('**/legal/privacy')
    await expect(page.locator('[data-testid="cookie-preferences-link"]')).toBeVisible()
  })
})

test.describe('consent banner — DNT=1 short-circuit (AC-13)', () => {
  test('navigator.doNotTrack === "1" treats consent as denied without rendering the prompt', async ({ page }) => {
    const requests: Request[] = []
    page.on('request', (req) => {
      if (GOOGLE_HOSTS.test(req.url())) requests.push(req)
    })
    await page.route(GOOGLE_HOSTS, (route) => {
      route.fulfill({ status: 204, body: '' })
    })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true,
      })
    })
    await page.goto('/')
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="consent-prompt"]')).toHaveCount(0)
    expect(requests).toHaveLength(0)
  })
})
