import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { stripe } from '@/lib/stripe'
import { isOrganizationOwner } from '@/lib/organizationRoles'
import { subscriptionToOrgData } from '@/billing/reconcileSubscription'

/**
 * Reconcile the active organization's billing columns with its live Stripe
 * subscription. Safety net for a missed `customer.subscription.updated` webhook
 * so the billing UI never shows stale state (e.g. a cancel/resubscribe that
 * didn't sync). Administrator-only. Best-effort: always returns 200 with
 * `{ synced }` and never throws to the caller — the page falls back to whatever
 * the DB already holds.
 *
 * POST /api/billing/sync
 */
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ synced: false }, { status: 401 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ synced: false })
    }

    // Only administrators manage billing; everyone else just skips the reconcile.
    if (!isOrganizationOwner(activeMembership.role)) {
      return NextResponse.json({ synced: false })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })
    if (!organization?.stripeSubscriptionId) {
      return NextResponse.json({ synced: false })
    }

    // A canceled subscription is still retrievable and maps to FREE/CANCELLED,
    // so this also self-heals a missed deletion webhook.
    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
    await prisma.organization.update({
      where: { id: organization.id },
      data: subscriptionToOrgData(subscription),
    })

    return NextResponse.json({ synced: true })
  } catch (error) {
    console.error('Billing sync error:', error)
    // Non-fatal — the billing page renders from the existing DB state.
    return NextResponse.json({ synced: false })
  }
}
