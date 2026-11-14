/**
 * Runs once before the suite:
 *  1. Refuses to continue if the target looks like production.
 *  2. Fetches a Clerk testing token (lets the automated browser past Clerk's
 *     bot protection).
 *  3. Makes sure the test admin exists in Clerk (creates it on first run).
 *  4. Signs in with a one-time sign-in ticket (no password, no 2FA prompt),
 *     clicks through accept-terms and onboarding if this is a fresh user,
 *     and saves the signed-in session to e2e/.auth/admin.json.
 *
 * Every test in the `chromium` project then starts already signed in.
 */
import { test as setup, expect } from '@playwright/test'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { createClerkClient } from '@clerk/backend'
import fs from 'fs'
import { ADMIN, ADMIN_STATE, AUTH_DIR, assertSafeTarget } from './env'

setup.describe.configure({ mode: 'serial' })

setup('target is not production', () => {
  assertSafeTarget()
})

setup('get Clerk testing token', async () => {
  await clerkSetup()
})

setup('test admin exists in Clerk', async () => {
  const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  const existing = await client.users.getUserList({ emailAddress: [ADMIN.email] })
  if (existing.data.length === 0) {
    await client.users.createUser({
      emailAddress: [ADMIN.email],
      firstName: ADMIN.firstName,
      lastName: ADMIN.lastName,
      skipPasswordRequirement: true,
    })
  }
})

setup('sign in and save session', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  // clerk.signIn needs a public page that loads Clerk first.
  await page.goto('/sign-in')
  await clerk.signIn({ page, emailAddress: ADMIN.email })

  await page.goto('/dashboard')

  // First run for a fresh user: Terms acceptance, then workspace creation.
  // Later runs land straight on the dashboard.
  await page.waitForURL(/\/(dashboard|accept-terms|onboarding)/)

  if (page.url().includes('/accept-terms')) {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForURL(url => !url.pathname.startsWith('/accept-terms'))
    if (!page.url().includes('/onboarding')) await page.goto('/dashboard')
  }

  await page.waitForURL(/\/(dashboard|onboarding)/)
  if (page.url().includes('/onboarding')) {
    await page.getByPlaceholder('e.g., Acme Corp').fill(ADMIN.company)
    await page.getByRole('button', { name: 'Create workspace' }).click()
  }

  await page.waitForURL(/\/dashboard/)
  await expect(page).toHaveURL(/\/dashboard/)

  await page.context().storageState({ path: ADMIN_STATE })
})

// `next dev` compiles each route on first visit (over a minute after big
// edits). Compile the main routes once here so the real tests time pages,
// not the compiler. Harmless against a production build.
setup('warm up routes', async ({ page }) => {
  setup.setTimeout(600_000)
  await page.context().addCookies(JSON.parse(fs.readFileSync(ADMIN_STATE, 'utf8')).cookies)
  for (const route of ['/', '/templates', '/fillndahtml', '/settings', '/settings/team']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
  }
})
