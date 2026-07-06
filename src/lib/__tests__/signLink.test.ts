import { describe, it, expect, vi, afterEach } from 'vitest'
import { newSignLinkExpiry, SIGN_LINK_TTL_MS, isSignerExpired, isDraftExpired } from '@/lib/signLink'

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
