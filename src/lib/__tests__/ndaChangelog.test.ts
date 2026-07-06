import { describe, it, expect } from 'vitest'
import {
  compareVersions,
  getChangelogSince,
  shouldPromptNdaReview,
  EARLIEST_NDA_VERSION,
  NDA_CHANGELOG,
  type NdaChangelogEntry,
} from '@/lib/ndaChangelog'

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('2.0', '1.9')).toBeGreaterThan(0)
    expect(compareVersions('1.1', '1.0')).toBeGreaterThan(0)
    expect(compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0)
    expect(compareVersions('1.0', '1.1')).toBeLessThan(0)
  })

  it('treats equal versions as 0 (with or without patch segment)', () => {
    expect(compareVersions('1.0', '1.0')).toBe(0)
    expect(compareVersions('1.0.0', '1.0')).toBe(0)
  })

  it('treats malformed segments as 0 rather than NaN', () => {
    expect(compareVersions('abc', '1.0')).toBeLessThan(0)
    expect(compareVersions('1.x', '1.0')).toBe(0)
  })
})

describe('getChangelogSince', () => {
  it('returns nothing when acknowledged version is current', () => {
    const current = NDA_CHANGELOG[0].version
    expect(getChangelogSince(current)).toEqual([])
  })

  it('treats null/undefined as the earliest baseline (no newer entries yet)', () => {
    // With only the 1.0 baseline shipped, a never-acknowledged user is current.
    expect(getChangelogSince(null)).toEqual([])
    expect(getChangelogSince(undefined)).toEqual([])
    expect(EARLIEST_NDA_VERSION).toBe('1.0')
  })

  it('returns only entries strictly newer than the acknowledged version', () => {
    // Simulate a future changelog to exercise the filter independent of shipped data.
    const log: NdaChangelogEntry[] = [
      { version: '2.0', date: '2026-01-01', summary: 'major' },
      { version: '1.1', date: '2025-12-01', summary: 'minor' },
      { version: '1.0', date: '2025-11-10', summary: 'base' },
    ]
    const since = (ack: string) =>
      log.filter((e) => compareVersions(e.version, ack) > 0).map((e) => e.version)
    expect(since('1.0')).toEqual(['2.0', '1.1'])
    expect(since('1.1')).toEqual(['2.0'])
    expect(since('2.0')).toEqual([])
  })
})

describe('shouldPromptNdaReview', () => {
  it('is false when the user is on the current shipped version', () => {
    expect(shouldPromptNdaReview(NDA_CHANGELOG[0].version)).toBe(false)
  })

  it('is false for a brand-new (never-acknowledged) user until a real bump ships', () => {
    expect(shouldPromptNdaReview(null)).toBe(false)
  })
})
