import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl } from '@/lib/email'

/**
 * Request changes from Party B
 * Sends email back to Party B with message about required changes
 * POST /api/ndas/request-changes
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { draftId, message } = body

        if (!draftId || !message) {
            return NextResponse.json({ error: 'Missing draftId or message' }, { status: 400 })
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { externalId: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get draft with sign request and signer
        const draft = await prisma.ndaDraft.findUnique({
            where: {
                id: draftId,
                createdByUserId: user.id
            },
            include: {
                signRequests: {
                    include: {
                        signers: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        const latestSignRequest = draft.signRequests[0]
        const signer = latestSignRequest?.signers[0]

        if (!signer) {
            return NextResponse.json({ error: 'No signer found' }, { status: 400 })
        }

        // Update workflow state back to Party B review
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                workflowState: 'AWAITING_PARTY_B_REVIEW',
                lastEditedBy: 'party_a' // Party A is requesting changes
            }
        })

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'UPDATED',
                metadata: {
                    action: 'requested_changes',
                    message,
                    sentTo: signer.email
                }
            }
        })

        // Send email to Party B
        const editLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`

        try {
            await sendEmail({
                to: signer.email,
                subject: `Changes Requested: ${draft.title || 'NDA'}`,
                html: changesRequestedEmailHtml(draft.title || 'Untitled NDA', editLink, message)
            })
            console.log('✅ Changes request email sent to:', signer.email)
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError)
        }

        return NextResponse.json({
            success: true,
            workflowState: 'AWAITING_PARTY_B_REVIEW'
        })
    } catch (error) {
        console.error('Request changes error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to request changes'
        }, { status: 500 })
    }
}

// Email template for requesting changes
function changesRequestedEmailHtml(draftTitle: string, editLink: string, message: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .message { background: #fff7ed; padding: 15px; border-left: 4px solid #f97316; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Formalize It</div>
          </div>
          <div class="content">
            <h2>Changes Requested</h2>
            <p><strong>${draftTitle}</strong></p>
            <p>The sender has reviewed your submission and is requesting changes:</p>
            <div class="message">${message}</div>
            <p>Please review the request and update the NDA accordingly:</p>
            <a href="${editLink}" class="button">Review & Update NDA</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
