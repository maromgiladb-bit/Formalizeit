import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/email'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSendNDA } from '@/lib/organizationRoles'
import { createNotification } from '@/lib/notifications'
import { assertCanSendNda } from '@/organizations/limits'

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
        const linkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

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

        await assertCanSendNda(activeMembership.organizationId)

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
                        status: 'PENDING',
                        expiresAt: linkExpiresAt,
                    }
                })
            } else {
                signer = await prisma.signer.create({
                    data: {
                        signRequestId: signRequest.id,
                        email: recipientEmail,
                        name: recipientName || null,
                        role: 'SIGNER',
                        status: 'PENDING',
                        expiresAt: linkExpiresAt,
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
                    status: 'PENDING',
                    expiresAt: linkExpiresAt,
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
                status: 'SENT',
                sentAt: new Date()
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

        // Generate the review link — sending is handled client-side via Gmail/Outlook/mailto
        const reviewLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`
        const senderName = (updatedContent.party_a_name as string) || user.name || user.email || 'Sender'
        const ndaTitle = draft.title || 'Untitled NDA'
        const suggestedSubject = `${senderName} sent you an NDA to review — ${ndaTitle}`
        const messageBlock = message ? `\n\nNote from ${senderName}:\n${message}` : ''
        const suggestedBody = `Hi,\n\n${senderName} has sent you a Non-Disclosure Agreement to review and sign.${messageBlock}\n\nYou can open and review the document here:\n${reviewLink}\n\nThe link is valid for 30 days. No account is needed.\n\nBest regards,\n${senderName}`

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
            suggestedSubject,
            suggestedBody,
            message: `NDA link generated for ${recipientEmail}`
        })
    } catch (error) {
        console.error('Send for review error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to send for review'
        }, { status: 500 })
    }
}

