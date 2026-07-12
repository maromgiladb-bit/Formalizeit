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
