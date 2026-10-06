import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { resolveLimits, getCurrentQuarterStart, getCurrentMonthStart } from "@/billing/planLimits"
import { DbMembershipRole } from '@/lib/organizationRoles'

/** Thrown when an action would exceed the plan's NDA cap; routes map it to HTTP 403 `LIMIT_REACHED`. */
export class PlanLimitError extends Error {
    readonly code = 'LIMIT_REACHED' as const
    constructor(message: string) {
        super(message)
        this.name = 'PlanLimitError'
    }
}

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
        throw new Error("You've reached the maximum number of users for this plan.")
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

/**
 * Throws when the organization has hit its plan's cap on sent NDAs. Pass `draftId` when
 * sending an existing draft: a draft that is already SENT/SIGNED is already counted, so it
 * must not count against itself when another round goes out.
 */
export async function assertCanSendNda(organizationId: string, draftId?: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (!org) throw new Error("Organization not found")

    const limits = resolveLimits(org)

    const periodStart =
        limits.draftLimitPeriod === 'quarter'
            ? getCurrentQuarterStart()
            : limits.draftLimitPeriod === 'month'
                ? getCurrentMonthStart()
                : null

    const excludeCurrent: Prisma.NdaDraftWhereInput = draftId ? { id: { not: draftId } } : {}
    const whereClause: Prisma.NdaDraftWhereInput =
        periodStart
            ? { organizationId, sentAt: { gte: periodStart }, status: { in: ['SENT', 'SIGNED'] }, ...excludeCurrent }
            : { organizationId, status: { in: ['SENT', 'SIGNED'] }, ...excludeCurrent }

    const sentNdaCount = await prisma.ndaDraft.count({ where: whereClause })

    if (sentNdaCount >= limits.maxActiveDrafts) {
        throw new PlanLimitError("You've reached the maximum number of NDAs for this plan.")
    }
}

export async function createDraft(data: {
    organizationId: string
    createdByUserId: string
    templateId?: string | null
    title?: string | null
    content?: Prisma.InputJsonValue
}) {
    return prisma.ndaDraft.create({
        data,
    })
}
