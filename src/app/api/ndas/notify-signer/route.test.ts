import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    ndaDraft: { findFirst: vi.fn() },
    membership: { findMany: vi.fn() },
    auditEvent: { create: vi.fn() },
  },
}))
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  getAppUrl: vi.fn(() => 'https://app.test'),
  needsYourSignatureEmailHtml: vi.fn(() => '<html/>'),
}))
vi.mock('@/lib/db-organization', () => ({ getActiveOrganization: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn() }))

import { POST } from './route'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getActiveOrganization } from '@/lib/db-organization'
import { createNotification } from '@/lib/notifications'

const mockAuth = vi.mocked(auth)
const mockUser = vi.mocked(prisma.user.findUnique)
const mockDraft = vi.mocked(prisma.ndaDraft.findFirst)
const mockMemberships = vi.mocked(prisma.membership.findMany)
const mockSendEmail = vi.mocked(sendEmail)
const mockActiveOrg = vi.mocked(getActiveOrganization)
const mockCreateNotification = vi.mocked(createNotification)

// Two eligible signers on the same org as the requester.
const signerMemberships = [
  { user: { id: 's1', email: 's1@test.com' } },
  { user: { id: 's2', email: 's2@test.com' } },
]

function req(body: unknown) {
  return { json: async () => body } as unknown as import('next/server').NextRequest
}

async function emailedTo() {
  return mockSendEmail.mock.calls.map(c => (c[0] as { to: string }).to).sort()
}

describe('POST /api/ndas/notify-signer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'clerk-req' } as any)
    mockActiveOrg.mockResolvedValue({ organizationId: 'org-1' } as any)
    mockUser.mockResolvedValue({ id: 'req-user', name: 'Req', email: 'req@test.com' } as any)
    mockDraft.mockResolvedValue({
      id: 'draft-1',
      organizationId: 'org-1',
      title: 'Deal',
      workflowState: 'AWAITING_PARTY_A_SIGNATURE',
    } as any)
    mockMemberships.mockResolvedValue(signerMemberships as any)
    mockSendEmail.mockResolvedValue(undefined as any)
    mockCreateNotification.mockResolvedValue(undefined as any)
    vi.mocked(prisma.auditEvent.create).mockResolvedValue({} as any)
  })

  it('notifies only the selected subset when recipientUserIds is provided', async () => {
    const res = await POST(req({ draftId: 'draft-1', recipientUserIds: ['s1'] }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notifiedCount).toBe(1)
    expect(await emailedTo()).toEqual(['s1@test.com'])
    expect(mockCreateNotification).toHaveBeenCalledTimes(1)
  })

  it('notifies all eligible signers when recipientUserIds is omitted (backward compatible)', async () => {
    const res = await POST(req({ draftId: 'draft-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notifiedCount).toBe(2)
    expect(await emailedTo()).toEqual(['s1@test.com', 's2@test.com'])
  })

  it('ignores ids that are not authorized signers (client cannot notify outsiders)', async () => {
    const res = await POST(req({ draftId: 'draft-1', recipientUserIds: ['s1', 'outsider', 'not-a-signer'] }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notifiedCount).toBe(1)
    expect(await emailedTo()).toEqual(['s1@test.com'])
  })

  it('rejects when the selection intersects to nobody', async () => {
    const res = await POST(req({ draftId: 'draft-1', recipientUserIds: ['outsider'] }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/select at least one signer/i)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('excludes the requester even if they are a signer', async () => {
    mockMemberships.mockResolvedValue([
      { user: { id: 'req-user', email: 'req@test.com' } },
      { user: { id: 's1', email: 's1@test.com' } },
    ] as any)

    const res = await POST(req({ draftId: 'draft-1', recipientUserIds: ['req-user', 's1'] }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notifiedCount).toBe(1)
    expect(await emailedTo()).toEqual(['s1@test.com'])
  })

  it('rejects when the NDA is not awaiting the company signature', async () => {
    mockDraft.mockResolvedValue({
      id: 'draft-1',
      organizationId: 'org-1',
      title: 'Deal',
      workflowState: 'AWAITING_INPUT',
    } as any)

    const res = await POST(req({ draftId: 'draft-1', recipientUserIds: ['s1'] }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/not currently awaiting/i)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 400 when there is no eligible signer at all', async () => {
    mockMemberships.mockResolvedValue([] as any)

    const res = await POST(req({ draftId: 'draft-1' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/no teammate/i)
  })
})
