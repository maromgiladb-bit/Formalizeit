import { BillingPlan } from "@prisma/client"

export const PLAN_LIMITS: Record<BillingPlan, { maxUsers: number; maxActiveDrafts: number }> = {
    FREE: {
        maxUsers: 2,
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
    settings?: unknown
}) {
    const settings = typeof org.settings === "object" && org.settings !== null
        ? (org.settings as Record<string, unknown>)
        : {}

    const maxUsers =
        typeof settings.maxUsers === "number" && Number.isFinite(settings.maxUsers)
            ? settings.maxUsers
            : PLAN_LIMITS[org.billingPlan].maxUsers

    const maxActiveDrafts =
        typeof settings.maxActiveDrafts === "number" && Number.isFinite(settings.maxActiveDrafts)
            ? settings.maxActiveDrafts
            : PLAN_LIMITS[org.billingPlan].maxActiveDrafts

    return {
        maxUsers,
        maxActiveDrafts,
    }
}
