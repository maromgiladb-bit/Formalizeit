/**
 * Helpers for the NDA reject/counter negotiation loop.
 *
 * A reviewer responds to the other party's proposed changes per field:
 *   accepted  — take the proposed value
 *   rejected  — decline it (revert), with no new offer
 *   countered — decline it and propose a different value
 *
 * Signing is only allowed once a party has fully accepted the other side's
 * latest proposal. Any rejection or counter sends the NDA back for another round.
 */

export type SuggestionAction = 'accepted' | 'rejected' | 'countered';

export interface SuggestionResponse {
  action: SuggestionAction;
  counterValue?: string;
}

export type SuggestionResponses = Record<string, SuggestionResponse | undefined>;

export interface NegotiationSummary {
  accepted: string[];
  rejected: string[];
  countered: string[];
}

/** Turn a field key (e.g. "party_b_name") into a readable label ("Party B Name"). */
export function humanizeField(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\bparty a\b/i, 'Party A')
    .replace(/\bparty b\b/i, 'Party B')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Group a set of per-field responses into accepted / rejected / countered field labels. */
export function summarizeResponses(responses: SuggestionResponses): NegotiationSummary {
  const summary: NegotiationSummary = { accepted: [], rejected: [], countered: [] };
  for (const [field, resp] of Object.entries(responses)) {
    if (!resp) continue;
    const label = humanizeField(field);
    if (resp.action === 'accepted') summary.accepted.push(label);
    else if (resp.action === 'rejected') summary.rejected.push(label);
    else if (resp.action === 'countered') summary.countered.push(label);
  }
  return summary;
}

/**
 * A reviewer has fully agreed (may proceed to sign) only when they proposed no
 * new changes AND every response was an acceptance. Any reject/counter, or any
 * fresh suggested change, keeps the negotiation open.
 */
export function isFullyAccepted(
  responses: SuggestionResponses,
  hasSuggestedChanges: boolean,
): boolean {
  if (hasSuggestedChanges) return false;
  return Object.values(responses).every((r) => !r || r.action === 'accepted');
}

/**
 * A counter with no actual value is not an offer — it is a refusal. Both review
 * UIs can emit one (neither checks for emptiness before calling their counter
 * handler), so normalise before anything else reasons about the round.
 */
export function normalizeResponses(responses: SuggestionResponses): SuggestionResponses {
  const out: SuggestionResponses = {};
  for (const [field, resp] of Object.entries(responses || {})) {
    if (!resp) continue;
    if (resp.action === 'countered' && !resp.counterValue?.trim()) {
      out[field] = { action: 'rejected' };
    } else if (resp.action === 'countered') {
      out[field] = { action: 'countered', counterValue: resp.counterValue!.trim() };
    } else {
      out[field] = { action: resp.action };
    }
  }
  return out;
}

/**
 * What the viewer must answer right now, read off the newest revision.
 *
 * Only the latest round is outstanding. Each round's `suggestedChanges` already
 * carries forward every counter the submitter kept alive, so an older revision
 * holds nothing that is still open — reading anything but the newest one would
 * show a stale offer.
 *
 * Deliberately NOT value-diffed against the agreed document. A counter that
 * re-proposes the value already in the document ("no, keep 12 months") is still
 * a response the other party has to see; diffing it away would hide the newest
 * counter behind an unchanged field, which is the one thing this loop must
 * never do.
 *
 * `filledFields` are deliberately excluded: they are values the submitter was
 * asked to provide, so `applyNegotiationRound` has already written them into the
 * agreed document. They are not offers awaiting an answer.
 */
export function pendingSuggestionsFromRevision(
  revisionContent: unknown,
  viewerEmail: string,
): Record<string, string> {
  if (!revisionContent || typeof revisionContent !== 'object') return {};
  const content = revisionContent as Record<string, unknown>;

  // Your own last submission is not something you respond to.
  const submittedBy = content.submittedBy as string | undefined;
  if (submittedBy && viewerEmail && submittedBy.toLowerCase() === viewerEmail.toLowerCase()) {
    return {};
  }

  const suggested = (content.suggestedChanges as Record<string, string> | undefined) || {};
  const pending: Record<string, string> = {};
  for (const [field, value] of Object.entries(suggested)) {
    if (typeof value === 'string' && value.trim()) pending[field] = value;
  }
  return pending;
}

