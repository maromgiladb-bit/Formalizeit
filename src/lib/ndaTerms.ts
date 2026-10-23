/**
 * Helpers for NDA deal-variable fields (title defaulting, term comparisons).
 * Pure functions so they can be unit-tested and reused server- or client-side.
 */

/**
 * A document title is optional in the form. When left blank we derive one from
 * the counterparty (Party B) name, falling back to a dated label so every NDA
 * still has a meaningful title on the dashboard.
 */
export function deriveNdaTitle(
  docName: string,
  partyBName?: string,
  now: Date = new Date(),
): string {
  const explicit = (docName || '').trim();
  if (explicit) return explicit;

  const counterparty = (partyBName || '').trim();
  if (counterparty) return `NDA — ${counterparty}`;

  return `NDA — ${now.toISOString().slice(0, 10)}`;
}

/**
 * True when the confidentiality period is shorter than the agreement term —
 * usually a mistake, since obligations normally outlast the term. Returns false
 * for empty/invalid/non-positive inputs so we don't warn on a half-filled form.
 */
export function confidentialityBelowTerm(
  termMonths: string | number,
  confidentialityMonths: string | number,
): boolean {
  const term = Number(termMonths);
  const confidentiality = Number(confidentialityMonths);
  if (!Number.isFinite(term) || !Number.isFinite(confidentiality)) return false;
  if (term <= 0 || confidentiality <= 0) return false;
  return confidentiality < term;
}
