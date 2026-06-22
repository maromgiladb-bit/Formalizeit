import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSendNDA } from '@/lib/organizationRoles'
import { writeActivity } from '@/lib/writeActivity'

/**
 * POST /api/ndas/[draftId]/cancel
 * Cancels a sent / in-flight NDA (sets status = CANCELLED + audit event).
 * Cancelling is not signing, so any member who can send (all roles) may cancel.
 * Drafts are deleted, not cancelled; signed/complete NDAs cannot be cancelled.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId } = await params

    const user = await prisma.user.findUnique({ where: { externalId: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
    }
    if (!canSendNDA(activeMembership)) {
      return NextResponse.json({ error: 'You do not have permission to cancel NDAs.' }, { status: 403 })
    }

    const draft = await prisma.ndaDraft.findFirst({
      where: { id: draftId, organizationId: activeMembership.organizationId },
    })
    if (!draft) {
      return NextResponse.json({ error: 'NDA not found or unauthorized' }, { status: 404 })
    }

    // Only sent / in-flight NDAs can be cancelled.
    if (draft.status === 'SIGNED' || draft.workflowState === 'COMPLETE') {
      return NextResponse.json({ error: 'A signed or completed NDA cannot be cancelled.' }, { status: 409 })
    }
    if (draft.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This NDA is already cancelled.' }, { status: 409 })
    }
    const inFlight =
      draft.status === 'SENT' ||
      draft.status === 'READY_TO_SEND' ||
      (draft.workflowState?.startsWith('AWAITING') ?? false)
    if (!inFlight) {
      return NextResponse.json({ error: 'Only sent NDAs can be cancelled. Delete drafts instead.' }, { status: 409 })
    }

    await prisma.ndaDraft.update({
      where: { id: draftId, organizationId: activeMembership.organizationId },
      data: { status: 'CANCELLED' },
    })

    await writeActivity({
      organizationId: activeMembership.organizationId,
      draftId,
      eventType: 'CANCELLED',
      label: `Cancelled by ${user.name || user.email}`,
      actorName: user.name ?? undefined,
      actorEmail: user.email ?? undefined,
      actorRole: 'party_a',
      userId: user.id,
    })

    return NextResponse.json({ success: true, draft: { id: draftId, status: 'CANCELLED' } })
  } catch (error) {
    console.error('Cancel NDA error:', error)
    return NextResponse.json({ error: 'Failed to cancel NDA' }, { status: 500 })
  }
}
