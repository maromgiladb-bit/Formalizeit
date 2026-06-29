import { describe, it, expect } from 'vitest'
import { resolveLimits, PLAN_LIMITS } from '@/billing/planLimits'

function org(billingPlan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE', settings?: Record<string, unknown>) {
  return { billingPlan, settings: settings ?? null }
}

describe('resolveLimits', () => {
  it('returns FREE plan defaults when no settings override', () => {
    const limits = resolveLimits(org('FREE'))
    expect(limits.maxUsers).toBe(PLAN_LIMITS.FREE.maxUsers)
    expect(limits.maxActiveDrafts).toBe(PLAN_LIMITS.FREE.maxActiveDrafts)
    expect(limits.draftLimitPeriod).toBe('total')
  })

  it('returns PRO plan limits: unlimited NDAs, single seat', () => {
    const limits = resolveLimits(org('PRO'))
    expect(limits.maxUsers).toBe(1)
    expect(limits.maxActiveDrafts).toBe(Infinity)
    expect(limits.draftLimitPeriod).toBe('total')
  })

  it('returns TEAM plan limits: unlimited NDAs, up to 10 seats', () => {
    const limits = resolveLimits(org('TEAM'))
    expect(limits.maxUsers).toBe(10)
    expect(limits.maxActiveDrafts).toBe(Infinity)
    expect(limits.draftLimitPeriod).toBe('total')
  })

  it('respects settings overrides for maxUsers', () => {
    const limits = resolveLimits(org('FREE', { maxUsers: 5 }))
    expect(limits.maxUsers).toBe(5)
  })

  it('respects settings overrides for maxActiveDrafts', () => {
    const limits = resolveLimits(org('PRO', { maxActiveDrafts: 100 }))
    expect(limits.maxActiveDrafts).toBe(100)
  })

  it('ignores non-finite override values (falls back to plan default)', () => {
    const limits = resolveLimits(org('FREE', { maxUsers: NaN }))
    expect(limits.maxUsers).toBe(PLAN_LIMITS.FREE.maxUsers)
  })
})
