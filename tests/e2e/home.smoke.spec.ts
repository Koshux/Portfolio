import { test, expect } from '@playwright/test'

// Smoke test for the static-generated home page. Every public route must
// have at least one e2e spec — see .github/instructions/testing.instructions.md.
test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
})
