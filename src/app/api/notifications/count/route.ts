import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications/count
 * Lightweight unread-count endpoint polled by the toolbar bell.
 */
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const dbUser = await prisma.user.findUnique({
            where: { externalId: userId },
            select: { id: true },
        })
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const unreadCount = await prisma.notification.count({
            where: { userId: dbUser.id, read: false },
        })
        return NextResponse.json({ unreadCount })
    } catch (error) {
        console.error('Fetch notification count error:', error)
        return NextResponse.json({ error: 'Failed to fetch notification count' }, { status: 500 })
    }
}
