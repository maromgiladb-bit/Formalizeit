import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, inputRequestEmailHtml } from '@/lib/email'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSendNDA } from '@/lib/organizationRoles'
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

        if (!canSendNDA(activeMembership)) {
            return NextResponse.json({ error: 'You do not have permission to send NDAs.' }, { status: 403 })
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
                subject: `${user.name || user.email} from ${(content.party_a_name as string) || activeMembership.organization.name} sent you an NDA to fill in`,
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
        const normalizedRecipientEmail = recipientEmail.trim().toLowerCase()
        const recipientUser = await prisma.user.findUnique({ where: { email: normalizedRecipientEmail }, select: { id: true } })
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

