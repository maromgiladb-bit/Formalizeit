import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'
import { canSendNDA } from '@/lib/organizationRoles'
import { canArchiveNda } from '@/lib/ndaLifecycle'

/**
 * POST /api/ndas/[draftId]/archive
 * Body: { archived: boolean }
 * Moves a finalized (signed/complete) NDA into — or out of — the dashboard
 * Archived list by toggling `archivedAt`. Archiving is non-destructive, so any
 * member who can send (all roles) may do it. Only finalized NDAs are eligible.
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
      return NextResponse.json({ error: 'You do not have permission to archive NDAs.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const archived = body?.archived === true

    const draft = await prisma.ndaDraft.findFirst({
      where: { id: draftId, organizationId: activeMembership.organizationId },
    })
    if (!draft) {
      return NextResponse.json({ error: 'NDA not found or unauthorized' }, { status: 404 })
    }

    if (!canArchiveNda({ status: draft.status, workflowState: draft.workflowState })) {
      return NextResponse.json({ error: 'Only finalized NDAs can be archived.' }, { status: 409 })
    }

    const archivedAt = archived ? new Date() : null
    await prisma.ndaDraft.update({
      where: { id: draftId, organizationId: activeMembership.organizationId },
      data: { archivedAt },
    })

    return NextResponse.json({ success: true, archivedAt: archivedAt?.toISOString() ?? null })
  } catch (error) {
    console.error('Archive NDA error:', error)
    return NextResponse.json({ error: 'Failed to archive NDA' }, { status: 500 })
  }
}
