import { BillingPlan } from "@prisma/client"

export const PLAN_LIMITS: Record<BillingPlan, { maxUsers: number; maxActiveDrafts: number }> = {
    FREE: {
        maxUsers: 3,
        maxActiveDrafts: 3,
    },
    PRO: {
        maxUsers: 20,
        maxActiveDrafts: 200,
    },
    ENTERPRISE: {
        maxUsers: 9999,
        maxActiveDrafts: 999999,
    },
    DEV: {
        maxUsers: Infinity,
        maxActiveDrafts: Infinity,
    },
}

export function resolveLimits(org: {
    billingPlan: BillingPlan
    maxUsers: number | null
    maxActiveDrafts: number | null
}) {
    return {
        maxUsers: org.maxUsers ?? PLAN_LIMITS[org.billingPlan].maxUsers,
        maxActiveDrafts: org.maxActiveDrafts ?? PLAN_LIMITS[org.billingPlan].maxActiveDrafts,
    }
}
