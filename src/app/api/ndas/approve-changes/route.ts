import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

        // Update draft workflow state
        // Since Party B made changes and Party A is approving, Party A signs first
        const draft = await prisma.ndaDraft.update({
            where: {
                id: draftId,
                createdByUserId: user.id
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
                eventType: 'UPDATED',
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
