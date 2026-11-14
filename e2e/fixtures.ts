/**
 * Shared Playwright `test` for every spec. Import `test`/`expect` from here,
 * not from '@playwright/test'.
 *
 * Stubs Vercel Web Analytics: `@vercel/analytics` loads
 * /_vercel/insights/script.js, which only exists on Vercel. Locally the
 * request falls through to the 404 page and returns a 500 (the root layout
 * calls Clerk's auth() on a path the middleware matcher skips), which would
 * show up as console errors on every page.
 */
import { test as base, expect } from '@playwright/test'

export const test = base.extend<{ stubVercel: void }>({
  stubVercel: [
    async ({ context }, use) => {
      await context.route('**/_vercel/**', route =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
      )
      await use()
    },
    { auto: true },
  ],
})

export { expect }
