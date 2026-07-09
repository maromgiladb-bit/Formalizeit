import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { stripe, priceIdFor, type PaidPlan } from '@/lib/stripe'
import { isOrganizationOwner } from '@/lib/organizationRoles'
import { getAppUrl } from '@/lib/email'

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Only organization owners can manage billing' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const billingCycle: 'monthly' | 'annual' = body.billingCycle === 'annual' ? 'annual' : 'monthly'
    const plan: PaidPlan = body.plan === 'TEAM' ? 'TEAM' : 'PRO'

    // Block if there is already an active paid subscription.
    // A cancelled subscription is treated as FREE so re-subscribing is allowed.
    // PRO → TEAM upgrades go through /api/billing/upgrade-session (portal flow), not here.
    const hasActivePaidSubscription =
      (organization.billingPlan === 'PRO' || organization.billingPlan === 'TEAM' || organization.billingPlan === 'ENTERPRISE') &&
      organization.billingStatus !== 'CANCELLED'

    if (hasActivePaidSubscription) {
      return NextResponse.json({ error: 'Already on an active paid plan' }, { status: 400 })
    }
    const priceId = priceIdFor(plan, billingCycle)

    // Get or create Stripe customer
    let stripeCustomerId = organization.stripeCustomerId

    if (!stripeCustomerId) {
      // Look up owner email from the organization owner
      const owner = await prisma.user.findUnique({
        where: { id: organization.ownerUserId },
        select: { email: true, name: true },
      })

      const customer = await stripe.customers.create({
        email: owner?.email ?? undefined,
        name: owner?.name ?? organization.name,
        metadata: { organizationId: organization.id },
      })

      stripeCustomerId = customer.id

      // Persist immediately so a second interrupted checkout reuses this customer
      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId },
      })
    }

    const resolvedAppUrl = getAppUrl()
    const embedded = body.embedded === true

    const commonParams = {
      customer: stripeCustomerId,
      mode: 'subscription' as const,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { organizationId: organization.id },
      subscription_data: { metadata: { organizationId: organization.id } },
      allow_promotion_codes: true,
    }

    if (embedded) {
      const session = await stripe.checkout.sessions.create({
        ...commonParams,
        ui_mode: 'embedded_page',
        return_url: `${resolvedAppUrl}/dashboard?checkout=success`,
      })
      if (!session.client_secret) {
        console.error('Stripe embedded checkout session returned no client_secret')
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
      }
      return NextResponse.json({ clientSecret: session.client_secret })
    }

    const session = await stripe.checkout.sessions.create({
      ...commonParams,
      ui_mode: 'hosted_page',
      success_url: `${resolvedAppUrl}/dashboard?checkout=success`,
      cancel_url: `${resolvedAppUrl}/plans`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
