import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications
 * Returns the 20 most recent notifications for the current user.
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

        const notifications = await prisma.notification.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        const unreadCount = notifications.filter(n => !n.read).length

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Fetch notifications error:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }
}
