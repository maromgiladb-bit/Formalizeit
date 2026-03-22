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

    if (!user || user.memberships.length === 0) return null

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
