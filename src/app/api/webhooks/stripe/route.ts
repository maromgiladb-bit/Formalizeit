import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, planFromPriceId } from '@/lib/stripe'
import { sendEmail, subscriptionCancelledEmailHtml, getAppUrl } from '@/lib/email'
import {
  SUBSCRIPTION_STATUS_MAP,
  getCurrentPeriodEnd,
  subscriptionToOrgData,
  type DbBillingStatus,
} from '@/billing/reconcileSubscription'

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
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
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

  await prisma.organization.update({
    where: { id: organization.id },
    data: { billingStatus: 'PAST_DUE' },
  })
}
