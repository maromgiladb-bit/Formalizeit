import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
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

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      billingPlan: 'PRO',
      billingStatus: 'ACTIVE',
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organization = await prisma.organization.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!organization) {
    console.error('customer.subscription.updated: no org found for subscription', subscription.id)
    return
  }

  type DbBillingStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED'
  const statusMap: Record<string, DbBillingStatus> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELLED',
    unpaid: 'PAST_DUE',
  }

  const billingStatus: DbBillingStatus = statusMap[subscription.status] ?? 'ACTIVE'

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      billingPlan: subscription.status === 'canceled' ? 'FREE' : 'PRO',
      billingStatus,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organization = await prisma.organization.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!organization) {
    console.error('customer.subscription.deleted: no org found for subscription', subscription.id)
    return
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      billingPlan: 'FREE',
      billingStatus: 'ACTIVE',
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
