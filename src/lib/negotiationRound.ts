import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { refreshSignLinkExpiryForRequest } from '@/lib/signLink';
import type { NegotiationRoundResult } from '@/lib/negotiation';

/**
 * Who submitted this round. The two entry points differ in how they
 * authenticate and therefore in how the audit trail attributes the action:
 * the public endpoint knows a signer token, the dashboard knows a Clerk user.
 * Everything downstream of that distinction is identical, which is why it lives
 * here rather than being duplicated in both routes.
 */
export type RoundActor =
  | { kind: 'signer'; signerId: string; email: string; isPartyA: boolean }
  | { kind: 'user'; userId: string; email: string; isPartyA: true };

export interface PersistRoundArgs {
  draftId: string;
  organizationId: string;
  signRequestId: string;
  actor: RoundActor;
  round: NegotiationRoundResult;
  newWorkflowState: string;
  /** Extra keys to merge into the draft content after the round is resolved. */
  contentOverlay?: Record<string, unknown>;
  /** Audit event type. Defaults to UPDATED. */
  eventType?: 'UPDATED' | 'CHANGES_ACCEPTED' | 'CHANGES_REQUESTED';
  /** Extra audit metadata, merged over the defaults. */
  auditMetadata?: Record<string, unknown>;
}

/**
 * Write one resolved negotiation round to the database: a revision recording
 * what was proposed and answered, the updated agreed document, and an audit
 * event.
 *
 * The revision's content keys are load-bearing. Both reviewer UIs read
 * `suggestedChanges`, `filledFields` and `submittedBy` off it, so those names
 * must not change. Note that `filledFields` stores the round's *applied* fields:
 * a rejected field left in there would resurface to the other party as a fresh
 * suggestion on the next load.
 */
export async function persistNegotiationRound(
  args: PersistRoundArgs,
): Promise<{ revisionId: string }> {
  const {
    draftId,
    organizationId,
    signRequestId,
    actor,
    round,
    newWorkflowState,
    contentOverlay,
    eventType = 'UPDATED',
    auditMetadata,
  } = args;

  const revision = await prisma.ndaRevision.create({
    data: {
      draftId,
      content: {
        filledFields: round.appliedFilledFields,
        suggestedChanges: round.outgoingSuggestions,
        suggestionResponses: round.responses,
        submittedBy: actor.email,
        submittedAt: new Date().toISOString(),
      } as unknown as Prisma.InputJsonObject,
    },
  });

  await prisma.ndaDraft.update({
    where: { id: draftId },
    data: {
      content: { ...round.newContent, ...(contentOverlay || {}) } as unknown as Prisma.InputJsonObject,
      workflowState: newWorkflowState as never,
      lastEditedBy: actor.isPartyA ? 'party_a' : 'party_b',
      pendingInputFields: [],
    },
  });

  await prisma.signRequest.update({
    where: { id: signRequestId },
    data: { revisionId: revision.id },
  });

  // Someone acted, so keep every open link on this NDA alive. Best-effort by
  // design: never fail the round because the inactivity clock could not reset.
  try {
    await refreshSignLinkExpiryForRequest(signRequestId);
  } catch (e) {
    console.error('refresh expiry failed:', e);
  }

  await prisma.auditEvent.create({
    data: {
      organizationId,
      draftId,
      signRequestId,
      signerId: actor.kind === 'signer' ? actor.signerId : undefined,
      userId: actor.kind === 'user' ? actor.userId : undefined,
      eventType,
      metadata: {
        action: actor.isPartyA ? 'party_a_review' : 'party_b_submitted_input',
        filled_fields: Object.keys(round.appliedFilledFields),
        accepted: round.summary.accepted,
        rejected: round.summary.rejected,
        countered: round.summary.countered,
        has_suggestions: round.hasFreshSuggestions,
        has_open_items: round.hasOpenItems,
        new_state: newWorkflowState,
        ...(auditMetadata || {}),
      },
    },
  });

  return { revisionId: revision.id };
}
