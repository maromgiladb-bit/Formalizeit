import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, planFromPriceId } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // Ignore other events — return 200 so Stripe doesn't retry
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

type DbBillingStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED'

// As of the 2026-04-22.dahlia API, current_period_end is no longer on the
// Subscription object — it lives on each subscription item. For our single-item
// plans the first item's value is the subscription's period end.
function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null
}

const SUBSCRIPTION_STATUS_MAP: Record<string, DbBillingStatus> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST_DUE',
  canceled: 'CANCELLED',
  unpaid: 'PAST_DUE',
  incomplete: 'PAST_DUE',
  incomplete_expired: 'CANCELLED',
  paused: 'PAST_DUE',
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId
  if (!organizationId) {
    console.error('checkout.session.completed: missing organizationId in metadata')
    return
  }

  if (!session.subscription) return

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!organization) {
    console.error('checkout.session.completed: no org found for id', organizationId)
    return
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const billingStatus: DbBillingStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] ?? 'PAST_DUE'
  const periodEnd = getCurrentPeriodEnd(subscription)
  const priceId = subscription.items.data[0]?.price.id ?? null

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      billingPlan: planFromPriceId(priceId) ?? 'PRO',
      billingStatus,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId

  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findUnique({ where: { stripeSubscriptionId: subscription.id } })

  if (!organization) {
    console.error('customer.subscription.updated: no org found for subscription', subscription.id)
    return
  }

  const billingStatus: DbBillingStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] ?? 'PAST_DUE'

  // Keep PRO access while Stripe is retrying (past_due, unpaid, incomplete, paused).
  // Downgrade to FREE only when the subscription reaches a terminal state (canceled/incomplete_expired),
  // which is handled here or via handleSubscriptionDeleted.
  const gracePlanStatuses = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'])
  const isActivePlan = gracePlanStatuses.has(subscription.status)
  const periodEnd = getCurrentPeriodEnd(subscription)
  const priceId = subscription.items.data[0]?.price.id ?? null

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      billingPlan: isActivePlan ? (planFromPriceId(priceId) ?? 'PRO') : 'FREE',
      billingStatus,
      stripePriceId: isActivePlan ? priceId : null,
      stripeCurrentPeriodEnd: isActivePlan && periodEnd ? new Date(periodEnd * 1000) : null,
      stripeSubscriptionId: isActivePlan ? undefined : null,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId

  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : await prisma.organization.findUnique({ where: { stripeSubscriptionId: subscription.id } })

  if (!organization) {
    // May have already been cleaned up by customer.subscription.updated on terminal status
    console.warn('customer.subscription.deleted: no org found for subscription', subscription.id)
    return
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      billingPlan: 'FREE',
      billingStatus: 'CANCELLED',
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      // stripeCustomerId is kept — reused if user re-subscribes
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const organization = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!organization) {
    console.error('invoice.payment_failed: no org found for customer', customerId)
    return
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: { billingStatus: 'PAST_DUE' },
  })
}
