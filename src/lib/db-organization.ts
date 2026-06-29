import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function getActiveOrganization() {
    const { userId } = await auth()
    if (!userId) return null

    const cookieStore = await cookies()
    const activeOrgId = cookieStore.get('active-org-id')?.value

    const user = await prisma.user.findUnique({
        where: { externalId: userId },
        include: {
            memberships: {
                where: { status: 'ACTIVE' },
                include: { organization: true }
            }
        }
    })

    if (!user) return null

    // Auto-provision a personal org for users who existed before the ensureDbUser fix
    if (user.memberships.length === 0) {
        const slugBase = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
        const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`
        const membership = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: user.name ?? user.email.split('@')[0],
                    slug,
                    ownerUserId: user.id,
                },
            })
            return tx.membership.create({
                data: {
                    userId: user.id,
                    organizationId: org.id,
                    role: 'ADMINISTRATOR',
                    status: 'ACTIVE',
                    isSigner: true,
                },
                include: { organization: true },
            })
        })
        try {
            cookieStore.set('active-org-id', membership.organizationId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
            })
        } catch { /* webhook / non-cookie context */ }
        return membership
    }

    // 1. Try to match the cookie ID
    if (activeOrgId) {
        const activeMembership = user.memberships.find(m => m.organizationId === activeOrgId)
        if (activeMembership) {
            return activeMembership
        }
    }

    // 2. Fallback to the first organization (Default context)
    return user.memberships[0]
}
