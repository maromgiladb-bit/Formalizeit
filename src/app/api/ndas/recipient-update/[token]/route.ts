/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { diffForms, listChanges, formatFieldPath } from '@/lib/diff'
import { sendEmail, ownerReviewEmailHtml, getAppUrl } from '@/lib/email'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { htmlToPdf } from '@/lib/htmlToPdf'
import { randomBytes } from 'crypto'

interface Comment {
  text: string
}

interface RequestBody {
  form_data: Record<string, unknown>
  message?: string
  submitAndSign?: boolean
  comments?: Record<string, Comment[]>
}

export async function PATCH(
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
                revisions: true
              }
            }
          }
        }
      }
    })

    if (!signRequest) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (signRequest.consumed_at) {
      return NextResponse.json({ error: 'Token already consumed' }, { status: 400 })
    }

    if (new Date() > signRequest.expires_at) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    if (signRequest.scope !== 'EDIT' && signRequest.scope !== 'SIGN') {
      return NextResponse.json({ error: 'Invalid token scope for editing' }, { status: 403 })
    }

    const draft = signRequest.signers.nda_drafts
    
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'SENT' && draft.status !== 'NEEDS_RECIPIENT_CHANGES') {
      return NextResponse.json(
        { error: 'Draft is not in a state that allows recipient updates' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json() as RequestBody
    const { form_data, message, submitAndSign, comments } = body

    if (!form_data) {
      return NextResponse.json({ error: 'form_data is required' }, { status: 400 })
    }

    // Compute diff
    const baseForm = (draft.data as Record<string, unknown>) || {}
    const newForm = form_data
    const diff = diffForms(baseForm, newForm)
    const changes = listChanges(diff)

    // Get next revision number
    const revNum = draft.revisions.length + 1

    // Prepare comments JSON
    const commentsJson: Record<string, Array<{ author: string; text: string; ts: string }>> = {}
    if (comments) {
      for (const [path, commentArray] of Object.entries(comments)) {
        commentsJson[path] = commentArray.map(c => ({
          author: 'RECIPIENT',
          text: c.text,
          ts: new Date().toISOString()
        }))
      }
    }

    // Create revision
    await prisma.nda_revisions.create({
      data: {
        draft_id: draft.id,
        number: revNum,
        actor_role: 'RECIPIENT',
        base_form: baseForm as any,
        new_form: newForm as any,
        diff: diff as any,
        comments: commentsJson as any,
        message: message || null
      }
    })

    // Update draft
    const updateData = {
      data: newForm as any,
      status: 'PENDING_OWNER_REVIEW' as const,
      last_actor: 'RECIPIENT' as const,
      updated_at: new Date()
    }

    if (submitAndSign) {
      Object.assign(updateData, { provisional_recipient_signed_at: new Date() })
    }

    await prisma.nda_drafts.update({
      where: { id: draft.id },
      data: updateData
    })

    // Create owner review token
    const reviewToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Find or create owner signer
    let ownerSigner = await prisma.signers.findFirst({
      where: {
        draft_id: draft.id,
        user_id: draft.created_by_id
      }
    })

    if (!ownerSigner) {
      ownerSigner = await prisma.signers.create({
        data: {
          draft_id: draft.id,
          email: draft.users.email,
          role: 'OWNER',
          status: 'PENDING',
          user_id: draft.created_by_id
        }
      })
    }

    await prisma.sign_requests.create({
      data: {
        signer_id: ownerSigner.id,
        token: reviewToken,
        scope: 'REVIEW',
        payload: { revision_number: revNum },
        expires_at: expiresAt
      }
    })

    // Create audit event
    await prisma.audit_events.create({
      data: {
        organization_id: draft.organization_id,
        draft_id: draft.id,
        type: 'RECIPIENT_SUBMITTED_CHANGES',
        meta: {
          revision_number: revNum,
          changes_count: changes.length,
          submit_and_sign: submitAndSign
        }
      }
    })

    // Send email to owner (without PDF attachment - PDF will be attached only in final completion email)
    const reviewLink = `${getAppUrl()}/review/${reviewToken}`
    const changesSummary = changes.map(c => ({
      field: formatFieldPath(c.path),
      before: String(c.before || ''),
      after: String(c.after || '')
    }))

    await sendEmail({
      to: draft.users.email,
      subject: `Review requested: changes to ${draft.title} (R${revNum})`,
      html: ownerReviewEmailHtml(draft.title || 'Untitled NDA', revNum, reviewLink, changesSummary)
    })

    return NextResponse.json({
      ok: true,
      revision: revNum,
      status: updateData.status
    })

  } catch (error) {
    console.error('Error in recipient update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
