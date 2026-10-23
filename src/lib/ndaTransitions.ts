/**
 * Which workflow states each state-changing NDA action may start from. One
 * table so the routes can't drift: before this, sending, requesting changes
 * and approving changes ran in any state, so re-sending a signed NDA flipped
 * it back to SENT and reopened the receiver's finished signature.
 *
 * Pure decision logic; the routes look up the draft and its signers and ask.
 */
import { isNdaFinalized } from '@/lib/ndaLifecycle'

export type NdaAction = 'send_for_review' | 'send_for_input' | 'request_changes' | 'approve_changes'

const ALLOWED_FROM: Record<NdaAction, readonly string[]> = {
  // Re-sending while Party B still has it lets the sender correct the
  // recipient before anyone has signed.
  send_for_review: ['DRAFT', 'AWAITING_PARTY_B_REVIEW'],
  send_for_input: ['DRAFT'],
  request_changes: ['AWAITING_PARTY_A_REVIEW'],
  approve_changes: ['AWAITING_PARTY_A_REVIEW'],
}

const BLOCKED_MESSAGE: Record<NdaAction, string> = {
  send_for_review: 'This NDA is already with the other party or signed, so it can\'t be sent again.',
  send_for_input: 'This NDA has already been sent.',
  request_changes: 'This NDA is not waiting for your review.',
  approve_changes: 'This NDA is not waiting for your review.',
}

export type TransitionInput = {
  status: string
  workflowState?: string | null
  /** Signers on the NDA's latest sign request; any SIGNED one blocks every action here. */
  signers?: ReadonlyArray<{ status: string }>
}

/** `null` when the action is allowed, otherwise the message to return (HTTP 409). */
export function transitionBlockedReason(action: NdaAction, nda: TransitionInput): string | null {
  const state = (nda.workflowState || 'DRAFT').toUpperCase()
  const blocked =
    isNdaFinalized(nda) ||
    nda.status.toUpperCase() === 'CANCELLED' ||
    !!nda.signers?.some((s) => s.status === 'SIGNED') ||
    !ALLOWED_FROM[action].includes(state)
  return blocked ? BLOCKED_MESSAGE[action] : null
}

export type SignerLinkInput = {
  status: string
  signRequestId: string
}

/**
 * Why a public signer link (the bearer token in `/sign-nda-public/{id}` and
 * `/fillndahtml-public/{id}`) may not act on the NDA, or `null` when it may.
 * Expiry by date is checked separately by the routes; this covers links that
 * were replaced (recipient changed, NDA re-sent) or an NDA that is closed.
 */
export function signerLinkBlockedReason(
  signer: SignerLinkInput,
  latestSignRequestId: string | null | undefined,
  draft: { status: string; workflowState?: string | null },
): string | null {
  if (draft.status.toUpperCase() === 'CANCELLED') return 'This NDA has been cancelled.'
  if (signer.status === 'DECLINED' || signer.status === 'EXPIRED') {
    return 'This link is no longer active. Please contact the sender for a new one.'
  }
  if (latestSignRequestId && signer.signRequestId !== latestSignRequestId) {
    return 'This link has been replaced by a newer one. Please use the latest link from the sender.'
  }
  return null
}
