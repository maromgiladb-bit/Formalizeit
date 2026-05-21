import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string | null,
    draftId?: string | null
) {
    return prisma.notification.create({
        data: { userId, type, title, message, link: link ?? null, draftId: draftId ?? null },
    })
}

/**
 * Notify all signers in an org (SIGNER role OR OWNER with the signer toggle enabled).
 * Pass excludeUserId to skip the user taking the action.
 */
export async function createNotificationsForOrgSigners(
    organizationId: string,
    excludeUserId: string | null,
    type: NotificationType,
    title: string,
    message: string,
    link?: string | null,
    draftId?: string | null
) {
    const signerMemberships = await prisma.membership.findMany({
        where: {
            organizationId,
            status: 'ACTIVE',
            OR: [
                { role: 'SIGNER' },
                { role: 'OWNER', isApprover: true },
            ],
        },
        select: { userId: true },
    })

    const userIds = signerMemberships
        .map(m => m.userId)
        .filter(id => id !== excludeUserId)

    if (userIds.length === 0) return

    await prisma.notification.createMany({
        data: userIds.map(userId => ({
            userId,
            type,
            title,
            message,
            link: link ?? null,
            draftId: draftId ?? null,
        })),
    })
}

/**
 * Notify all active members in an org (used for COMPLETE events).
 */
export async function createNotificationsForAllOrgMembers(
    organizationId: string,
    excludeUserId: string | null,
    type: NotificationType,
    title: string,
    message: string,
    link?: string | null,
    draftId?: string | null
) {
    const memberships = await prisma.membership.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { userId: true },
    })

    const userIds = memberships
        .map(m => m.userId)
        .filter(id => id !== excludeUserId)

    if (userIds.length === 0) return

    await prisma.notification.createMany({
        data: userIds.map(userId => ({
            userId,
            type,
            title,
            message,
            link: link ?? null,
            draftId: draftId ?? null,
        })),
    })
}
