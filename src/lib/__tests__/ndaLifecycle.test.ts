import { describe, it, expect } from 'vitest'
import { isNdaFinalized, canHardDeleteNda, canArchiveNda } from '@/lib/ndaLifecycle'

describe('isNdaFinalized', () => {
  it('is true for SIGNED status (any case)', () => {
    expect(isNdaFinalized({ status: 'SIGNED' })).toBe(true)
    expect(isNdaFinalized({ status: 'signed' })).toBe(true)
  })
  it('is true for COMPLETE / SIGNING_COMPLETE workflow state', () => {
    expect(isNdaFinalized({ status: 'sent', workflowState: 'COMPLETE' })).toBe(true)
    expect(isNdaFinalized({ status: 'sent', workflowState: 'SIGNING_COMPLETE' })).toBe(true)
  })
  it('is false for an in-flight NDA', () => {
    expect(isNdaFinalized({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE' })).toBe(false)
  })
})

describe('canHardDeleteNda', () => {
  it('allows unsent drafts', () => {
    expect(canHardDeleteNda({ status: 'draft', workflowState: 'DRAFT' })).toBe(true)
  })
  it('allows legacy cancelled rows', () => {
    expect(canHardDeleteNda({ status: 'cancelled' })).toBe(true)
  })
  it('allows expired in-flight NDAs', () => {
    expect(canHardDeleteNda({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE', expired: true })).toBe(true)
  })
  it('refuses active (non-expired) in-flight NDAs', () => {
    expect(canHardDeleteNda({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE', expired: false })).toBe(false)
  })
  it('refuses finalized NDAs even if flagged expired', () => {
    expect(canHardDeleteNda({ status: 'signed', workflowState: 'COMPLETE', expired: true })).toBe(false)
  })
})

describe('canArchiveNda', () => {
  it('allows finalized NDAs', () => {
    expect(canArchiveNda({ status: 'signed', workflowState: 'COMPLETE' })).toBe(true)
  })
  it('refuses non-finalized NDAs', () => {
    expect(canArchiveNda({ status: 'draft' })).toBe(false)
    expect(canArchiveNda({ status: 'sent', workflowState: 'AWAITING_PARTY_B_SIGNATURE' })).toBe(false)
  })
})
