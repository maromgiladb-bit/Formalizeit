import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createDraft } from '@/organizations/limits'
import { getActiveOrganization } from '@/lib/db-organization'
import { canContributeToDrafts } from '@/lib/organizationRoles'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    const { title, draftId, data } = payload
    // Frontend sends form data in 'data' field, backend stores it as 'content'
    const content = data

    // 1. Get user and memberships
    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId },
      include: {
        memberships: {
          include: { organization: true },
          take: 1
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let organizationId: string
    const activeMembership = await getActiveOrganization()

    if (activeMembership) {
      if (!canContributeToDrafts(activeMembership.role)) {
        return NextResponse.json({ error: 'Only contributors and admins can modify drafts in this organization' }, { status: 403 })
      }
      organizationId = activeMembership.organizationId
    } else if (dbUser.memberships.length > 0) {
      // Fallback when cookie context is unavailable
      const fallbackMembership = dbUser.memberships[0]
      if (!canContributeToDrafts(fallbackMembership.role)) {
        return NextResponse.json({ error: 'Only contributors and admins can modify drafts in this organization' }, { status: 403 })
      }
      organizationId = fallbackMembership.organizationId
    } else {
      // Create default org
      const orgName = dbUser.email.split('@')[0]
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)

      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: slug,
          ownerUserId: dbUser.id,
          memberships: {
            create: {
              userId: dbUser.id,
              role: 'OWNER'
            }
          }
        }
      })
      organizationId = org.id
    }

    // Ensure default template exists
    let template = await prisma.ndaTemplate.findFirst({
      where: { organizationId: organizationId }
    })
    if (!template) {
      template = await prisma.ndaTemplate.create({
        data: {
          title: 'Default NDA Template',
          content: 'Default content', // Placeholder
          organizationId: organizationId,
          createdByUserId: dbUser.id,
          isDefault: true
        }
      })
    }

    let draft
    if (draftId) {
      // Update existing draft
      const existingDraft = await prisma.ndaDraft.findFirst({
        where: {
          id: draftId,
          organizationId,
        },
      })

      if (!existingDraft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      draft = await prisma.ndaDraft.update({
        where: { id: draftId },
        data: { title, content: content }
      })
    } else {
      // Create new draft (limits are enforced at send-time via assertCanSendNda)
      draft = await createDraft({
        organizationId,
        createdByUserId: dbUser.id,
        templateId: template.id,
        title: title || 'Untitled NDA',
        content: content
      })
    }

    return NextResponse.json({ draft, draftId: draft.id, id: draft.id })

  } catch (error) {
    console.error('Draft creation/update error:', error)
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('maximum number of NDAs')) {
      return NextResponse.json({ error: errorMessage, code: 'LIMIT_REACHED' }, { status: 403 })
    }
    return NextResponse.json({
      error: 'Failed to save draft',
      details: errorMessage || 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('=== GET /api/ndas/drafts called ===')

  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ drafts: [] })
    }

    const activeMembership = await getActiveOrganization()
    if (!activeMembership) {
      return NextResponse.json({ drafts: [] })
    }

    const drafts = await prisma.ndaDraft.findMany({
      where: { organizationId: activeMembership.organizationId },
      orderBy: { updatedAt: 'desc' },
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

    const transformedDrafts = drafts.map(d => ({
      ...d,
      data: d.content, // Map content back to data for frontend compatibility
      signers: d.signRequests[0]?.signers || [] // Flatten signers from latest request
    }))

    return NextResponse.json({ drafts: transformedDrafts })
  } catch (error) {
    console.error('=== Draft fetch error ===', error)
    return NextResponse.json({
      error: 'Failed to fetch drafts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}