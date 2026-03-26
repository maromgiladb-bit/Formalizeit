import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { needsInternalApproval } from '@/lib/organizationRoles'
import { sendEmail, getAppUrl, approvalRequestEmailHtml } from '@/lib/email'
import { createNotificationsForOrgApprovers } from '@/lib/notifications'

/**
 * Contributor/Owner submits a draft for internal approval before external sending.
 * Sets workflowState = PENDING_INTERNAL_APPROVAL and notifies all org approvers.
 * POST /api/ndas/submit-for-approval
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

        if (!needsInternalApproval(activeMembership)) {
            return NextResponse.json({ error: 'Approvers can send NDAs directly without internal approval' }, { status: 400 })
        }

        const draft = await prisma.ndaDraft.findFirst({
            where: { id: draftId, organizationId: activeMembership.organizationId },
        })
        if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

        if (draft.workflowState === 'PENDING_INTERNAL_APPROVAL') {
            return NextResponse.json({ error: 'Draft is already awaiting approval' }, { status: 400 })
        }

        // Transition to pending internal approval
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: { workflowState: 'PENDING_INTERNAL_APPROVAL' },
        })

        await prisma.auditEvent.create({
            data: {
                organizationId: activeMembership.organizationId,
                draftId,
                userId: dbUser.id,
                eventType: 'UPDATED',
                metadata: { action: 'submitted_for_approval' },
            },
        })

        // Find all approvers in the org (APPROVER role + OWNER with isApprover=true)
        const approverMemberships = await prisma.membership.findMany({
            where: {
                organizationId: activeMembership.organizationId,
                OR: [{ role: 'APPROVER' }, { role: 'OWNER', isApprover: true }],
            },
            include: { user: true },
        })

        // Notify each approver by email
        const reviewLink = `${getAppUrl()}/fillndahtml?draftId=${draftId}`
        const submitterName = dbUser.name || dbUser.email

        for (const m of approverMemberships) {
            try {
                await sendEmail({
                    to: m.user.email,
                    subject: `Approval Required: ${draft.title || 'Untitled NDA'}`,
                    html: approvalRequestEmailHtml(draft.title || 'Untitled NDA', submitterName, reviewLink),
                })
            } catch (e) {
                console.error('Failed to notify approver:', m.user.email, e)
            }
        }

        // In-app notifications for approvers
        const ndaLink = `/dashboard#nda-${draftId}`
        try {
            await createNotificationsForOrgApprovers(
                activeMembership.organizationId,
                dbUser.id,
                'NDA_APPROVAL_REQUESTED',
                'Approval needed',
                `${submitterName} submitted "${draft.title || 'Untitled NDA'}" for review`,
                ndaLink,
                draftId
            )
        } catch (e) {
            console.error('Failed to create approval notifications:', e)
        }

        return NextResponse.json({
            success: true,
            workflowState: 'PENDING_INTERNAL_APPROVAL',
            notified: approverMemberships.length,
        })
    } catch (error) {
        console.error('Submit for approval error:', error)
        return NextResponse.json({ error: 'Failed to submit for approval' }, { status: 500 })
    }
}
