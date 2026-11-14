import { describe, it, expect } from 'vitest'
import { transitionBlockedReason, signerLinkBlockedReason } from '@/lib/ndaTransitions'

describe('transitionBlockedReason', () => {
  it('lets an unsent draft be sent either way', () => {
    expect(transitionBlockedReason('send_for_review', { status: 'DRAFT', workflowState: 'DRAFT' })).toBeNull()
    expect(transitionBlockedReason('send_for_input', { status: 'DRAFT', workflowState: 'DRAFT' })).toBeNull()
  })

  it('lets the sender re-send while Party B has it and nobody has signed', () => {
    expect(
      transitionBlockedReason('send_for_review', {
        status: 'SENT',
        workflowState: 'AWAITING_PARTY_B_REVIEW',
        signers: [{ status: 'PENDING' }],
      }),
    ).toBeNull()
  })

  it('never re-sends a signed, completed or cancelled NDA', () => {
    expect(transitionBlockedReason('send_for_review', { status: 'SIGNED', workflowState: 'COMPLETE' })).not.toBeNull()
    expect(transitionBlockedReason('send_for_review', { status: 'CANCELLED', workflowState: 'DRAFT' })).not.toBeNull()
    expect(
      transitionBlockedReason('send_for_review', {
        status: 'SENT',
        workflowState: 'AWAITING_PARTY_B_REVIEW',
        signers: [{ status: 'SIGNED' }],
      }),
    ).not.toBeNull()
    expect(
      transitionBlockedReason('send_for_review', { status: 'SENT', workflowState: 'AWAITING_PARTY_A_SIGNATURE' }),
    ).not.toBeNull()
  })

  it('sends for input only from an unsent draft', () => {
    expect(
      transitionBlockedReason('send_for_input', { status: 'SENT', workflowState: 'AWAITING_PARTY_B_REVIEW' }),
    ).not.toBeNull()
  })

  it('answers a round only while it awaits Party A review', () => {
    for (const action of ['request_changes', 'approve_changes'] as const) {
      expect(transitionBlockedReason(action, { status: 'SENT', workflowState: 'AWAITING_PARTY_A_REVIEW' })).toBeNull()
      expect(transitionBlockedReason(action, { status: 'SENT', workflowState: 'AWAITING_PARTY_B_REVIEW' })).not.toBeNull()
      expect(transitionBlockedReason(action, { status: 'SIGNED', workflowState: 'COMPLETE' })).not.toBeNull()
    }
  })
})

describe('signerLinkBlockedReason', () => {
  const draft = { status: 'SENT', workflowState: 'AWAITING_PARTY_B_REVIEW' }

  it('allows an open signer on the latest request', () => {
    expect(signerLinkBlockedReason({ status: 'PENDING', signRequestId: 'r2' }, 'r2', draft)).toBeNull()
  })

  it('blocks a replaced or closed link', () => {
    expect(signerLinkBlockedReason({ status: 'DECLINED', signRequestId: 'r2' }, 'r2', draft)).not.toBeNull()
    expect(signerLinkBlockedReason({ status: 'EXPIRED', signRequestId: 'r2' }, 'r2', draft)).not.toBeNull()
    expect(signerLinkBlockedReason({ status: 'PENDING', signRequestId: 'r1' }, 'r2', draft)).not.toBeNull()
  })

  it('blocks a cancelled NDA', () => {
    expect(
      signerLinkBlockedReason({ status: 'PENDING', signRequestId: 'r2' }, 'r2', { status: 'CANCELLED' }),
    ).not.toBeNull()
  })
})
