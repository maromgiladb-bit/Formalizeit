import { NextResponse } from 'next/server'

/** Clean 503 returned by billing routes when Stripe env vars are not set. */
export function billingUnavailableResponse() {
  return NextResponse.json(
    { error: 'Billing is not available yet', code: 'BILLING_UNAVAILABLE' },
    { status: 503 },
  )
}
