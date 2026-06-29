export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  TEAM_MONTHLY: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
  TEAM_ANNUAL: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID!,
} as const

export type PaidPlan = 'PRO' | 'TEAM'

/** Resolve the Stripe price id for a plan + billing cycle. */
export function priceIdFor(plan: PaidPlan, cycle: 'monthly' | 'annual'): string {
  if (plan === 'TEAM') {
    return cycle === 'annual' ? STRIPE_PRICE_IDS.TEAM_ANNUAL : STRIPE_PRICE_IDS.TEAM_MONTHLY
  }
  return cycle === 'annual' ? STRIPE_PRICE_IDS.PRO_ANNUAL : STRIPE_PRICE_IDS.PRO_MONTHLY
}

/** Reverse lookup: which plan does a Stripe price id belong to? */
export function planFromPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null
  if (priceId === STRIPE_PRICE_IDS.TEAM_MONTHLY || priceId === STRIPE_PRICE_IDS.TEAM_ANNUAL) return 'TEAM'
  if (priceId === STRIPE_PRICE_IDS.PRO_MONTHLY || priceId === STRIPE_PRICE_IDS.PRO_ANNUAL) return 'PRO'
  return null
}
