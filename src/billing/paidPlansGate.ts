import { NextResponse } from 'next/server'
import { PAID_PLANS_ENABLED } from '@/lib/featureFlags'

/**
 * Guard for routes that START a new paid plan (checkout, upgrade, downgrade). Returns a 403
 * response while the free beta is on, or null when paid plans are enabled. Call first in the handler.
 */
export function paidPlansDisabledResponse(paidPlansEnabled: boolean = PAID_PLANS_ENABLED): NextResponse | null {
  if (paidPlansEnabled) return null
  return NextResponse.json(
    { error: "Paid plans aren't available during the beta.", code: 'PAID_PLANS_DISABLED' },
    { status: 403 }
  )
}
