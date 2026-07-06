import type Stripe from 'stripe'
import type { Prisma } from '@prisma/client'
import { planFromPriceId } from '@/lib/stripe-price-ids'

export type DbBillingStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED'

export const SUBSCRIPTION_STATUS_MAP: Record<string, DbBillingStatus> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST_DUE',
  canceled: 'CANCELLED',
  unpaid: 'PAST_DUE',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELLED',
  paused: 'PAST_DUE',
}

// Keep the paid plan while Stripe is retrying payment; drop to FREE only on a
// terminal state (canceled / incomplete_expired).
const GRACE_PLAN_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'])

// As of the 2026-04-22.dahlia API, current_period_end is no longer on the
// Subscription object — it lives on each subscription item. For our single-item
// plans the first item's value is the subscription's period end.
export function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null
}

/**
 * Map a live Stripe subscription onto the organization's billing columns.
 * Single source of truth shared by the `customer.subscription.updated` webhook
 * and the on-load reconcile route (`/api/billing/sync`) so the two can never
 * drift. Does not set `stripeSubscriptionId` while the plan is active (leaves it
 * unchanged) — first-time linkage happens at checkout.
 */
export function subscriptionToOrgData(subscription: Stripe.Subscription): Prisma.OrganizationUpdateInput {
  const billingStatus: DbBillingStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] ?? 'PAST_DUE'
  const isActivePlan = GRACE_PLAN_STATUSES.has(subscription.status)
  const periodEnd = getCurrentPeriodEnd(subscription)
  const priceId = subscription.items.data[0]?.price.id ?? null

  return {
    billingPlan: isActivePlan ? (planFromPriceId(priceId) ?? 'PRO') : 'FREE',
    billingStatus,
    stripePriceId: isActivePlan ? priceId : null,
    stripeCurrentPeriodEnd: isActivePlan && periodEnd ? new Date(periodEnd * 1000) : null,
    stripeSubscriptionId: isActivePlan ? undefined : null,
    cancelAtPeriodEnd: isActivePlan ? (subscription.cancel_at_period_end ?? false) : false,
  }
}
