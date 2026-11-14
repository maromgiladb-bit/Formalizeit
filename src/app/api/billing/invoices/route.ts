import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { billingUnavailableResponse } from '@/lib/billing-unavailable'
import { isOrganizationOwner } from '@/lib/organizationRoles'

export async function GET() {
  if (!isStripeConfigured()) return billingUnavailableResponse()

  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) return NextResponse.json({ invoices: [] })

    if (!isOrganizationOwner(activeMembership.role)) {
      return NextResponse.json({ error: 'Only administrators can view billing' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: activeMembership.organizationId },
    })

    if (!organization?.stripeCustomerId) return NextResponse.json({ invoices: [] })

    const result = await getStripe().invoices.list({
      customer: organization.stripeCustomerId,
      limit: 12,
    })

    return NextResponse.json({
      invoices: result.data.map(inv => ({
        id: inv.id,
        number: inv.number,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        date: inv.created,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
      })),
    })
  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json({ invoices: [] })
  }
}
