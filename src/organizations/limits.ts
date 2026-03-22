import { prisma } from '@/lib/prisma'
import { resolveLimits } from "@/billing/planLimits"
import { DbMembershipRole } from '@/lib/organizationRoles'

export async function assertCanAddMember(organizationId: string) {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
            _count: {
                select: { memberships: true },
            },
        },
    })

    if (!org) throw new Error("Organization not found")

    const limits = resolveLimits(org)
    const current = org._count.memberships

    if (current >= limits.maxUsers) {
        throw new Error("You’ve reached the maximum number of users for this plan.")
    }
}

export async function addMemberToOrganization(
    organizationId: string,
    userId: string,
    role: DbMembershipRole = "CONTRIBUTOR",
    status: "ACTIVE" | "PENDING_INVITE" = "ACTIVE"
) {
    await assertCanAddMember(organizationId)

    return prisma.membership.create({
        data: { userId, organizationId, role, status },
    })
}

export async function assertCanCreateDraft(organizationId: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (!org) throw new Error("Organization not found")

    const limits = resolveLimits(org)

    const activeDraftCount = await prisma.ndaDraft.count({
        where: {
            organizationId,
            NOT: { status: "CANCELLED" },
        },
    })

    if (activeDraftCount >= limits.maxActiveDrafts) {
        throw new Error("You’ve reached the maximum number of NDAs for this plan.")
    }
}

export async function createDraftWithLimitCheck(data: {
    organizationId: string
    createdByUserId: string
    templateId?: string | null
    title?: string | null
    content?: unknown
}) {
    await assertCanCreateDraft(data.organizationId)

    return prisma.ndaDraft.create({
        data,
    })
}
