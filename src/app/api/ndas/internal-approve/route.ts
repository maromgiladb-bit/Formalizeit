import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSignNDA } from '@/lib/organizationRoles'
import { sendEmail, getAppUrl, approvalApprovedEmailHtml } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

/**
 * Approver internally approves a contributor's draft.
 * Transitions workflowState back to DRAFT so the approver can send externally.
 * POST /api/ndas/internal-approve
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { draftId } = await request.json()
        if (!draftId) return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })

        const dbUser = await prisma.user.findUnique({ where: { externalId: userId } })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const activeMembership = await getActiveOrganization()
        if (!activeMembership) return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })

        if (!canSignNDA(activeMembership)) {
            return NextResponse.json({ error: 'Only signers and owners can approve internal submissions' }, { status: 403 })
        }

        const draft = await prisma.ndaDraft.findFirst({
            where: { id: draftId, organizationId: activeMembership.organizationId },
            include: { createdBy: true },
        })
        if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

        if (draft.workflowState !== 'PENDING_INTERNAL_APPROVAL') {
            return NextResponse.json({ error: 'Draft is not pending internal approval' }, { status: 400 })
        }

        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: { workflowState: 'DRAFT' },
        })

        await prisma.auditEvent.create({
            data: {
                organizationId: activeMembership.organizationId,
                draftId,
                userId: dbUser.id,
                eventType: 'CHANGES_ACCEPTED',
                metadata: { action: 'internal_approved' },
            },
        })

        // Email the draft creator
        try {
            const approverName = dbUser.name || dbUser.email
            const draftLink = `${getAppUrl()}/fillndahtml?draftId=${draftId}`
            await sendEmail({
                to: draft.createdBy.email,
                subject: `Approved: ${draft.title || 'Untitled NDA'}`,
                html: approvalApprovedEmailHtml(draft.title || 'Untitled NDA', approverName, draftLink),
            })
        } catch (e) {
            console.error('Failed to send approval notification:', e)
        }

        // In-app notification for the draft creator
        try {
            await createNotification(
                draft.createdBy.id,
                'NDA_APPROVAL_APPROVED',
                'Draft approved',
                `Your NDA "${draft.title || 'Untitled NDA'}" was approved and is ready to send`,
                `/dashboard#nda-${draftId}`,
                draftId
            )
        } catch (e) {
            console.error('Failed to create approval notification:', e)
        }

        return NextResponse.json({ success: true, workflowState: 'DRAFT' })
    } catch (error) {
        console.error('Internal approve error:', error)
        return NextResponse.json({ error: 'Failed to approve draft' }, { status: 500 })
    }
}
