import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { stripe } from '@/lib/stripe'
import { isOrganizationOwner } from '@/lib/organizationRoles'

/**
 * Cancel the company subscription at the end of the current billing period.
 * Access is kept until then; the plan drops to Free once the period ends
 * (handled by the subscription webhooks). Administrator-only.
 *
 * POST /api/billing/cancel
 */
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 })
    }

    if (!isOrganizationOwner(activeMembership.role)) {
      return NextResponse.json({ error: 'Only administrators can manage billing' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    if (!organization.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.update(organization.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    // Optimistically reflect the pending cancellation; the webhook confirms it.
    await prisma.organization.update({
      where: { id: organization.id },
      data: { cancelAtPeriodEnd: true },
    })

    const periodEnd = subscription.items.data[0]?.current_period_end ?? null
    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
