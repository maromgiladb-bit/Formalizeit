import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmail, recipientEditEmailHtml, getAppUrl } from '@/lib/email'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { htmlToPdf } from '@/lib/htmlToPdf'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSendNDA } from '@/lib/organizationRoles'
import { assertCanSendNda } from '@/organizations/limits'

export const runtime = 'nodejs' // Required for Puppeteer

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { draftId, signerEmail, signerRole } = body

    if (!draftId || !signerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    if (!EMAIL_REGEX.test(signerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
    }

    if (!canSendNDA(activeMembership)) {
      return NextResponse.json({ error: 'You do not have permission to send NDAs.' }, { status: 403 })
    }

    await assertCanSendNda(activeMembership.organizationId)

    const existingDraft = await prisma.ndaDraft.findFirst({
      where: {
        id: draftId,
        organizationId: activeMembership.organizationId
      }
    })

    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Update draft status to SENT
    const draft = await prisma.ndaDraft.update({
      where: {
        id: draftId,
      },
      data: { status: 'SENT' }
    })

    // Create sign request
    const token = randomBytes(32).toString('hex')
    // const expiresAt = new Date()
    // expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    const signRequest = await prisma.signRequest.create({
      data: {
        organizationId: draft.organizationId,
        draftId: draftId,
        createdByUserId: user.id,
        status: 'SENT',
      }
    })

    // Create signer record
    const signer = await prisma.signer.create({
      data: {
        signRequestId: signRequest.id,
        email: signerEmail,
        role: 'SIGNER', // Default role mapping needed if 'Party B' passed
        status: 'PENDING'
      }
    })

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        organizationId: draft.organizationId,
        draftId: draft.id,
        userId: user.id,
        eventType: 'SENT',
        metadata: {
          recipient_email: signerEmail,
          recipient_role: signerRole || 'Party B'
        }
      }
    })

    // Send email notification to signer (without PDF attachment - PDF will be attached only in final completion email)
    const signLink = `${getAppUrl()}/review-nda/${token}`
    console.log('📧 Preparing to send email to:', signerEmail)
    console.log('📧 Review link:', signLink)
    console.log('📧 Draft title:', draft.title)

    try {
      const draftContent = (draft.content as Record<string, unknown>) || {}
      const partyACompany = (draftContent.party_a_name as string) || activeMembership.organization.name
      await sendEmail({
        to: signerEmail,
        subject: `${user.name || user.email} from ${partyACompany} sent you an NDA to review`,
        html: recipientEditEmailHtml(
          draft.title || 'Untitled NDA',
          signLink,
          'Please review the NDA document. Click the link below to access the agreement, review your information, and sign the document. No account required.'
        )
      })
      console.log('✅ Email sent successfully')
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError)
      console.error('❌ Email error details:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      draft,
      signer,
      signRequest: {
        token,
        link: `/review-nda/${token}`
      }
    })
  } catch (error) {
    console.error('Send for signature error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to send for signature'
    }, { status: 500 })
  }
}