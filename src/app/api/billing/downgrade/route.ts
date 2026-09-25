import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { stripe, priceIdFor } from '@/lib/stripe'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-price-ids'
import { isOrganizationOwner } from '@/lib/organizationRoles'
import { getAppUrl } from '@/lib/email'

// Creates a Stripe billing portal session with the subscription_update_confirm
// flow to downgrade TEAM → PRO in-place. Mirrors the PRO → TEAM upgrade flow in
// upgrade-session/route.ts. Administrator-only.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) return NextResponse.json({ error: 'No active organization' }, { status: 404 })

    if (!isOrganizationOwner(activeMembership.role)) {
      return NextResponse.json({ error: 'Only administrators can manage billing' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })
    if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    if (organization.billingPlan !== 'TEAM' || organization.billingStatus === 'CANCELLED') {
      return NextResponse.json({ error: 'Only active TEAM plans can be downgraded to PRO' }, { status: 400 })
    }
    if (!organization.stripeSubscriptionId || !organization.stripeCustomerId) {
      return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 400 })
    }

    // Keep the current billing cycle unless overridden.
    const currentCycle: 'monthly' | 'annual' =
      organization.stripePriceId === STRIPE_PRICE_IDS.TEAM_ANNUAL ? 'annual' : 'monthly'
    const body = await req.json().catch(() => ({}))
    const billingCycle: 'monthly' | 'annual' = body.billingCycle === 'annual' || body.billingCycle === 'monthly'
      ? body.billingCycle
      : currentCycle
    const proPriceId = priceIdFor('PRO', billingCycle)

    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
    const item = subscription.items.data[0]
    if (!item) return NextResponse.json({ error: 'No subscription item found' }, { status: 400 })

    const appUrl = getAppUrl()

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
      flow_data: {
        type: 'subscription_update_confirm',
        after_completion: {
          type: 'redirect',
          redirect: { return_url: `${appUrl}/settings/billing` },
        },
        subscription_update_confirm: {
          subscription: organization.stripeSubscriptionId,
          items: [{ id: item.id, price: proPriceId, quantity: 1 }],
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Downgrade session error:', error)
    return NextResponse.json({ error: 'Failed to create downgrade session' }, { status: 500 })
  }
}
