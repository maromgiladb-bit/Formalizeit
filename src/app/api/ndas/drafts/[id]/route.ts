import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== GET /api/ndas/drafts/[id] ===')
  try {
    const { userId } = await auth()
    console.log('Auth userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId }
    })
    console.log('Database user found:', dbUser)

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    console.log('Draft ID:', id)

    const draft = await prisma.ndaDraft.findUnique({
      where: {
        id: id,
        createdByUserId: dbUser.id
      },
      include: {
        revisions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    console.log('Draft found:', draft ? 'Yes' : 'No')

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Draft fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== PUT /api/ndas/drafts/[id] ===')

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const { title, data } = await request.json()

    const draft = await prisma.ndaDraft.update({
      where: {
        id,
        createdByUserId: dbUser.id
      },
      data: {
        title,
        content: data
      }
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Draft update error:', error)
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== DELETE /api/ndas/drafts/[id] ===')

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    await prisma.ndaDraft.delete({
      where: {
        id,
        createdByUserId: dbUser.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Draft delete error:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}