import { describe, it, expect, vi } from 'vitest'

// Pin to paid-plans-on so the original expectations don't flip with the env. Beta behaviour is
// tested below via the explicit paidPlansEnabled argument.
vi.mock('@/lib/featureFlags', () => ({ PAID_PLANS_ENABLED: true, BETA_LABEL: true, FORMI_ENABLED: false }))

import { resolveLimits, effectivePlanLimits, PLAN_LIMITS } from '@/billing/planLimits'

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

describe('free beta (paid plans off)', () => {
  it('lifts FREE to unlimited NDAs and the TEAM user cap', () => {
    const limits = resolveLimits(org('FREE'), false)
    expect(limits.maxActiveDrafts).toBe(Infinity)
    expect(limits.maxUsers).toBe(PLAN_LIMITS.TEAM.maxUsers)
    expect(limits.maxUsers).toBe(10)
  })

  it('leaves PRO, TEAM and ENTERPRISE unchanged', () => {
    for (const plan of ['PRO', 'TEAM', 'ENTERPRISE'] as const) {
      expect(resolveLimits(org(plan), false)).toEqual(resolveLimits(org(plan), true))
    }
    expect(effectivePlanLimits('PRO', false)).toBe(PLAN_LIMITS.PRO)
  })

  it('a per-company settings override still wins', () => {
    const limits = resolveLimits(org('FREE', { maxUsers: 2, maxActiveDrafts: 7 }), false)
    expect(limits.maxUsers).toBe(2)
    expect(limits.maxActiveDrafts).toBe(7)
  })

  it('does not touch PLAN_LIMITS.FREE (3 NDAs, 1 user)', () => {
    resolveLimits(org('FREE'), false)
    expect(PLAN_LIMITS.FREE.maxActiveDrafts).toBe(3)
    expect(PLAN_LIMITS.FREE.maxUsers).toBe(1)
    expect(effectivePlanLimits('FREE', true)).toBe(PLAN_LIMITS.FREE)
  })
})
