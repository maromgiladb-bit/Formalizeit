import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { assessDeparture } from '@/lib/accountDeletion'

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

    // 1b. Refuse if deleting would leave a company with members but no administrator.
    const memberships = await prisma.membership.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        include: {
            organization: {
                include: {
                    memberships: {
                        select: { userId: true, role: true, status: true, createdAt: true },
                    },
                },
            },
        },
    })

    const blockedCompanies: string[] = []
    const soleMemberSubscriptions: { organizationId: string; subscriptionId: string }[] = []
    for (const m of memberships) {
        const org = m.organization
        const assessment = assessDeparture(org.memberships, user.id)
        if (assessment.strandsCompany) {
            blockedCompanies.push(org.name)
        } else if (
            assessment.isSoleAdmin &&
            org.stripeSubscriptionId &&
            org.billingStatus !== 'CANCELLED'
        ) {
            soleMemberSubscriptions.push({
                organizationId: org.id,
                subscriptionId: org.stripeSubscriptionId,
            })
        }
    }

    if (blockedCompanies.length > 0) {
        const names = blockedCompanies.map((n) => `"${n}"`).join(', ')
        return NextResponse.json(
            {
                error: `You are the only administrator of ${names}, which still has other members. Make another member an administrator first (Settings → Team), then delete your account.`,
                companies: blockedCompanies,
            },
            { status: 409 },
        )
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

    // 2b. Sole member of a company with a live Stripe subscription: we do NOT call
    //     Stripe from here. Flag it so the founder cancels the subscription manually.
    // TODO: cancel the Stripe subscription automatically (then drop this alert).
    for (const sub of soleMemberSubscriptions) {
        console.error(
            `[account-delete] MANUAL ACTION: cancel Stripe subscription ${sub.subscriptionId} (org ${sub.organizationId}); sole member ${user.id} deleted their account`,
        )
        Sentry.captureMessage('Account deleted with active Stripe subscription: cancel manually', {
            level: 'error',
            tags: { area: 'account-deletion' },
            extra: { organizationId: sub.organizationId, subscriptionId: sub.subscriptionId },
        })
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

        // DB cleanup succeeded; Clerk account is already deleted.
        return NextResponse.json({ success: true })
    } catch (dbError) {
        // Clerk account is already gone at this point.
        // Log for ops visibility — a cleanup job / webhook can reconcile.
        console.error('DB cleanup after Clerk deletion failed:', dbError)
        // Best-effort compensating step: try to at least mark the user as
        // pending deletion and remove memberships outside the transaction.
        let reconciled = false
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    deletedAt: new Date(),
                    status: 'pending_deletion',
                },
            })
            await prisma.membership.deleteMany({
                where: { userId: user.id },
            })
            reconciled = true
        } catch (reconcileError) {
            console.error(
                'Secondary DB reconciliation after Clerk deletion also failed:',
                reconcileError,
            )
        }
        if (reconciled) {
            // Compensating update succeeded; state matches the intended result.
            return NextResponse.json({ success: true })
        }
        // At this point, Clerk has deleted the account but the DB user may still
        // appear active. Signal a server error so callers know cleanup failed.
        return NextResponse.json(
            {
                success: false,
                error:
                    'Account was deleted from the authentication provider, but internal cleanup failed. Please try again later.',
            },
            { status: 500 },
        )
    }
}

