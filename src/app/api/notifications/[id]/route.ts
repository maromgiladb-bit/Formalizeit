import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/notifications/[id]
 * Marks a single notification as read (verifies ownership).
 */
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({
            where: { externalId: userId },
            select: { id: true },
        })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const { id } = await params
        const result = await prisma.notification.updateMany({
            where: { id, userId: dbUser.id },
            data: { read: true },
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Mark notification read error:', error)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }
}
