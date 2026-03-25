import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/user/account
 * 1. Deletes the Clerk account first (invalidates all sessions).
 *    This is the irreversible external call — if it fails we abort before
 *    touching the DB, so no rollback is needed.
 * 2. Wraps the subsequent Prisma writes in a transaction so that both the
 *    soft-delete and membership removal succeed or fail together atomically.
 */
export async function DELETE() {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // 1. Find user in DB (needed for the DB writes below)
    const user = await prisma.user.findUnique({
        where: { externalId: userId },
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Delete from Clerk FIRST — this invalidates all sessions immediately.
    //    If this fails we have not yet touched the DB, so there is nothing to
    //    roll back and the user's account remains intact.
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
        },
    })

    if (!clerkRes.ok) {
        console.error('Clerk user deletion failed:', await clerkRes.json().catch(() => ({})))
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // 3. Clerk deletion succeeded — now update the DB atomically.
    //    NDAs, Signer records, and S3 PDFs are intentionally preserved.
    try {
        await prisma.$transaction([
            // Soft-delete the user: preserve data for 30-day grace period
            prisma.user.update({
                where: { id: user.id },
                data: {
                    deletedAt: new Date(),
                    status: 'pending_deletion',
                },
            }),
            // Remove all company memberships immediately
            prisma.membership.deleteMany({
                where: { userId: user.id },
            }),
        ])
    } catch (dbError) {
        // Clerk account is already gone at this point.
        // Log for ops visibility — a cleanup job / webhook can reconcile.
        console.error('DB cleanup after Clerk deletion failed:', dbError)
        // Still return success: the Clerk session is gone, the user is locked out.
        // The grace-period cleanup cron will catch any orphaned DB rows.
    }

    return NextResponse.json({ success: true })
}

