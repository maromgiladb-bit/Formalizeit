import { describe, it, expect } from 'vitest'
import type Stripe from 'stripe'
import { subscriptionToOrgData } from '../reconcileSubscription'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-price-ids'

const PERIOD_END = 1_784_710_769 // unix seconds

function makeSub(overrides: {
  status: Stripe.Subscription.Status
  cancelAtPeriodEnd: boolean
  priceId?: string
}): Stripe.Subscription {
  return {
    status: overrides.status,
    cancel_at_period_end: overrides.cancelAtPeriodEnd,
    items: {
      data: [
        {
          current_period_end: PERIOD_END,
          price: { id: overrides.priceId ?? STRIPE_PRICE_IDS.TEAM_ANNUAL },
        },
      ],
    },
  } as unknown as Stripe.Subscription
}

// Note: the specific paid plan (PRO vs TEAM) is derived from Stripe price-ID env
// vars that aren't present under test, so these assert the env-independent
// invariants: the cancel flag, status mapping, and paid-vs-FREE gating.
describe('subscriptionToOrgData', () => {
  it('clears cancelAtPeriodEnd when an active subscription is resumed (the resubscribe bug)', () => {
    const data = subscriptionToOrgData(makeSub({ status: 'active', cancelAtPeriodEnd: false }))
    expect(data.cancelAtPeriodEnd).toBe(false)
    expect(data.billingStatus).toBe('ACTIVE')
    expect(data.billingPlan).not.toBe('FREE')
    expect(data.stripeCurrentPeriodEnd).toEqual(new Date(PERIOD_END * 1000))
  })

  it('reflects a pending cancel while still active', () => {
    const data = subscriptionToOrgData(makeSub({ status: 'active', cancelAtPeriodEnd: true }))
    expect(data.cancelAtPeriodEnd).toBe(true)
    expect(data.billingStatus).toBe('ACTIVE')
  })

  it('keeps a paid plan while payment is retrying (past_due)', () => {
    const data = subscriptionToOrgData(makeSub({ status: 'past_due', cancelAtPeriodEnd: false }))
    expect(data.billingStatus).toBe('PAST_DUE')
    expect(data.billingPlan).not.toBe('FREE')
  })

  it('drops to FREE and clears billing fields on a terminal (canceled) status', () => {
    const data = subscriptionToOrgData(makeSub({ status: 'canceled', cancelAtPeriodEnd: false }))
    expect(data.billingPlan).toBe('FREE')
    expect(data.billingStatus).toBe('CANCELLED')
    expect(data.stripePriceId).toBeNull()
    expect(data.stripeCurrentPeriodEnd).toBeNull()
    expect(data.stripeSubscriptionId).toBeNull()
    expect(data.cancelAtPeriodEnd).toBe(false)
  })
})
