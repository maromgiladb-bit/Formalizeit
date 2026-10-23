import { SIGNUP_OPEN } from '@/lib/featureFlags'

/** True for `/signup` and anything beneath it (not `/signup-foo`). */
export function isSignupPath(pathname: string): boolean {
  return pathname === '/signup' || pathname.startsWith('/signup/')
}

/** Where a request should be redirected while sign-up is closed, or null to let it through. */
export function signupGateRedirect(pathname: string, signupOpen: boolean): string | null {
  return !signupOpen && isSignupPath(pathname) ? '/coming-soon' : null
}

/** Target for "create account" calls to action. */
export function signupHrefFor(signupOpen: boolean): '/signup' | '/coming-soon' {
  return signupOpen ? '/signup' : '/coming-soon'
}

export function signupHref(): '/signup' | '/coming-soon' {
  return signupHrefFor(SIGNUP_OPEN)
}
