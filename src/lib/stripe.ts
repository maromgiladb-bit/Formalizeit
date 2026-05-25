import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
} as const
