/**
 * End-to-end NDA flow, sender side → receiver side.
 *
 *  1. Signed-in admin picks the template and fills every required field
 *     across the wizard steps (Document → Party A → Party B → Terms → Review).
 *  2. "Send NDA" → "Create secure link". The link is read from the
 *     /api/ndas/send-for-review response (initial send is links-only; the
 *     platform does not email it).
 *  3. A fresh, signed-out browser context opens the link as the receiver.
 *
 * Screenshots of every step land in e2e/.results/screens/flow-*.png.
 */
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'
import fs from 'fs'
import { RECEIVER_EMAIL } from './env'

const RUN_ID = Date.now().toString(36)
const NDA = {
  title: `E2E NDA ${RUN_ID}`,
  term: '12',
  confidentiality: '24',
  partyA: { name: 'E2E Test Co', address: '1 Test Street, Tel Aviv', signatory: 'E2E Admin', title: 'CEO' },
  partyB: { name: `Receiver Ltd ${RUN_ID}`, address: '2 Example Road, London', signatory: 'Rita Receiver', title: 'COO' },
  purpose: 'evaluating a potential business relationship',
  governingLaw: 'State of Israel',
  ip: 'Each party keeps ownership of its own intellectual property.',
  nonSolicit: 'No solicitation of employees for 12 months.',
  exclusivity: 'No exclusivity.',
}

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `e2e/.results/screens/flow-${name}.png`, fullPage: true })

async function next(page: Page) {
  await page.getByRole('button', { name: /^Next/ }).click()
}

test('sender fills and sends an NDA; receiver opens the secure link', async ({ page, browser }) => {
  let reviewLink = ''

  await test.step('open the standard NDA template', async () => {
    await page.goto('/templates')
    // With exactly one template (the MVP), /templates skips straight to the
    // fill page. With several, pick the first card.
    const useTemplate = page.getByRole('button', { name: 'Use This Template' }).first()
    await expect(page.getByRole('heading', { name: 'Document Details' }).or(useTemplate)).toBeVisible()
    if (await useTemplate.isVisible()) {
      await shot(page, '01-templates')
      await useTemplate.click()
    }
    await page.waitForURL(/\/fillndahtml\?/)
    await expect(page.getByRole('heading', { name: 'Document Details' })).toBeVisible()
  })

  await test.step('step 1: document details', async () => {
    await page.getByPlaceholder('e.g., Partnership NDA 2025').fill(NDA.title)
    await page.getByPlaceholder('e.g., 12').fill(NDA.term)
    await page.getByPlaceholder('e.g., 24').fill(NDA.confidentiality)
    await shot(page, '02-document')
    await next(page)
  })

  await test.step('step 2: party A (our company)', async () => {
    await page.getByPlaceholder('Enter party name').fill(NDA.partyA.name)
    await page.getByPlaceholder('Enter full address').fill(NDA.partyA.address)
    await page.getByPlaceholder('Full name').fill(NDA.partyA.signatory)
    await page.getByPlaceholder('e.g., CEO, Director').fill(NDA.partyA.title)
    await shot(page, '03-party-a')
    await next(page)
  })

  await test.step('step 3: party B (receiver)', async () => {
    await page.getByPlaceholder('Enter party name').fill(NDA.partyB.name)
    await page.getByPlaceholder('Enter full address').fill(NDA.partyB.address)
    await page.getByPlaceholder('Full name').fill(NDA.partyB.signatory)
    await page.getByPlaceholder('e.g., CEO, Director').fill(NDA.partyB.title)
    await page.getByPlaceholder('email@example.com').fill(RECEIVER_EMAIL)
    await shot(page, '04-party-b')
    await next(page)
  })

  await test.step('step 4: terms', async () => {
    await page.getByPlaceholder('e.g., evaluating a potential business relationship').fill(NDA.purpose)
    await page.getByPlaceholder('e.g., State of California').fill(NDA.governingLaw)
    await page.getByPlaceholder('Specify intellectual property ownership terms...').fill(NDA.ip)
    await page.getByPlaceholder('Define non-solicitation terms...').fill(NDA.nonSolicit)
    await page.getByPlaceholder('Specify exclusivity arrangements...').fill(NDA.exclusivity)
    await shot(page, '05-terms')
    await next(page)
  })

  await test.step('step 5: review shows what we entered', async () => {
    await expect(page.getByRole('heading', { name: 'Review Your NDA' })).toBeVisible()
    await expect(page.getByText(NDA.title)).toBeVisible()
    await expect(page.getByText(NDA.partyB.name).first()).toBeVisible()
    await shot(page, '06-review')
  })

  await test.step('send: create the secure link', async () => {
    await page.getByRole('button', { name: 'Send NDA' }).click()
    const recipient = page.getByPlaceholder('recipient@example.com')
    await expect(recipient).toHaveValue(RECEIVER_EMAIL)

    const sendResponse = page.waitForResponse(r => r.url().includes('/api/ndas/send-for-review') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Create secure link' }).click()
    const res = await sendResponse
    const body = (await res.json()) as { reviewLink?: string; error?: string }
    expect(res.status(), `send-for-review failed: ${body.error ?? ''}`).toBe(200)
    expect(body.reviewLink, 'reviewLink in response').toBeTruthy()
    reviewLink = body.reviewLink!

    await expect(page.getByText('Secure link ready')).toBeVisible()
    await shot(page, '07-link-ready')
  })

  await test.step('dashboard lists the sent NDA', async () => {
    await page.goto('/dashboard')
    await expect(page.getByText(NDA.title).first()).toBeVisible()
    await shot(page, '08-dashboard-sent')
  })

  await test.step('receiver opens the secure link signed out', async () => {
    const receiverCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const receiver = await receiverCtx.newPage()
    // The link is built from APP_URL; open the same path on the server under test.
    const url = new URL(reviewLink)
    await receiver.goto(url.pathname + url.search)
    await receiver.waitForLoadState('load')
    await expect(receiver, 'receiver must not be sent to sign-in').not.toHaveURL(/\/sign-in/)
    // The NDA preview renders in an iframe; the page header carries the title.
    await expect(receiver.getByText(NDA.title).first()).toBeVisible()
    await expect(receiver.getByText('Secure link')).toBeVisible()
    await receiver.screenshot({ path: 'e2e/.results/screens/flow-09-receiver.png', fullPage: true })
    // Accessibility snapshot of the receiver page, used to extend this test to the signing step.
    fs.writeFileSync('e2e/.results/receiver-page.yml', await receiver.locator('body').ariaSnapshot())
    await receiverCtx.close()
  })
})
