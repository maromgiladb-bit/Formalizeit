import { BillingPlan } from "@prisma/client"

export type DraftLimitPeriod = 'total' | 'quarter'

export const PLAN_LIMITS: Record<BillingPlan, { maxUsers: number; maxActiveDrafts: number; draftLimitPeriod: DraftLimitPeriod }> = {
    FREE: {
        maxUsers: 1,
        maxActiveDrafts: 3,
        draftLimitPeriod: 'total',
    },
    PRO: {
        maxUsers: 10,
        maxActiveDrafts: 25,
        draftLimitPeriod: 'quarter',
    },
    ENTERPRISE: {
        maxUsers: 9999,
        maxActiveDrafts: 999999,
        draftLimitPeriod: 'total',
    },
    DEV: {
        maxUsers: Infinity,
        maxActiveDrafts: Infinity,
        draftLimitPeriod: 'total',
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

    const draftLimitPeriod = PLAN_LIMITS[org.billingPlan].draftLimitPeriod

    return {
        maxUsers,
        maxActiveDrafts,
        draftLimitPeriod,
    }
}

/** Returns the first day of the current calendar quarter (UTC). */
export function getCurrentQuarterStart(): Date {
    const now = new Date()
    const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3
    return new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1))
}
