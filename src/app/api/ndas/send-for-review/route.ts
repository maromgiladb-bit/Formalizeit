import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, EmailAttachment } from '@/lib/email'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { renderHtmlToPdf } from '@/lib/htmlToPdf'
import { getActiveOrganization } from '@/lib/db-organization'
import { canApproveAndSend } from '@/lib/organizationRoles'
import { createNotification } from '@/lib/notifications'

/**
 * Send NDA for Party B review
 * Used to send NDA to Party B for review/editing before signatures
 * POST /api/ndas/send-for-review
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { draftId, recipientEmail, recipientName, message } = body

        if (!draftId || !recipientEmail) {
            return NextResponse.json({ error: 'Missing required fields: draftId, recipientEmail' }, { status: 400 })
        }

        // Get user
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

        if (!canApproveAndSend(activeMembership)) {
            return NextResponse.json({ error: 'Only approvers can send NDAs for review.' }, { status: 403 })
        }

        // Get draft and verify organization access
        const draft = await prisma.ndaDraft.findFirst({
            where: {
                id: draftId,
                organizationId: activeMembership.organizationId
            }
        })

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        // Extract form content
        const content = (draft.content as Record<string, unknown>) || {}

        // Check for existing SignRequest or create new one
        let signRequest = await prisma.signRequest.findFirst({
            where: { draftId: draftId },
            include: { signers: true }
        })

        let signer

        if (signRequest) {
            // Update existing signer or create if not exists
            signer = signRequest.signers.find(s => s.role === 'SIGNER')
            if (signer) {
                signer = await prisma.signer.update({
                    where: { id: signer.id },
                    data: {
                        email: recipientEmail,
                        name: recipientName || null,
                        status: 'PENDING'
                    }
                })
            } else {
                signer = await prisma.signer.create({
                    data: {
                        signRequestId: signRequest.id,
                        email: recipientEmail,
                        name: recipientName || null,
                        role: 'SIGNER',
                        status: 'PENDING'
                    }
                })
            }

            // Update sign request status
            await prisma.signRequest.update({
                where: { id: signRequest.id },
                data: { status: 'SENT' }
            })
        } else {
            // Create new SignRequest and Signers for BOTH parties
            signRequest = await prisma.signRequest.create({
                data: {
                    organizationId: draft.organizationId,
                    draftId: draftId,
                    createdByUserId: user.id,
                    status: 'SENT',
                },
                include: { signers: true }
            })

            // Create Party B (SIGNER) record
            signer = await prisma.signer.create({
                data: {
                    signRequestId: signRequest.id,
                    email: recipientEmail,
                    name: recipientName || null,
                    role: 'SIGNER',
                    status: 'PENDING'
                }
            })

            // Create Party A (APPROVER) record - needed for bidirectional email notifications
            const partyAEmail = (content.party_a_email as string) || user.email
            const partyAName = (content.party_a_signatory_name as string) || null
            await prisma.signer.create({
                data: {
                    signRequestId: signRequest.id,
                    email: partyAEmail,
                    name: partyAName,
                    role: 'APPROVER',
                    status: 'PENDING'
                }
            })
        }

        // Only include fields where Party A explicitly asked Party B to fill
        // If Party A filled a field themselves, it should be readonly (not pending input)
        const editableFields: string[] = [];

        if (content.party_b_name_ask_receiver) editableFields.push('party_b_name');
        if (content.party_b_address_ask_receiver) editableFields.push('party_b_address');
        if (content.party_b_phone_ask_receiver) editableFields.push('party_b_phone');
        if (content.party_b_signatory_name_ask_receiver) editableFields.push('party_b_signatory_name');
        if (content.party_b_title_ask_receiver) editableFields.push('party_b_title');
        if (content.party_b_email_ask_receiver) editableFields.push('party_b_email');

        // Update content with the recipient email (in case it was changed in the modal)
        const updatedContent: Record<string, unknown> = {
            ...content,
            party_b_email: recipientEmail
        }

        // Update draft with workflow state and updated content
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                content: updatedContent as object,
                workflowState: 'AWAITING_PARTY_B_REVIEW',
                pendingInputFields: editableFields,
                recipientEmail: recipientEmail,
                lastEditedBy: 'party_a',
                status: 'SENT'
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
                    action: 'send_for_review',
                    recipient_email: recipientEmail,
                    workflow_state: 'AWAITING_PARTY_B_REVIEW'
                }
            }
        })

        // Send email to recipient
        const reviewLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`
        console.log('📧 Sending review request to:', recipientEmail)
        console.log('📧 Review link:', reviewLink)

        // Check if all required fields are filled (no "ask receiver to fill" and no empty required fields)
        const requiredFields = [
            'party_a_name', 'party_a_address', 'party_a_signatory_name', 'party_a_title',
            'party_b_name', 'party_b_address', 'party_b_signatory_name', 'party_b_title',
            'effective_date', 'term_months', 'confidentiality_period_months',
            'governing_law', 'ip_ownership', 'non_solicit', 'exclusivity'
        ]

        const hasAskReceiverFlags =
            updatedContent.party_a_ask_receiver_fill ||
            updatedContent.party_b_name_ask_receiver ||
            updatedContent.party_b_address_ask_receiver ||
            updatedContent.party_b_signatory_name_ask_receiver ||
            updatedContent.party_b_title_ask_receiver

        const allFieldsFilled = !hasAskReceiverFlags && requiredFields.every(field => {
            const value = updatedContent[field]
            return value !== undefined && value !== null && String(value).trim() !== ''
        })

        console.log('📄 All fields filled:', allFieldsFilled)
        console.log('📄 Has ask receiver flags:', hasAskReceiverFlags)

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `Review Request: ${draft.title || 'NDA'} - Formalize It`,
                html: reviewRequestEmailHtml(
                    draft.title || 'Untitled NDA',
                    reviewLink,
                    (updatedContent.party_a_name as string) || 'Sender',
                    message || 'Please review the NDA and fill in your information.'
                )
            })
            console.log('✅ Review request email sent')
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError)
            // Don't fail the request - log the link for testing
        }

        // Notify the draft creator if they are different from the sender
        if (draft.createdByUserId !== user.id) {
            try {
                await createNotification(
                    draft.createdByUserId,
                    'NDA_SENT_TO_YOU',
                    'NDA sent',
                    `"${draft.title || 'Untitled NDA'}" was sent to ${recipientEmail} for review`,
                    `/dashboard#nda-${draftId}`,
                    draftId
                )
            } catch (e) {
                console.error('Failed to create sent notification:', e)
            }
        }

        // Notify the recipient if they have a registered account
        const normalizedRecipientEmail = recipientEmail.trim().toLowerCase()
        const recipientUser = await prisma.user.findUnique({ where: { email: normalizedRecipientEmail }, select: { id: true } })
        if (recipientUser) {
            try {
                await createNotification(
                    recipientUser.id,
                    'NDA_SENT_TO_YOU',
                    'Incoming NDA',
                    `${user.name || user.email} sent you "${draft.title || 'Untitled NDA'}" to review`,
                    `/dashboard#nda-${draftId}`,
                    draftId
                )
            } catch (e) {
                console.error('Failed to create recipient notification:', e)
            }
        }

        return NextResponse.json({
            success: true,
            draft: { id: draft.id, workflowState: 'AWAITING_PARTY_B_REVIEW' },
            signer: { id: signer.id, email: recipientEmail },
            reviewLink,
            message: `NDA sent to ${recipientEmail} for review`
        })
    } catch (error) {
        console.error('Send for review error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to send for review'
        }, { status: 500 })
    }
}

// Email template for review request
function reviewRequestEmailHtml(
    draftTitle: string,
    reviewLink: string,
    senderName: string,
    message: string
): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background: #f3f4f6; }
          .wrapper { background: #f3f4f6; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #0d9488; letter-spacing: -0.5px; }
          .tagline { font-size: 13px; color: #9ca3af; margin-top: 2px; }
          .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 16px; }
          .card-header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 28px 32px; }
          .card-header h1 { margin: 0; color: white; font-size: 20px; font-weight: 700; }
          .card-header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
          .card-body { padding: 28px 32px; }
          .sender-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
          .sender-box p { margin: 0; font-size: 15px; color: #134e4a; }
          .doc-name { font-size: 17px; font-weight: 700; color: #0d9488; margin: 0 0 4px; }
          .message-box { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 18px 0; font-size: 14px; color: #78350f; }
          .what-is { background: #f0f9ff; border-radius: 10px; padding: 14px 18px; margin: 18px 0; font-size: 14px; color: #0c4a6e; }
          .what-is strong { display: block; margin-bottom: 4px; color: #075985; }
          .steps-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 22px 0 12px; }
          .steps { margin: 0; padding: 0; list-style: none; }
          .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
          .step-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .step-1 { background: #e0f2fe; }
          .step-2 { background: #fef3c7; }
          .step-3 { background: #dcfce7; }
          .step-4 { background: #ede9fe; }
          .step-text strong { display: block; font-size: 14px; color: #111827; margin-bottom: 2px; }
          .step-text span { font-size: 13px; color: #6b7280; }
          .cta-wrap { text-align: center; padding: 24px 0 8px; }
          .button { display: inline-block; background: #0d9488; color: white !important; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; }
          .reassurance { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin: 20px 0 0; }
          .reassurance span { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 4px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; padding: 8px 0 24px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">Formalize It</div>
              <div class="tagline">Smart NDA workflows</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h1>You've been invited to review an NDA ✉️</h1>
                <p>It only takes a few minutes — no account needed</p>
              </div>
              <div class="card-body">

                <div class="sender-box">
                  <p><strong>${senderName}</strong> has shared the following NDA with you:</p>
                  <p class="doc-name">${draftTitle}</p>
                </div>

                ${message ? `<div class="message-box">💬 <em>${message}</em></div>` : ''}

                <div class="what-is">
                  <strong>📋 What's a Mutual NDA?</strong>
                  A Non-Disclosure Agreement (NDA) is a simple legal document that protects confidential information shared between two parties. Both sides agree to keep things private.
                </div>

                <div class="steps-title">Here's what happens next</div>
                <ul class="steps">
                  <li class="step">
                    <div class="step-icon step-1">👀</div>
                    <div class="step-text">
                      <strong>Review the draft</strong>
                      <span>See exactly what you're agreeing to — every clause is visible in a live preview.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-2">✏️</div>
                    <div class="step-text">
                      <strong>Fill in your information</strong>
                      <span>Add your company name, address, and contact details. Takes about 2 minutes.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-3">💬</div>
                    <div class="step-text">
                      <strong>Approve or suggest edits</strong>
                      <span>Happy with everything? Proceed to sign. Want to change something? Suggest it — ${senderName} will review your feedback.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-4">🎉</div>
                    <div class="step-text">
                      <strong>Sign & you're done</strong>
                      <span>Once both parties have signed, you'll each receive a copy of the fully executed NDA.</span>
                    </div>
                  </li>
                </ul>

                <div class="cta-wrap">
                  <a href="${reviewLink}" class="button">Review the NDA →</a>
                </div>

                <div class="reassurance">
                  <span>🔒 Secure link</span>
                  <span>📧 No account required</span>
                  <span>⏱ Expires in 30 days</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
              <p style="margin-top:4px;">You received this because ${senderName} used Formalize It to send you an NDA.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}
