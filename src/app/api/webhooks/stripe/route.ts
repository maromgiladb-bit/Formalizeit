import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { sendEmail, subscriptionCancelledEmailHtml, paymentFailedEmailHtml, getAppUrl } from '@/lib/email'
import {
  SUBSCRIPTION_STATUS_MAP,
  getCurrentPeriodEnd,
  subscriptionToOrgData,
  hasUnknownPlanPrice,
  type DbBillingStatus,
} from '@/billing/reconcileSubscription'
import { shouldApplySubscriptionEvent } from '@/billing/subscriptionGuards'

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

  // Idempotency: claim the event id before handling it. A redelivery hits the
  // primary key (P2002) and is acknowledged without being processed again.
  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      console.log(`Stripe event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('Failed to record Stripe event:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
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
    // Release the claim so Stripe's retry is processed rather than skipped as a
    // duplicate. (Simpler than a transaction: handlers also call Stripe and send
    // email, which a DB transaction could not roll back anyway.)
    await prisma.stripeEvent.delete({ where: { id: event.id } }).catch((delErr) => {
      console.error('Failed to release Stripe event claim:', delErr)
    })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
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

  // An unrecognised price means the live price IDs are misconfigured. Silently
  // defaulting to PRO here would provision a $50 TEAM customer on a $9 plan, so
  // throw instead: Stripe retries, and the failure is visible.
  const plan = planFromPriceId(priceId)
  if (!plan) {
    throw new Error(
      `checkout.session.completed: price ${priceId} maps to no plan. Check STRIPE_*_PRICE_ID env vars.`
    )
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      billingPlan: plan,
      billingStatus,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    },
  })
}

function reportSubscriptionMismatch(
  eventType: string,
  subscriptionId: string,
  organization: { id: string; stripeSubscriptionId: string | null }
) {
  console.warn(
    `${eventType}: subscription ${subscriptionId} does not match org ${organization.id} stored subscription ${organization.stripeSubscriptionId}; ignoring`
  )
  Sentry.captureMessage('Stripe subscription event for a non-current subscription ignored', {
    level: 'warning',
    tags: { area: 'stripe-webhook', eventType },
    extra: { subscriptionId, organizationId: organization.id, storedSubscriptionId: organization.stripeSubscriptionId },
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

  if (!shouldApplySubscriptionEvent(organization.stripeSubscriptionId, subscription.id)) {
    reportSubscriptionMismatch('customer.subscription.updated', subscription.id, organization)
    return
  }

  if (hasUnknownPlanPrice(subscription)) {
    console.error('customer.subscription.updated: price maps to no plan, keeping current plan', subscription.id)
    Sentry.captureMessage('Stripe subscription price maps to no plan (plan left unchanged)', {
      level: 'error',
      tags: { area: 'stripe-webhook' },
      extra: { subscriptionId: subscription.id, organizationId: organization.id },
    })
  }

  // Shared with the on-load reconcile route so cancel/resume/plan changes map
  // to the same columns whether they arrive via webhook or on-demand sync.
  await prisma.organization.update({
    where: { id: organization.id },
    data: subscriptionToOrgData(subscription),
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

  if (!shouldApplySubscriptionEvent(organization.stripeSubscriptionId, subscription.id)) {
    reportSubscriptionMismatch('customer.subscription.deleted', subscription.id, organization)
    return
  }

  // Stripe retries and redelivers events, and this handler is not otherwise
  // idempotent: without this check a redelivery re-sends the cancellation email
  // to a customer who already got it. The DB update below is safely repeatable.
  const alreadyCancelled =
    organization.billingStatus === 'CANCELLED' && organization.billingPlan === 'FREE'

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      billingPlan: 'FREE',
      billingStatus: 'CANCELLED',
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      // stripeCustomerId is kept — reused if user re-subscribes
    },
  })

  if (alreadyCancelled) {
    console.log('customer.subscription.deleted: already cancelled, skipping duplicate email')
    return
  }

  // "Sad to see you go" — best-effort email to the administrator on final cancellation.
  try {
    const owner = await prisma.user.findUnique({
      where: { id: organization.ownerUserId },
      select: { email: true },
    })
    if (owner?.email) {
      await sendEmail({
        to: owner.email,
        subject: 'Your Formalize It subscription has ended',
        html: subscriptionCancelledEmailHtml(organization.name, `${getAppUrl()}/settings/billing`),
      })
    }
  } catch (emailError) {
    console.error('Failed to send subscription-cancelled email:', emailError)
  }
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

  // Stripe emits this event on every retry of the same invoice, and redelivers events,
  // so only the first failure (the transition into PAST_DUE) emails the customer.
  const alreadyPastDue = organization.billingStatus === 'PAST_DUE'

  await prisma.organization.update({
    where: { id: organization.id },
    data: { billingStatus: 'PAST_DUE' },
  })

  if (alreadyPastDue) return

  try {
    const owner = await prisma.user.findUnique({
      where: { id: organization.ownerUserId },
      select: { email: true },
    })
    if (owner?.email) {
      await sendEmail({
        to: owner.email,
        subject: 'Action needed: your Formalize It payment failed',
        html: paymentFailedEmailHtml(organization.name, `${getAppUrl()}/settings/billing`),
      })
    }
  } catch (emailError) {
    console.error('Failed to send payment-failed email:', emailError)
  }
}
