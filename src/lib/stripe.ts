import Stripe from 'stripe'

export { STRIPE_PRICE_IDS, priceIdFor, planFromPriceId, type PaidPlan } from './stripe-price-ids'

/** Env vars that must all be present for billing to work. */
const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_MONTHLY_PRICE_ID',
  'STRIPE_PRO_ANNUAL_PRICE_ID',
  'STRIPE_TEAM_MONTHLY_PRICE_ID',
  'STRIPE_TEAM_ANNUAL_PRICE_ID',
] as const

/** Thrown by `getStripe()` when `STRIPE_SECRET_KEY` is missing. */
export class StripeNotConfiguredError extends Error {
  readonly code = 'BILLING_UNAVAILABLE'
  constructor(message = 'Stripe is not configured (STRIPE_SECRET_KEY is missing)') {
    super(message)
    this.name = 'StripeNotConfiguredError'
  }
}

/** True only when the secret key, webhook secret and every price id are set. */
export function isStripeConfigured(): boolean {
  return REQUIRED_ENV_VARS.every(name => Boolean(process.env[name]?.trim()))
}

/** Names of the Stripe env vars that are currently missing (for logs/diagnostics). */
export function missingStripeEnvVars(): string[] {
  return REQUIRED_ENV_VARS.filter(name => !process.env[name]?.trim())
}

let client: Stripe | null = null

/** Lazily create the Stripe client on first use. Never touches Stripe at import time. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new StripeNotConfiguredError()
  if (!client) {
    client = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return client
}

/** @internal test helper: drop the cached client. */
export function resetStripeClientForTests(): void {
  client = null
}

