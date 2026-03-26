import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/notifications/read-all
 * Marks all unread notifications as read for the current user.
 */
export async function POST() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({
            where: { externalId: userId },
            select: { id: true },
        })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        await prisma.notification.updateMany({
            where: { userId: dbUser.id, read: false },
            data: { read: true },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Mark all notifications read error:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }
}
