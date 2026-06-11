// Shared types for the Formi NDA copilot — used by the API route, tools,
// the floating avatar component, and the editor page.

/**
 * Snapshot of the NDA fields Formi reviews. All values are strings, matching
 * the form state in src/app/fillndahtml/page.tsx (durations are month counts).
 */
export interface NdaContext {
	termMonths: string;
	confidentialityMonths: string;
	additionalTerms: string;
	purpose: string;
	governingLaw: string;
	ipOwnership: string;
	nonSolicit: string;
	exclusivity: string;
}

/**
 * A single structured risk finding produced by Formi via the `recordFindings`
 * tool. `field` is the offending form key (e.g. "term_months"), `fieldLabel`
 * is its human-readable English label (e.g. "Term Duration") so the UI and the
 * send-gate can tell the user exactly which field caused each warning.
 *
 * These values are ALWAYS emitted in English, even when Formi is chatting in
 * another language.
 */
export type FindingSeverity = "high" | "medium" | "low";

export interface Finding {
	severity: FindingSeverity;
	category: string;
	field: string;
	fieldLabel: string;
	message: string;
}

/**
 * Server-resolved identity/workspace context injected into Formi's system
 * prompt. Never trusted from the client — the route derives this from Clerk +
 * the active organization.
 */
export interface FormiUserContext {
	userName: string;
	role: string;
	companyName: string;
}