export interface NegotiationRoundInput {
  /** draft.content as it stood BEFORE this round — the agreed document. */
  currentContent: Record<string, unknown>;
  /** Values the submitter typed into fields they were asked to fill. */
  filledFields?: Record<string, string>;
  /** Fresh changes the submitter is proposing for locked fields. */
  suggestedChanges?: Record<string, string>;
  /** The submitter's per-field answers to the other party's pending proposals. */
  responses?: SuggestionResponses;
  /** The other party's pending proposals, as the server knows them. */
  incomingSuggestions?: Record<string, string>;
}

export interface NegotiationRoundResult {
  /** The new agreed document. Counters and fresh suggestions are NOT in here. */
  newContent: Record<string, unknown>;
  /** filledFields minus anything the submitter rejected or countered. */
  appliedFilledFields: Record<string, string>;
  /** What the other party will review next round. */
  outgoingSuggestions: Record<string, string>;
  /** Fresh suggestions only. Drives which email template is sent. */
  hasFreshSuggestions: boolean;
  /** Anything at all for the other party to respond to. Drives the state machine. */
  hasOpenItems: boolean;
  summary: NegotiationSummary;
  fullyAccepted: boolean;
  /** The normalised responses, for storage in the revision. */
  responses: SuggestionResponses;
}

/**
 * Resolve one round of negotiation into a new agreed document plus the set of
 * proposals the other party must answer.
 *
 * The invariant that makes the whole loop work: **`draft.content` is the AGREED
 * document.** Only accepted values and requested fills land in it. A counter is
 * an offer, not an edit, so it stays out of the content until the other side
 * accepts it. This is not merely tidy — the reviewer UI builds its pending list
 * by diffing proposals against `draft.content`, so a proposal written into the
 * content would be invisible to the very person who has to respond to it.
 */
export function applyNegotiationRound(input: NegotiationRoundInput): NegotiationRoundResult {
  const { currentContent, filledFields, suggestedChanges, incomingSuggestions } = input;
  const responses = normalizeResponses(input.responses || {});

  const newContent: Record<string, unknown> = { ...currentContent };
  const appliedFilledFields: Record<string, string> = {};

  // 1. Apply filled fields, but responses win. The client sweeps every dirtied
  //    value into filledFields regardless of how the field was answered, so a
  //    rejected or countered field can arrive here carrying a value we must not
  //    write.
  for (const [field, value] of Object.entries(filledFields || {})) {
    const action = responses[field]?.action;
    if (action === 'rejected' || action === 'countered') continue;
    newContent[field] = value;
    appliedFilledFields[field] = value;
  }

  // 2. Resolve each response against the document.
  for (const [field, resp] of Object.entries(responses)) {
    if (!resp) continue;
    if (resp.action === 'accepted') {
      // Prefer the value the server knows was offered over whatever the client
      // sent, so a tampered client cannot "accept" a value never proposed.
      const agreed =
        incomingSuggestions?.[field] ?? filledFields?.[field] ?? currentContent[field];
      newContent[field] = agreed;
      if (typeof agreed === 'string') appliedFilledFields[field] = agreed;
    } else {
      // Rejected and countered both leave the agreed document untouched.
      newContent[field] = currentContent[field];
      delete appliedFilledFields[field];
    }
  }

  // 3. Build what the other party reviews next: counters, then fresh
  //    suggestions layered over them.
  const outgoingSuggestions: Record<string, string> = {};
  for (const [field, resp] of Object.entries(responses)) {
    if (resp?.action === 'countered' && resp.counterValue) {
      outgoingSuggestions[field] = resp.counterValue;
    }
  }
  for (const [field, value] of Object.entries(suggestedChanges || {})) {
    if (value && value.trim()) outgoingSuggestions[field] = value.trim();
  }
  // Rejection is final and beats everything, including a same-field suggestion.
  for (const [field, resp] of Object.entries(responses)) {
    if (resp?.action === 'rejected') delete outgoingSuggestions[field];
  }

  const hasFreshSuggestions = Object.values(suggestedChanges || {}).some(
    (v) => !!v && !!v.trim(),
  );
  const hasOpenItems = Object.keys(outgoingSuggestions).length > 0;

  return {
    newContent,
    appliedFilledFields,
    outgoingSuggestions,
    hasFreshSuggestions,
    hasOpenItems,
    summary: summarizeResponses(responses),
    fullyAccepted: isFullyAccepted(responses, hasOpenItems),
    responses,
  };
}
