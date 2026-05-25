import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { resolveLimits, getCurrentQuarterStart } from '@/billing/planLimits'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-price-ids'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const limits = resolveLimits(organization)

    const whereClause =
      limits.draftLimitPeriod === 'quarter'
        ? { organizationId: organization.id, sentAt: { gte: getCurrentQuarterStart() }, status: { in: ['SENT', 'SIGNED'] } }
        : { organizationId: organization.id, status: { in: ['SENT', 'SIGNED'] } }

    const ndaCount = await prisma.ndaDraft.count({ where: whereClause })

    const plan = organization.billingPlan
    const isUnlimited = !Number.isFinite(limits.maxActiveDrafts)
    const canSend = isUnlimited || ndaCount < limits.maxActiveDrafts

    const finiteLimit = isUnlimited ? null : limits.maxActiveDrafts

    return NextResponse.json({
      plan,
      ndaCount,
      limit: finiteLimit,
      canSend,
      remaining: finiteLimit === null ? null : Math.max(0, finiteLimit - ndaCount),
      draftLimitPeriod: limits.draftLimitPeriod,
      billingStatus: organization.billingStatus,
      stripeCurrentPeriodEnd: organization.stripeCurrentPeriodEnd?.toISOString() ?? null,
      hasStripeSubscription: !!organization.stripeSubscriptionId,
      billingCycle: organization.stripePriceId === STRIPE_PRICE_IDS.PRO_ANNUAL
        ? 'annual'
        : organization.stripePriceId
        ? 'monthly'
        : null,
    })
  } catch (error) {
    console.error('Check limit error:', error)
    return NextResponse.json({
      error: 'Failed to check limit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
