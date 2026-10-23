import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Paid plans off (free beta). The routes must refuse before touching Stripe.
vi.mock('@/lib/featureFlags', () => ({ PAID_PLANS_ENABLED: false, BETA_LABEL: true, FORMI_ENABLED: false }))

const stripe = vi.hoisted(() => ({
  getStripe: vi.fn(),
  isStripeConfigured: vi.fn(() => true),
  priceIdFor: vi.fn(),
}))
vi.mock('@/lib/stripe', () => stripe)
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'u1' })) }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/db-organization', () => ({ getActiveOrganization: vi.fn() }))
vi.mock('@/lib/email', () => ({ getAppUrl: () => 'http://localhost' }))

import { POST as checkout } from '../checkout/route'
import { POST as upgrade } from '../upgrade-session/route'
import { POST as downgrade } from '../downgrade/route'

describe('billing routes that start a paid plan, during the free beta', () => {
  for (const [name, handler] of [['checkout', checkout], ['upgrade-session', upgrade], ['downgrade', downgrade]] as const) {
    it(`${name} returns 403 PAID_PLANS_DISABLED without calling Stripe`, async () => {
      const res = await handler(new NextRequest('http://localhost/api/billing/x', { method: 'POST', body: '{}' }))
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({
        error: "Paid plans aren't available during the beta.",
        code: 'PAID_PLANS_DISABLED',
      })
      expect(stripe.getStripe).not.toHaveBeenCalled()
    })
  }
})
