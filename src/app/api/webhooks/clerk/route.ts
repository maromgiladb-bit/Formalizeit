import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import { assessDeparture } from '@/lib/accountDeletion'

interface ClerkUserDeletedEvent {
    type: 'user.deleted'
    data: {
        id: string
        deleted: boolean
    }
}

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events.
 * Set CLERK_WEBHOOK_SECRET in .env from: Clerk Dashboard → Webhooks → Signing Secret
 */
export async function POST(req: NextRequest) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
        console.error('Missing CLERK_WEBHOOK_SECRET')
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Verify the webhook signature using svix
    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
    }

    const body = await req.text()

    let event: ClerkUserDeletedEvent
    try {
        const wh = new Webhook(webhookSecret)
        event = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as ClerkUserDeletedEvent
    } catch {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    if (event.type === 'user.deleted') {
        await handleUserDeleted(event.data.id)
    }

    return NextResponse.json({ received: true })
}

async function handleUserDeleted(clerkUserId: string) {
    const user = await prisma.user.findUnique({
        where: { externalId: clerkUserId },
    })

    if (!user) {
        // User might not exist if they never completed onboarding
        return
    }

    // 0. Companies where this user is the sole administrator of other active
    //    members: hand administration to the longest-standing member so the
    //    company is never left without an administrator (the webhook cannot refuse).
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

    const promotions: { organizationId: string; promoteUserId: string; wasSigner: boolean }[] = []
    for (const m of memberships) {
        const assessment = assessDeparture(m.organization.memberships, user.id)
        if (assessment.strandsCompany && assessment.promoteUserId) {
            const promoted = m.organization.memberships.find((x) => x.userId === assessment.promoteUserId)
            promotions.push({
                organizationId: m.organizationId,
                promoteUserId: assessment.promoteUserId,
                wasSigner: promoted?.role === 'SIGNER',
            })
        }
    }

    for (const p of promotions) {
        // A SIGNER signs by role; an ADMINISTRATOR only with isSigner on (canSignNDA).
        // Turn isSigner on for a promoted SIGNER so they keep signing; otherwise leave it.
        await prisma.$transaction([
            prisma.membership.update({
                where: {
                    userId_organizationId: {
                        userId: p.promoteUserId,
                        organizationId: p.organizationId,
                    },
                },
                data: { role: 'ADMINISTRATOR', ...(p.wasSigner ? { isSigner: true } : {}) },
            }),
            prisma.organization.update({
                where: { id: p.organizationId },
                data: { ownerUserId: p.promoteUserId },
            }),
        ])
        console.log(
            `[user.deleted] Promoted ${p.promoteUserId} to ADMINISTRATOR of org ${p.organizationId}`,
        )
    }

    // 1. Soft-delete: mark for pending deletion (30-day grace period)
    await prisma.user.update({
        where: { id: user.id },
        data: {
            deletedAt: new Date(),
            status: 'pending_deletion',
        },
    })

    // 2. Remove all active memberships (they leave the org immediately)
    await prisma.membership.deleteMany({
        where: { userId: user.id },
    })

    // 3. Signer records and NDA drafts are intentionally preserved
    // Signer records retain legal audit trail (email + signature)
    // NdaDraft records stay for the other party's access
    // S3 PDFs are never touched

    console.log(`[user.deleted] Soft-deleted user ${user.id} (${user.email})`)
}
