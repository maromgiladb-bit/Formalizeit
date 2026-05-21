import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl, partyARequestChangesEmailHtml } from '@/lib/email'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSignNDA } from '@/lib/organizationRoles'

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

        const activeMembership = await getActiveOrganization()
        if (!activeMembership) {
            return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
        }

        if (!canSignNDA(activeMembership)) {
            return NextResponse.json({ error: 'Only approvers can request changes' }, { status: 403 })
        }

        // Get draft with sign request and signer in active organization
        const draft = await prisma.ndaDraft.findFirst({
            where: {
                id: draftId,
                organizationId: activeMembership.organizationId
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
        const signer = latestSignRequest?.signers.find(s => s.role === 'SIGNER')

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
                eventType: 'CHANGES_REQUESTED',
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
                html: partyARequestChangesEmailHtml(draft.title || 'Untitled NDA', message, editLink)
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

