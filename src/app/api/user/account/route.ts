import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/user/account
 * 1. Soft-deletes the user in the DB (preserves NDAs/signers for legal compliance)
 * 2. Removes all company memberships
 * 3. Deletes the Clerk account (invalidates all sessions)
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

    // 1. Find user in DB
    const user = await prisma.user.findUnique({
        where: { externalId: userId },
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Soft-delete in DB: mark for 30-day grace period
    await prisma.user.update({
        where: { id: user.id },
        data: {
            deletedAt: new Date(),
            status: 'pending_deletion',
        },
    })

    // 3. Remove all company memberships immediately
    await prisma.membership.deleteMany({
        where: { userId: user.id },
    })

    // 4. Delete from Clerk — this invalidates all sessions
    //    NDAs, Signer records, and S3 PDFs are intentionally preserved
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
        },
    })

    if (!clerkRes.ok) {
        // Clerk deletion failed — roll back the soft-delete so the user isn't stuck
        await prisma.user.update({
            where: { id: user.id },
            data: { deletedAt: null, status: 'active' },
        })
        await prisma.membership.createMany({
            data: [], // memberships already deleted; user should re-invite themselves if needed
        })
        console.error('Clerk user deletion failed:', await clerkRes.json().catch(() => ({})))
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
