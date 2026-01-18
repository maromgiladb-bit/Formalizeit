import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, EmailAttachment } from '@/lib/email'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { renderHtmlToPdf } from '@/lib/htmlToPdf'

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

        // Get draft and verify ownership
        const draft = await prisma.ndaDraft.findUnique({
            where: {
                id: draftId,
                createdByUserId: user.id
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
                }
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

        let attachments: EmailAttachment[] = []

        if (allFieldsFilled) {
            try {
                console.log('📄 Generating PDF for email attachment...')

                // Prepare template data with party mappings
                const templateData = {
                    ...updatedContent,
                    party_1_name: updatedContent.party_a_name,
                    party_1_address: updatedContent.party_a_address,
                    party_1_signatory_name: updatedContent.party_a_signatory_name,
                    party_1_signatory_title: updatedContent.party_a_title,
                    party_1_phone: updatedContent.party_a_phone || '',
                    party_1_emails_joined: updatedContent.party_a_email || '',
                    party_2_name: updatedContent.party_b_name,
                    party_2_address: updatedContent.party_b_address,
                    party_2_signatory_name: updatedContent.party_b_signatory_name,
                    party_2_signatory_title: updatedContent.party_b_title,
                    party_2_phone: updatedContent.party_b_phone || '',
                    party_2_emails_joined: updatedContent.party_b_email || recipientEmail,
                }

                const html = await renderNdaHtml(templateData, 'professional_mutual_nda_v1')
                const pdfBuffer = await renderHtmlToPdf(html, {
                    pageWidthPx: 900,
                    baseUrl: getAppUrl(),
                    isA4: true,
                })

                const pdfBase64 = pdfBuffer.toString('base64')
                attachments = [{
                    filename: `${draft.title || 'NDA'}.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf'
                }]

                console.log('✅ PDF generated and attached')
            } catch (pdfError) {
                console.error('❌ Failed to generate PDF:', pdfError)
                // Continue without attachment
            }
        }

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `Review Request: ${draft.title || 'NDA'} - Formalize It`,
                html: reviewRequestEmailHtml(
                    draft.title || 'Untitled NDA',
                    reviewLink,
                    (updatedContent.party_a_name as string) || 'Sender',
                    message || 'Please review the NDA and fill in your information.'
                ),
                attachments: attachments.length > 0 ? attachments : undefined
            })
            console.log('✅ Review request email sent' + (attachments.length > 0 ? ' with PDF attachment' : ''))
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError)
            // Don't fail the request - log the link for testing
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0d9488; }
          .content { background: #f9fafb; padding: 30px; border-radius: 12px; margin-bottom: 20px; }
          .button { display: inline-block; background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .steps { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .step { display: flex; align-items: center; margin: 10px 0; }
          .step-num { background: #0d9488; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; }
          .message { background: white; padding: 15px; border-left: 4px solid #0d9488; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Formalize It</div>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Review NDA Request</h2>
            <p><strong>${senderName}</strong> has sent you an NDA for review:</p>
            <p style="font-size: 18px; font-weight: 600; color: #0d9488;">${draftTitle}</p>
            
            <div class="message">${message}</div>
            
            <div class="steps">
              <div class="step"><div class="step-num">1</div>Review the NDA details</div>
              <div class="step"><div class="step-num">2</div>Fill in your company information</div>
              <div class="step"><div class="step-num">3</div>Approve or suggest changes</div>
            </div>
            
            <p style="text-align: center;">
              <a href="${reviewLink}" class="button">Review NDA Now</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              No account required. This link expires in 30 days.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
