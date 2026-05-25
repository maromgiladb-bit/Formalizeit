import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { stripe } from '@/lib/stripe'
import { isOrganizationOwner } from '@/lib/organizationRoles'

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
      return NextResponse.json({ error: 'Only organization owners can manage billing' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!organization.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL is not set' },
          { status: 500 }
        )
      }
    }
    const resolvedAppUrl = appUrl ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${resolvedAppUrl}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
