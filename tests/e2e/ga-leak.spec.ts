// SPEC-002 AC-20 — production leak guard.
//
// Loads the home route on a fresh context and asserts that NO request
// to any Google host is made before the visitor explicitly opts in.

import { test, expect } from '@playwright/test'
import type { Request } from '@playwright/test'

const GOOGLE_HOSTS = /^https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)\//

test('no Google requests fire on a fresh page load before consent', async ({ page }) => {
  const requests: Request[] = []
  page.on('request', (req) => {
    if (GOOGLE_HOSTS.test(req.url())) requests.push(req)
  })
  // Do NOT route() here — we want the test to fail loudly if a request
  // is even attempted.
  await page.goto('/')
  // Sit on the page briefly to give async injectors a chance to leak.
  await page.waitForTimeout(1500)
  expect(requests, requests.map(r => r.url()).join('\n')).toHaveLength(0)
})
