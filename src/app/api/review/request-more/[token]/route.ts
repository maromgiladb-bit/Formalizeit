import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, recipientEditEmailHtml, getAppUrl } from '@/lib/email'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { htmlToPdf } from '@/lib/htmlToPdf'
import { randomBytes } from 'crypto'

interface RequestBody {
  message: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const token = params.token

    // Validate token
    const signRequest = await prisma.sign_requests.findUnique({
      where: { token },
      include: {
        signers: {
          include: {
            nda_drafts: {
              include: {
                users: true,
                signers: true
              }
            }
          }
        }
      }
    })

    if (!signRequest) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (new Date() > signRequest.expires_at) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    if (signRequest.scope !== 'REVIEW') {
      return NextResponse.json({ error: 'Invalid token scope' }, { status: 403 })
    }

    const draft = signRequest.signers.nda_drafts

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'PENDING_OWNER_REVIEW') {
      return NextResponse.json(
        { error: 'Draft is not pending owner review' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json() as RequestBody
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Update draft status
    await prisma.nda_drafts.update({
      where: { id: draft.id },
      data: {
        status: 'NEEDS_RECIPIENT_CHANGES',
        last_actor: 'OWNER',
        provisional_recipient_signed_at: null, // Clear provisional signature
        updated_at: new Date()
      }
    })

    // Find recipient signer
    const recipientSigner = draft.signers.find(s => s.user_id !== draft.created_by_id)

    if (!recipientSigner) {
      return NextResponse.json({ error: 'Recipient signer not found' }, { status: 404 })
    }

    // Create new recipient EDIT token
    const editToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.sign_requests.create({
      data: {
        signer_id: recipientSigner.id,
        token: editToken,
        scope: 'EDIT',
        expires_at: expiresAt
      }
    })

    // Create audit event
    await prisma.audit_events.create({
      data: {
        organization_id: draft.organization_id,
        draft_id: draft.id,
        actor_user_id: draft.created_by_id,
        type: 'OWNER_REQUESTED_CHANGES',
        meta: { message }
      }
    })

    // Send email to recipient (without PDF attachment - PDF will be attached only in final completion email)
    const editLink = `${getAppUrl()}/sign/${editToken}`

    await sendEmail({
      to: recipientSigner.email,
      subject: `Changes requested on your NDA – ${draft.title}`,
      html: recipientEditEmailHtml(draft.title || 'Untitled NDA', editLink, message)
    })

    return NextResponse.json({
      ok: true,
      status: 'NEEDS_RECIPIENT_CHANGES'
    })

  } catch (error) {
    console.error('Error requesting more changes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
