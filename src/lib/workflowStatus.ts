import type { StatusTone } from '@/components/ui/status-pill';

/**
 * One label per workflow state, shared by the dashboard, the view page, and
 * the editor badge so the same NDA never reads "Waiting on them" on one screen
 * and "Awaiting Party B" on another.
 *
 * `viewer` is who is looking: the company that sent the NDA ("sender", Party A)
 * or the counterparty who received it ("receiver", Party B). The same state is
 * "your turn" for one side and "waiting on them" for the other.
 */
export type WorkflowViewer = 'sender' | 'receiver';

export interface WorkflowStatusInput {
  workflowState: string | null | undefined;
  /** NdaDraft.status — compared case-insensitively (dashboard lowercases it). */
  status?: string | null;
  viewer: WorkflowViewer;
  /** Signing link has lapsed (sender needs to resend). */
  expired?: boolean;
}

export interface WorkflowStatusInfo {
  label: string;
  tone: StatusTone;
}

const YOUR_TURN_REVIEW: WorkflowStatusInfo = { label: 'Your turn: review', tone: 'action' };
const YOUR_TURN_SIGN: WorkflowStatusInfo = { label: 'Your turn: sign', tone: 'action' };
const WAITING_ON_THEM: WorkflowStatusInfo = { label: 'Waiting on them', tone: 'progress' };

export function getWorkflowStatusInfo({
  workflowState,
  status,
  viewer,
  expired,
}: WorkflowStatusInput): WorkflowStatusInfo {
  const s = (status || '').toLowerCase();
  const isSender = viewer === 'sender';
  const isComplete =
    workflowState === 'COMPLETE' || workflowState === 'SIGNING_COMPLETE' || s === 'signed';

  // A lapsed signing link needs the sender's attention (resend).
  if (expired && !isComplete && s !== 'cancelled') {
    return { label: 'Link expired', tone: 'action' };
  }

  switch (workflowState) {
    case 'AWAITING_INPUT':
      return { label: 'Awaiting input', tone: 'progress' };
    case 'REVIEWING_CHANGES':
      return { label: 'Review changes', tone: 'action' };
    case 'READY_TO_SIGN':
      return { label: 'Ready to sign', tone: 'progress' };
    case 'AWAITING_SIGNATURE':
      return { label: 'Awaiting signature', tone: 'progress' };
    case 'SIGNING_COMPLETE':
    case 'COMPLETE':
      return { label: 'Complete', tone: 'done' };
    case 'AWAITING_PARTY_A_REVIEW':
      return isSender ? YOUR_TURN_REVIEW : WAITING_ON_THEM;
    case 'AWAITING_PARTY_B_REVIEW':
      return isSender ? WAITING_ON_THEM : YOUR_TURN_REVIEW;
    case 'AWAITING_PARTY_A_SIGNATURE':
      return isSender ? YOUR_TURN_SIGN : WAITING_ON_THEM;
    case 'AWAITING_PARTY_B_SIGNATURE':
      return isSender ? WAITING_ON_THEM : YOUR_TURN_SIGN;
    case 'FILLING':
    default:
      if (s === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
      if (s === 'signed') return { label: 'Signed', tone: 'done' };
      if (s === 'sent' || s === 'pending') return { label: 'Sent', tone: 'progress' };
      return { label: 'Draft', tone: 'neutral' };
  }
}
