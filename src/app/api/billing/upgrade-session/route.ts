import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { stripe, priceIdFor } from '@/lib/stripe'
import { isOrganizationOwner } from '@/lib/organizationRoles'

// Creates a Stripe billing portal session with subscription_update_confirm flow.
// This upgrades PRO → TEAM in-place (proration), keeps PRO access until payment
// confirms, and opens Stripe's hosted payment UI.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) return NextResponse.json({ error: 'No active organization' }, { status: 404 })

    if (!isOrganizationOwner(activeMembership.role)) {
      return NextResponse.json({ error: 'Only organization owners can manage billing' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })

    if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    if (organization.billingPlan !== 'PRO' || organization.billingStatus === 'CANCELLED') {
      return NextResponse.json({ error: 'Only active PRO plans can be upgraded to TEAM' }, { status: 400 })
    }

    if (!organization.stripeSubscriptionId || !organization.stripeCustomerId) {
      return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const billingCycle: 'monthly' | 'annual' = body.billingCycle === 'annual' ? 'annual' : 'monthly'
    const teamPriceId = priceIdFor('TEAM', billingCycle)

    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId)
    const item = subscription.items.data[0]
    if (!item) return NextResponse.json({ error: 'No subscription item found' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${appUrl}/dashboard?checkout=success`,
      flow_data: {
        type: 'subscription_update_confirm',
        after_completion: {
          type: 'redirect',
          redirect: { return_url: `${appUrl}/dashboard?checkout=success` },
        },
        subscription_update_confirm: {
          subscription: organization.stripeSubscriptionId,
          items: [{ id: item.id, price: teamPriceId, quantity: 1 }],
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Upgrade session error:', error)
    return NextResponse.json({ error: 'Failed to create upgrade session' }, { status: 500 })
  }
}
