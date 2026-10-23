import { describe, it, expect, vi } from 'vitest';
vi.mock('../templateManager', () => ({ getTemplateById: vi.fn() }));
import { termsConsent, authorityConsent, TERMS_CONSENT_TEXT } from '../signatureEvidence';

describe('termsConsent', () => {
	it('records acceptance, the exact text shown, and an ISO timestamp', () => {
		const c = termsConsent(true);
		expect(c.accepted).toBe(true);
		expect(c.text).toBe(TERMS_CONSENT_TEXT);
		expect(new Date(c.at).toISOString()).toBe(c.at);
	});

	it('consent text covers Terms, Privacy and e-signature consent', () => {
		expect(TERMS_CONSENT_TEXT).toMatch(/Terms of Service/);
		expect(TERMS_CONSENT_TEXT).toMatch(/Privacy Policy/);
		expect(TERMS_CONSENT_TEXT).toMatch(/sign electronically/);
	});

	it('is independent of the authority consent record', () => {
		expect(authorityConsent(true).text).not.toBe(termsConsent(true).text);
	});
});
