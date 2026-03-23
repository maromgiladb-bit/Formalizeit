import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { canApproveAndSend } from '@/lib/organizationRoles'

/**
 * Approve changes submitted by Party B
 * Sets workflow state to READY_TO_SIGN
 * POST /api/ndas/approve-changes
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { draftId } = body

        if (!draftId) {
            return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })
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
            return NextResponse.json({ error: 'Only approvers can approve changes' }, { status: 403 })
        }

        const existingDraft = await prisma.ndaDraft.findFirst({
            where: {
                id: draftId,
                organizationId: activeMembership.organizationId
            }
        })

        if (!existingDraft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        // Update draft workflow state
        // Since Party B made changes and Party A is approving, Party A signs first
        const draft = await prisma.ndaDraft.update({
            where: {
                id: draftId
            },
            data: {
                workflowState: 'AWAITING_PARTY_A_SIGNATURE',
                lastEditedBy: 'party_a' // Party A approved
            }
        })

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'CHANGES_ACCEPTED',
                metadata: {
                    action: 'approved_changes',
                    newWorkflowState: 'AWAITING_PARTY_A_SIGNATURE'
                }
            }
        })

        return NextResponse.json({
            success: true,
            workflowState: 'AWAITING_PARTY_A_SIGNATURE'
        })
    } catch (error) {
        console.error('Approve changes error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to approve changes'
        }, { status: 500 })
    }
}
