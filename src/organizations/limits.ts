import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { resolveLimits, getCurrentQuarterStart, getCurrentMonthStart, FREE_ALLOWANCE_COUNTS_FROM, type DraftLimitPeriod } from "@/billing/planLimits"
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
 * Where-clause counting the NDAs that use up an organization's allowance (SENT/SIGNED, within the
 * plan's period; FREE only counts from FREE_ALLOWANCE_COUNTS_FROM when set). Shared by the send
 * gate and /api/user/check-limit so they can't drift.
 */
export function sentNdaCountWhere(
    org: { id: string; billingPlan: string },
    draftLimitPeriod: DraftLimitPeriod,
    excludeDraftId?: string
): Prisma.NdaDraftWhereInput {
    const periodStart =
        draftLimitPeriod === 'quarter'
            ? getCurrentQuarterStart()
            : draftLimitPeriod === 'month'
                ? getCurrentMonthStart()
                : null
    const freeFrom = org.billingPlan === 'FREE' ? FREE_ALLOWANCE_COUNTS_FROM : null
    // Use the later of the two start dates.
    const from = periodStart && freeFrom ? (periodStart > freeFrom ? periodStart : freeFrom) : (periodStart ?? freeFrom)

    return {
        organizationId: org.id,
        status: { in: ['SENT', 'SIGNED'] },
        ...(from ? { sentAt: { gte: from } } : {}),
        ...(excludeDraftId ? { id: { not: excludeDraftId } } : {}),
    }
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

    const whereClause = sentNdaCountWhere(org, limits.draftLimitPeriod, draftId)

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
