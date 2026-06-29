import { createHash } from 'crypto';
import { getTemplateById } from './templateManager';

/**
 * Signature evidence helpers — shared by the signing UIs and the sign API routes so the
 * recorded evidence always matches what the signer actually saw and did.
 *
 * Evidence captured at signing time (stored on AuditEvent):
 *  - ipAddress: where the signer was when they signed
 *  - templateSnapshot: the EXACT Standard NDA version actually signed — snapshotted at signing
 *    time and stored verbatim, never re-derived from the current active template, so changing
 *    the Standard NDA later never alters past records
 *  - agreementHash: SHA-256 fingerprint of the final signed PDF bytes (tamper-evidence)
 *  - authority: the signer's affirmation that they may sign in their company's name
 */

/**
 * The exact authority-to-sign affirmation the signer ticks before signing. Imported by both the
 * UI (checkbox label) and the server (recorded consent text) so they can never drift apart.
 */
export const AUTHORITY_CONSENT_TEXT =
	'I confirm that I am authorized to sign this agreement on behalf of, and in the name of, the company I represent, and that doing so legally binds that company.';

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string | null {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}
	const realIp = request.headers.get('x-real-ip');
	return realIp?.trim() || null;
}

/** SHA-256 fingerprint (hex) of the rendered PDF bytes. */
export function sha256Hex(buffer: Buffer | Uint8Array): string {
	return createHash('sha256').update(buffer).digest('hex');
}

export interface TemplateSnapshot {
	templateId: string;
	version: string | null;
	name: string | null;
	// Index signature keeps the shape assignable to Prisma's JSON input type.
	[key: string]: string | null;
}

/**
 * Snapshot of the template that was actually signed. Resolved once at signing time and stored
 * verbatim on the audit record — do NOT call this again later to "look up" the version.
 */
export function templateSnapshot(templateId: string): TemplateSnapshot {
	const config = getTemplateById(templateId);
	return {
		templateId,
		version: config?.version ?? null,
		name: config?.name ?? null,
	};
}

export interface PartiesSnapshot {
	party_a_name: string | null;
	party_b_name: string | null;
	party_a_signatory_name: string | null;
	party_a_title: string | null;
	party_b_signatory_name: string | null;
	party_b_title: string | null;
	// Index signature keeps the shape assignable to Prisma's JSON input type.
	[key: string]: string | null;
}

/**
 * Snapshot of the bound parties (entities + both signatories) taken from the form values at
 * signing time and stored verbatim on the audit record — so editing the draft later never alters
 * who/what the executed NDA bound. Same immutability rationale as {@link templateSnapshot}.
 */
export function partiesSnapshot(formData: Record<string, unknown>): PartiesSnapshot {
	const str = (key: string): string | null => {
		const v = formData[key];
		return typeof v === 'string' && v.trim() ? v : null;
	};
	return {
		party_a_name: str('party_a_name'),
		party_b_name: str('party_b_name'),
		party_a_signatory_name: str('party_a_signatory_name'),
		party_a_title: str('party_a_title'),
		party_b_signatory_name: str('party_b_signatory_name'),
		party_b_title: str('party_b_title'),
	};
}

export interface AuthorityConsent {
	confirmed: boolean;
	text: string;
	at: string;
	// Index signature keeps the shape assignable to Prisma's JSON input type.
	[key: string]: string | boolean;
}

/** Build the authority-consent record stored in the audit event. */
export function authorityConsent(confirmed: boolean): AuthorityConsent {
	return { confirmed, text: AUTHORITY_CONSENT_TEXT, at: new Date().toISOString() };
}
