/**
 * Smoke test: every signed-in page loads without a crash, a redirect back to
 * sign-in, or a console error. Runs as the test admin (session from
 * global.setup.ts). Screenshots go to e2e/.results/screens/ for review.
 */
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

const APP_PAGES = [
  '/dashboard',
  '/templates',
  '/fillndahtml',
  '/settings',
  '/settings/team',
  '/settings/company-profile',
  '/settings/billing',
  '/settings/account-security',
]

const PUBLIC_PAGES = ['/', '/faq', '/help', '/plans', '/standard-nda', '/terms', '/privacy']

/** Console noise that isn't an app bug (dev-mode banners, Clerk dev-instance warnings). */
const IGNORED_CONSOLE = [/Clerk has been loaded with development keys/i, /Download the React DevTools/i, /\[Fast Refresh\]/i, /\[HMR\]/i]

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
  page.on('console', msg => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (IGNORED_CONSOLE.some(re => re.test(text))) return
    errors.push(`console: ${text}`)
  })
  return errors
}

/**
 * Wait for the page to finish loading. Some pages (billing, home) keep a
 * connection open (Stripe, analytics), so "network idle" may never come:
 * give it a few seconds, then move on.
 */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('load')
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
}

function screenshotName(route: string, prefix: string): string {
  return `e2e/.results/screens/${prefix}${route === '/' ? 'home' : route.slice(1).replace(/\//g, '_')}.png`
}

test.describe('signed-in pages', () => {
  for (const route of APP_PAGES) {
    test(`loads ${route}`, async ({ page }) => {
      const errors = collectErrors(page)
      const res = await page.goto(route)
      expect(res?.status(), `HTTP status for ${route}`).toBeLessThan(400)
      await settle(page)
      await expect(page, 'should not bounce to sign-in').not.toHaveURL(/\/sign-in/)
      await expect(page.locator('body')).not.toContainText(/Application error|Unhandled Runtime Error/i)
      await page.screenshot({ path: screenshotName(route, 'app-'), fullPage: true })
      expect(errors, `browser errors on ${route}`).toEqual([])
    })
  }
})

test.describe('public pages (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const route of PUBLIC_PAGES) {
    test(`loads ${route}`, async ({ page }) => {
      const errors = collectErrors(page)
      const res = await page.goto(route)
      expect(res?.status(), `HTTP status for ${route}`).toBeLessThan(400)
      await settle(page)
      await page.screenshot({ path: screenshotName(route, 'public-'), fullPage: true })
      expect(errors, `browser errors on ${route}`).toEqual([])
    })
  }

  test('protected page redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
