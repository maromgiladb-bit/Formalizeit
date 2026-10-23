'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isTermsGatedPath } from '@/lib/legalVersions'

/**
 * Fallback gate: a signed-in user who has not accepted the current Terms /
 * Privacy Policy is sent to /accept-terms when they open an account route.
 * Receiver pages, legal pages, /accept-terms and API routes are never gated.
 */
export default function TermsGate({ needsTerms }: { needsTerms: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (needsTerms && isTermsGatedPath(pathname)) {
      router.replace(`/accept-terms?next=${encodeURIComponent(pathname)}`)
    }
  }, [needsTerms, pathname, router])

  return null
}
