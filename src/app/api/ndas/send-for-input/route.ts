import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl } from '@/lib/email'
import { getActiveOrganization } from '@/lib/db-organization'
import { canApproveAndSend } from '@/lib/organizationRoles'
import { createNotification } from '@/lib/notifications'

/**
 * Send NDA for Party B input (not signature)
 * Used when Party A has marked fields as "ask receiver to fill"
 * POST /api/ndas/send-for-input
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
            return NextResponse.json({ error: 'Only approvers can send NDAs for input.' }, { status: 403 })
        }

        // Get draft in active organization
        const draft = await prisma.ndaDraft.findFirst({
            where: {
                id: draftId,
            organizationId: activeMembership.organizationId
            }
        })

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        // Extract which fields are marked for receiver to fill
        const content = (draft.content as Record<string, unknown>) || {}
        const pendingInputFields: string[] = []

        // Check each "ask receiver" flag
        const askReceiverFields = [
            { flag: 'party_b_name_ask_receiver', field: 'party_b_name', label: 'Company/Party Name' },
            { flag: 'party_b_address_ask_receiver', field: 'party_b_address', label: 'Address' },
            { flag: 'party_b_phone_ask_receiver', field: 'party_b_phone', label: 'Phone' },
            { flag: 'party_b_signatory_name_ask_receiver', field: 'party_b_signatory_name', label: 'Signatory Name' },
            { flag: 'party_b_title_ask_receiver', field: 'party_b_title', label: 'Signatory Title' },
            { flag: 'party_b_email_ask_receiver', field: 'party_b_email', label: 'Email' },
        ]

        for (const { flag, field } of askReceiverFields) {
            if (content[flag] === true) {
                pendingInputFields.push(field)
            }
        }

        if (pendingInputFields.length === 0) {
            return NextResponse.json({
                error: 'No fields marked for receiver to fill. Use send-for-signature instead.'
            }, { status: 400 })
        }

        // Create a SignRequest for tracking
        const signRequest = await prisma.signRequest.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draftId,
                createdByUserId: user.id,
                status: 'PENDING',
            }
        })

        // Create Signer record
        const signer = await prisma.signer.create({
            data: {
                signRequestId: signRequest.id,
                email: recipientEmail,
                name: recipientName || null,
                role: 'SIGNER',
                status: 'PENDING'
            }
        })

        // Update draft with workflow state
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                workflowState: 'AWAITING_PARTY_B_REVIEW',
                pendingInputFields: pendingInputFields,
                recipientEmail: recipientEmail,
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
                    action: 'send_for_input',
                    recipient_email: recipientEmail,
                    pending_fields: pendingInputFields
                }
            }
        })

        // Send email to recipient
        const inputLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`
        console.log('📧 Sending input request to:', recipientEmail)
        console.log('📧 Fill link:', inputLink)

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `Action Required: Please complete your information - ${draft.title || 'NDA'}`,
                html: inputRequestEmailHtml(
                    draft.title || 'Untitled NDA',
                    inputLink,
                    pendingInputFields.length,
                    message || 'Please fill in the requested information to complete this NDA.'
                )
            })
            console.log('✅ Input request email sent')
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError)
            // Don't fail the request
        }

        // Notify the draft creator if they are different from the sender
        if (draft.createdByUserId !== user.id) {
            try {
                await createNotification(
                    draft.createdByUserId,
                    'NDA_SENT_TO_YOU',
                    'NDA sent',
                    `"${draft.title || 'Untitled NDA'}" was sent to ${recipientEmail} for input`,
                    `/dashboard#nda-${draftId}`,
                    draftId
                )
            } catch (e) {
                console.error('Failed to create sent notification:', e)
            }
        }

        // Notify the recipient if they have a registered account
        const recipientUser = await prisma.user.findUnique({ where: { email: recipientEmail }, select: { id: true } })
        if (recipientUser) {
            try {
                await createNotification(
                    recipientUser.id,
                    'NDA_SENT_TO_YOU',
                    'Incoming NDA',
                    `${user.name || user.email} sent you "${draft.title || 'Untitled NDA'}" to fill in`,
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
            inputLink,
            pendingFieldsCount: pendingInputFields.length
        })
    } catch (error) {
        console.error('Send for input error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to send for input'
        }, { status: 500 })
    }
}

// Email template for input request
function inputRequestEmailHtml(
    draftTitle: string,
    inputLink: string,
    fieldCount: number,
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
          .doc-row { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
          .doc-row p { margin: 0; font-size: 15px; color: #134e4a; }
          .doc-name { font-size: 17px; font-weight: 700; color: #0d9488; margin: 0 0 4px; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; border: 1px solid #fde68a; }
          .message-box { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 18px 0; font-size: 14px; color: #78350f; }
          .steps-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 22px 0 12px; }
          .steps { margin: 0; padding: 0; list-style: none; }
          .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
          .step-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .step-1 { background: #e0f2fe; }
          .step-2 { background: #fef3c7; }
          .step-3 { background: #dcfce7; }
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
                <h1>Quick action needed on an NDA ✏️</h1>
                <p>Just ${fieldCount} field${fieldCount > 1 ? 's' : ''} to fill in — won't take long!</p>
              </div>
              <div class="card-body">

                <div class="doc-row">
                  <p>You've been asked to add your details to:</p>
                  <p class="doc-name">${draftTitle}</p>
                  <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">Fields to complete: <span class="badge">${fieldCount} field${fieldCount > 1 ? 's' : ''}</span></p>
                </div>

                ${message ? `<div class="message-box">💬 <em>${message}</em></div>` : ''}

                <div class="steps-title">Here's how it works</div>
                <ul class="steps">
                  <li class="step">
                    <div class="step-icon step-1">👀</div>
                    <div class="step-text">
                      <strong>Review the NDA</strong>
                      <span>See the full document in a live preview so you know exactly what you're filling in.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-2">✏️</div>
                    <div class="step-text">
                      <strong>Fill in your ${fieldCount} field${fieldCount > 1 ? 's' : ''}</strong>
                      <span>We'll highlight exactly which fields need your input — no guessing required.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-3">🚀</div>
                    <div class="step-text">
                      <strong>Submit & move forward</strong>
                      <span>Once you submit, the NDA moves to the signing stage. Nearly there!</span>
                    </div>
                  </li>
                </ul>

                <div class="cta-wrap">
                  <a href="${inputLink}" class="button">Complete My Part →</a>
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
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}
