/**
 * T-048: /accept-terms must never send a signed-in user off-site via ?next=.
 * The test admin has already accepted the terms, so the page redirects
 * straight to its validated target on the server.
 */
import { test, expect } from './fixtures'

const ATTACKS = ['/\\evil.example', '//evil.example', '/\\/evil.example', 'https://evil.example']

test.describe('accept-terms ?next= redirect', () => {
  for (const next of ATTACKS) {
    test(`stays on site for next=${JSON.stringify(next)}`, async ({ page, baseURL }) => {
      // Never let the browser actually reach the attacker host.
      await page.route(/evil\.example/, route => route.abort())
      await page.goto(`/accept-terms?next=${encodeURIComponent(next)}`)
      await page.waitForLoadState('domcontentloaded')
      const url = new URL(page.url())
      expect(url.origin).toBe(new URL(baseURL!).origin)
      expect(url.pathname).toBe('/dashboard')
    })
  }

  test('keeps a valid internal target', async ({ page }) => {
    await page.goto(`/accept-terms?next=${encodeURIComponent('/settings/team')}`)
    await expect(page).toHaveURL(/\/settings\/team$/)
  })
})
