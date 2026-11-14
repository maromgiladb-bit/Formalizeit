import { describe, it, expect } from 'vitest'
import { LEGAL_VERSION, hasAcceptedCurrentTerms, isTermsGatedPath } from '../legalVersions'

describe('hasAcceptedCurrentTerms', () => {
  it('requires timestamp and current version', () => {
    expect(hasAcceptedCurrentTerms(null)).toBe(false)
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: null, termsVersion: null })).toBe(false)
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: new Date(), termsVersion: 'old' })).toBe(false)
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION })).toBe(true)
  })
})

describe('isTermsGatedPath', () => {
  it('gates account routes', () => {
    expect(isTermsGatedPath('/dashboard')).toBe(true)
    expect(isTermsGatedPath('/settings/billing')).toBe(true)
    expect(isTermsGatedPath('/fillndahtml/abc')).toBe(true)
  })
  it('does not gate receivers, legal pages or the accept page', () => {
    expect(isTermsGatedPath('/fillndahtml-public/tok')).toBe(false)
    expect(isTermsGatedPath('/sign-nda-public/tok')).toBe(false)
    expect(isTermsGatedPath('/accept-terms')).toBe(false)
    expect(isTermsGatedPath('/terms')).toBe(false)
    expect(isTermsGatedPath('/privacy')).toBe(false)
    expect(isTermsGatedPath('/')).toBe(false)
  })
})
