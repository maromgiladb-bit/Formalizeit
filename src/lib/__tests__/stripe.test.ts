import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  StripeNotConfiguredError,
  getStripe,
  isStripeConfigured,
  missingStripeEnvVars,
  resetStripeClientForTests,
} from '@/lib/stripe'

const VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_MONTHLY_PRICE_ID',
  'STRIPE_PRO_ANNUAL_PRICE_ID',
  'STRIPE_TEAM_MONTHLY_PRICE_ID',
  'STRIPE_TEAM_ANNUAL_PRICE_ID',
] as const

describe('stripe config', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const v of VARS) {
      saved[v] = process.env[v]
      delete process.env[v]
    }
    resetStripeClientForTests()
  })

  afterEach(() => {
    for (const v of VARS) {
      if (saved[v] === undefined) delete process.env[v]
      else process.env[v] = saved[v]
    }
    resetStripeClientForTests()
  })

  function setAll() {
    for (const v of VARS) process.env[v] = `test_${v}`
  }

  it('is not configured when nothing is set', () => {
    expect(isStripeConfigured()).toBe(false)
    expect(missingStripeEnvVars()).toHaveLength(VARS.length)
  })

  it('is configured when every var is set', () => {
    setAll()
    expect(isStripeConfigured()).toBe(true)
    expect(missingStripeEnvVars()).toEqual([])
  })

  it('is not configured when a single var is missing or blank', () => {
    setAll()
    process.env.STRIPE_TEAM_ANNUAL_PRICE_ID = '  '
    expect(isStripeConfigured()).toBe(false)
    expect(missingStripeEnvVars()).toEqual(['STRIPE_TEAM_ANNUAL_PRICE_ID'])
  })

  it('getStripe throws StripeNotConfiguredError without a secret key', () => {
    expect(() => getStripe()).toThrow(StripeNotConfiguredError)
  })

  it('getStripe returns a cached client when the key is set', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    const a = getStripe()
    expect(a).toBe(getStripe())
  })
})
