import { describe, it, expect, vi, afterEach } from 'vitest'
import { newSignLinkExpiry, SIGN_LINK_TTL_MS, isSignerExpired, isDraftExpired, isValidSignLinkToken } from '@/lib/signLink'

describe('isValidSignLinkToken', () => {
  it('accepts a uuid, any case', () => {
    expect(isValidSignLinkToken('7b1e2c3d-4f5a-4b6c-8d9e-0f1a2b3c4d5e')).toBe(true)
    expect(isValidSignLinkToken('7B1E2C3D-4F5A-4B6C-8D9E-0F1A2B3C4D5E')).toBe(true)
  })

  it('rejects anything Postgres would refuse as a uuid', () => {
    for (const bad of ['', 'test-token', '7b1e2c3d-4f5a-4b6c-8d9e', '7b1e2c3d-4f5a-4b6c-8d9e-0f1a2b3c4d5e/x', "' OR 1=1 --"]) {
      expect(isValidSignLinkToken(bad)).toBe(false)
    }
  })
})

describe('SIGN_LINK_TTL_MS', () => {
  it('is a 2-week inactivity window', () => {
    expect(SIGN_LINK_TTL_MS).toBe(14 * 24 * 60 * 60 * 1000)
  })
})

describe('newSignLinkExpiry', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a timestamp exactly SIGN_LINK_TTL_MS from the provided base', () => {
    const from = new Date('2026-01-01T00:00:00.000Z')
    const expiry = newSignLinkExpiry(from)
    expect(expiry.getTime() - from.getTime()).toBe(SIGN_LINK_TTL_MS)
  })

  it('defaults to now + TTL when no base is given', () => {
    const now = new Date('2026-07-06T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const expiry = newSignLinkExpiry()
    expect(expiry.getTime()).toBe(now.getTime() + SIGN_LINK_TTL_MS)
  })

  it('does not mutate the passed-in date', () => {
    const from = new Date('2026-01-01T00:00:00.000Z')
    const original = from.getTime()
    newSignLinkExpiry(from)
    expect(from.getTime()).toBe(original)
  })
})

describe('isSignerExpired', () => {
  const now = new Date('2026-07-06T12:00:00.000Z').getTime()
  const past = new Date('2026-07-01T00:00:00.000Z')
  const future = new Date('2026-08-01T00:00:00.000Z')

  it('is false for a signed signer even if past expiresAt', () => {
    expect(isSignerExpired({ status: 'SIGNED', expiresAt: past }, now)).toBe(false)
  })

  it('is false for a declined signer', () => {
    expect(isSignerExpired({ status: 'DECLINED', expiresAt: past }, now)).toBe(false)
  })

  it('is true when status is EXPIRED', () => {
    expect(isSignerExpired({ status: 'EXPIRED', expiresAt: future }, now)).toBe(true)
  })

  it('is true when an open signer is past its expiresAt', () => {
    expect(isSignerExpired({ status: 'SENT', expiresAt: past }, now)).toBe(true)
  })

  it('is false when an open signer is still within expiresAt', () => {
    expect(isSignerExpired({ status: 'SENT', expiresAt: future }, now)).toBe(false)
  })

  it('is false when an open signer has no expiresAt', () => {
    expect(isSignerExpired({ status: 'PENDING', expiresAt: null }, now)).toBe(false)
  })
})

describe('isDraftExpired', () => {
  const now = new Date('2026-07-06T12:00:00.000Z').getTime()
  const past = new Date('2026-07-01T00:00:00.000Z')

  it('is false for null/empty signer lists', () => {
    expect(isDraftExpired(null, now)).toBe(false)
    expect(isDraftExpired([], now)).toBe(false)
  })

  it('is true when any signer is expired', () => {
    expect(isDraftExpired(
      [{ status: 'SIGNED', expiresAt: past }, { status: 'SENT', expiresAt: past }],
      now,
    )).toBe(true)
  })
})
