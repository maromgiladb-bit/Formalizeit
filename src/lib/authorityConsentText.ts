/**
 * The exact authority-to-sign affirmation the signer ticks before signing. Imported by both the
 * UI (checkbox label) and the server (recorded consent text) so they can never drift apart.
 * Kept in its own dependency-free module so the signing page does not bundle the template engine.
 */
export const AUTHORITY_CONSENT_TEXT =
	'I confirm that I am authorized to sign this agreement on behalf of, and in the name of, the company I represent, and that doing so legally binds that company.';

/**
 * The exact terms / privacy / e-signature consent the signer ticks directly above the sign button.
 * Shared by the UI (checkbox label) and the server (recorded consent text).
 */
export const TERMS_CONSENT_TEXT =
	'I have read and agree to the Terms of Service and Privacy Policy, and I consent to sign electronically (E-Signature Consent).';
