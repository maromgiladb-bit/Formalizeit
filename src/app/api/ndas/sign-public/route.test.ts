import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/templateManager', () => ({ getTemplateById: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(), getAppUrl: vi.fn() }));
vi.mock('@/lib/notifications', () => ({
	createNotification: vi.fn(),
	createNotificationsForOrgSigners: vi.fn(),
	createNotificationsForAllOrgMembers: vi.fn(),
}));
vi.mock('@/lib/signedPdf', () => ({ produceSignedPdf: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

import { POST } from './route';

const base = {
	signerId: 's1',
	signerName: 'Jane',
	signerTitle: 'CEO',
	signatureImage: 'data:image/png;base64,xx',
	signatureDate: '2026-01-01',
};

function req(body: Record<string, unknown>) {
	return new Request('http://localhost/api/ndas/sign-public', {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.9' },
		body: JSON.stringify(body),
	}) as never;
}

describe('POST /api/ndas/sign-public consent gates', () => {
	it('rejects when the terms/e-signature consent flag is missing', async () => {
		const res = await POST(req({ ...base, authorityConfirmed: true }));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toMatch(/Terms of Service/);
	});

	it('rejects when the consent flag is not strictly true', async () => {
		const res = await POST(req({ ...base, authorityConfirmed: true, termsAccepted: 'true' }));
		expect(res.status).toBe(400);
	});

	it('still rejects when authority is not confirmed', async () => {
		const res = await POST(req({ ...base, termsAccepted: true }));
		expect(res.status).toBe(400);
		expect((await res.json()).error).toMatch(/authorized/);
	});
});
