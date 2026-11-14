import { BillingPlan } from "@prisma/client"
import { PAID_PLANS_ENABLED } from "@/lib/featureFlags"

export type DraftLimitPeriod = 'total' | 'quarter' | 'month'

export const PLAN_LIMITS: Record<BillingPlan, { maxUsers: number; maxActiveDrafts: number; draftLimitPeriod: DraftLimitPeriod }> = {
    FREE: {
        maxUsers: 1,
        maxActiveDrafts: 3,
        draftLimitPeriod: 'total',
    },
    PRO: {
        maxUsers: 1,
        maxActiveDrafts: Infinity,
        draftLimitPeriod: 'total',
    },
    TEAM: {
        maxUsers: 10,
        maxActiveDrafts: Infinity,
        draftLimitPeriod: 'total',
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

/**
 * When set, the FREE plan's NDA allowance only counts NDAs sent on/after this date (the "fresh 3
 * NDAs" hook used when paid plans launch). Null = count everything. Set it when switching
 * NEXT_PUBLIC_PAID_PLANS_ENABLED on.
 */
export const FREE_ALLOWANCE_COUNTS_FROM: Date | null = null

/**
 * Limits actually enforced. PLAN_LIMITS is the paid-launch truth and stays untouched; during the
 * free beta FREE is lifted to unlimited NDAs and TEAM's user cap. Other plans are unchanged.
 */
export function effectivePlanLimits(plan: BillingPlan, paidPlansEnabled: boolean = PAID_PLANS_ENABLED) {
    if (!paidPlansEnabled && plan === 'FREE') {
        return {
            maxUsers: PLAN_LIMITS.TEAM.maxUsers,
            maxActiveDrafts: Infinity,
            draftLimitPeriod: PLAN_LIMITS.FREE.draftLimitPeriod,
        }
    }
    return PLAN_LIMITS[plan]
}

export function resolveLimits(org: {
    billingPlan: BillingPlan
    settings?: unknown
}, paidPlansEnabled: boolean = PAID_PLANS_ENABLED) {
    const base = effectivePlanLimits(org.billingPlan, paidPlansEnabled)

    const settings = typeof org.settings === "object" && org.settings !== null
        ? (org.settings as Record<string, unknown>)
        : {}

    const maxUsers =
        typeof settings.maxUsers === "number" && Number.isFinite(settings.maxUsers)
            ? settings.maxUsers
            : base.maxUsers

    const maxActiveDrafts =
        typeof settings.maxActiveDrafts === "number" && Number.isFinite(settings.maxActiveDrafts)
            ? settings.maxActiveDrafts
            : base.maxActiveDrafts

    const draftLimitPeriod = base.draftLimitPeriod

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

/** Returns the first day of the current calendar month (UTC). */
export function getCurrentMonthStart(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}
