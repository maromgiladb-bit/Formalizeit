import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

interface RequestBody {
  path: string
  text: string
  author: 'OWNER' | 'RECIPIENT'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ revisionId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    const revisionId = (await params).revisionId

    // Parse request body
    const body = await request.json() as RequestBody
    const { path, text, author } = body

    if (!path || !text || !author) {
      return NextResponse.json(
        { error: 'path, text, and author are required' },
        { status: 400 }
      )
    }

    // Get revision
    const revision = await prisma.ndaRevision.findUnique({
      where: { id: revisionId },
      include: {
        draft: {
          include: {
            createdBy: true
          }
        }
      }
    })

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    // Verify authorization (TODO: add proper token-based auth for recipient)
    if (author === 'OWNER' && userId && revision.draft.createdBy.externalId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get current comments
    const currentComments = (revision.content as any)?.comments || {} // Assuming comments are stored in content or a separate field?
    // Wait, schema check: NdaRevision has `content Json`. It does NOT have `comments` field.
    // Old schema had `comments Json?`.
    // I need to adapt. Store comments in `content.comments`?
    // Or did I miss `comments` field in NdaRevision?
    // Prompt said: "NdaRevision: id, draftId, content, createdAt". No comments field.
    // So I must store comments in `content`.

    const revisionContent = (revision.content as Record<string, any>) || {}
    const comments = revisionContent.comments || {}
    const pathComments = comments[path] || []

    // Add new comment
    const newComment = {
      author,
      text,
      ts: new Date().toISOString()
    }
    pathComments.push(newComment)
    comments[path] = pathComments

    revisionContent.comments = comments

    // Update revision
    await prisma.ndaRevision.update({
      where: { id: revisionId },
      data: {
        content: revisionContent
      }
    })

    return NextResponse.json({
      ok: true,
      comments: pathComments
    })

  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ revisionId: string }> }
): Promise<NextResponse> {
  try {
    const revisionId = (await params).revisionId
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    // Get revision
    const revision = await prisma.ndaRevision.findUnique({
      where: { id: revisionId },
      select: { content: true }
    })

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    const revisionContent = (revision.content as Record<string, any>) || {}
    const allComments = revisionContent.comments || {}

    if (path) {
      return NextResponse.json({
        comments: allComments[path] || []
      })
    }

    return NextResponse.json({
      comments: allComments
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
