import { describe, it, expect } from 'vitest'
import { isSignupOpen } from '@/lib/featureFlags'
import { signupGateRedirect, signupHrefFor } from '@/lib/signupGate'

describe('isSignupOpen', () => {
  it.each([
    ['on', 'production', false],
    ['on', 'development', false],
    ['off', 'production', true],
    ['off', 'development', true],
    [undefined, 'production', false],
    [undefined, 'development', true],
  ])('%s / %s -> %s', (v, env, expected) => {
    expect(isSignupOpen(v, env)).toBe(expected)
  })
})

describe('signupGateRedirect', () => {
  it('redirects /signup paths when closed', () => {
    expect(signupGateRedirect('/signup', false)).toBe('/coming-soon')
    expect(signupGateRedirect('/signup/anything', false)).toBe('/coming-soon')
  })
  it('passes /signup when open', () => {
    expect(signupGateRedirect('/signup', true)).toBeNull()
    expect(signupGateRedirect('/signup/x', true)).toBeNull()
  })
  it.each([
    '/sign-in', '/sign-nda-public/x', '/fillndahtml-public/x', '/api/webhooks/clerk',
    '/api/cron/nda-reminders', '/terms', '/', '/signups', '/coming-soon',
  ])('leaves %s alone in both modes', (p) => {
    expect(signupGateRedirect(p, false)).toBeNull()
    expect(signupGateRedirect(p, true)).toBeNull()
  })
})

describe('signupHrefFor', () => {
  it('points at the right place', () => {
    expect(signupHrefFor(true)).toBe('/signup')
    expect(signupHrefFor(false)).toBe('/coming-soon')
  })
})
