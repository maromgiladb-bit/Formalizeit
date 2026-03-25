import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/cron/cleanup-deleted-users
 * Anonymizes users who have been pending deletion for > 30 days.
 * Call this from a cron job (Vercel Cron, GitHub Actions, etc.) daily.
 *
 * Protect this endpoint with CRON_SECRET in production:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const usersToAnonymize = await prisma.user.findMany({
        where: {
            status: 'pending_deletion',
            deletedAt: { lte: thirtyDaysAgo },
        },
        select: { id: true, email: true },
    })

    let anonymized = 0
    for (const user of usersToAnonymize) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: '[Deleted User]',
                // Use an invalid TLD to prevent accidental email delivery
                email: `deleted_${user.id}@removed.invalid`,
                image: null,
                status: 'deleted',
                // Keep deletedAt so we have a record of when it happened
            },
        })
        anonymized++
        console.log(`[cleanup] Anonymized user ${user.id} (was: ${user.email})`)
    }

    return NextResponse.json({
        processed: usersToAnonymize.length,
        anonymized,
    })
}
