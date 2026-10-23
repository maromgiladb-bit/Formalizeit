/**
 * Current version of the Terms of Service + Privacy Policy, as the date they
 * were last updated. Bump this when either document changes materially: every
 * signed-in user is asked to accept again (see /accept-terms).
 */
export const LEGAL_VERSION = '2026-06-11'

/** Account areas where a signed-in user must have accepted the current terms. Receiver (public token) pages are intentionally NOT listed. */
const GATED_PREFIXES = [
  '/dashboard',
  '/mydrafts',
  '/settings',
  '/team',
  '/templates',
  '/fillndahtml',
  '/onboarding',
  '/view-nda',
  '/viewpdf',
]

export function hasAcceptedCurrentTerms(user: { termsAcceptedAt?: Date | null; termsVersion?: string | null } | null | undefined): boolean {
  return !!user && !!user.termsAcceptedAt && user.termsVersion === LEGAL_VERSION
}

/** True when the path is an account route that requires accepted terms. Segment-boundary match, so /fillndahtml-public is not gated. */
export function isTermsGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}
