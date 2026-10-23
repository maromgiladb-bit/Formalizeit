import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
    },
    ndaDraft: {
      count: vi.fn(),
    },
  },
}))

import { assertCanSendNda, PlanLimitError } from '@/organizations/limits'
import { prisma } from '@/lib/prisma'

const mockFindOrg = vi.mocked(prisma.organization.findUnique)
const mockCountDrafts = vi.mocked(prisma.ndaDraft.count)

const freeOrg = {
  id: 'org-1',
  billingPlan: 'FREE' as const,
  settings: null,
}

const proOrg = {
  id: 'org-2',
  billingPlan: 'PRO' as const,
  settings: null,
}

describe('assertCanSendNda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when org is not found', async () => {
    mockFindOrg.mockResolvedValue(null)
    await expect(assertCanSendNda('missing-org')).rejects.toThrow('Organization not found')
  })

  it('allows send when FREE org is under the 3-NDA limit', async () => {
    mockFindOrg.mockResolvedValue(freeOrg as any)
    mockCountDrafts.mockResolvedValue(2)
    await expect(assertCanSendNda('org-1')).resolves.toBeUndefined()
  })

  it('blocks send when FREE org has reached 3-NDA limit', async () => {
    mockFindOrg.mockResolvedValue(freeOrg as any)
    mockCountDrafts.mockResolvedValue(3)
    await expect(assertCanSendNda('org-1')).rejects.toThrow('maximum number of NDAs')
  })

  it('throws a typed PlanLimitError (code LIMIT_REACHED) so routes can answer 403', async () => {
    mockFindOrg.mockResolvedValue(freeOrg as any)
    mockCountDrafts.mockResolvedValue(3)
    const error = await assertCanSendNda('org-1').catch((e) => e)
    expect(error).toBeInstanceOf(PlanLimitError)
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('LIMIT_REACHED')
  })

  it('excludes the draft being sent from the count, so a counted draft does not block its own next round', async () => {
    mockFindOrg.mockResolvedValue(freeOrg as any)
    mockCountDrafts.mockResolvedValue(2) // the other two; the draft being re-sent is excluded
    await expect(assertCanSendNda('org-1', 'draft-9')).resolves.toBeUndefined()
    expect(mockCountDrafts).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: 'org-1', id: { not: 'draft-9' } }),
    })
  })

  it('still blocks a brand-new send when three OTHER NDAs are already sent', async () => {
    mockFindOrg.mockResolvedValue(freeOrg as any)
    mockCountDrafts.mockResolvedValue(3)
    await expect(assertCanSendNda('org-1', 'draft-new')).rejects.toThrow('maximum number of NDAs')
  })

  it('does not filter by draft id when none is given', async () => {
    mockFindOrg.mockResolvedValue(freeOrg as any)
    mockCountDrafts.mockResolvedValue(0)
    await assertCanSendNda('org-1')
    const where = mockCountDrafts.mock.calls[0][0]?.where as Record<string, unknown>
    expect(where).not.toHaveProperty('id')
  })

  it('allows unlimited sends on PRO (no NDA cap)', async () => {
    mockFindOrg.mockResolvedValue(proOrg as any)
    mockCountDrafts.mockResolvedValue(9999)
    await expect(assertCanSendNda('org-2')).resolves.toBeUndefined()
  })

  it('allows unlimited sends on TEAM (no NDA cap)', async () => {
    mockFindOrg.mockResolvedValue({ id: 'org-3', billingPlan: 'TEAM' as const, settings: null } as any)
    mockCountDrafts.mockResolvedValue(9999)
    await expect(assertCanSendNda('org-3')).resolves.toBeUndefined()
  })
})
