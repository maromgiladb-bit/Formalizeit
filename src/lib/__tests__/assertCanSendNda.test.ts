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

import { assertCanSendNda } from '@/organizations/limits'
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

  it('allows send when PRO org is under quarterly limit', async () => {
    mockFindOrg.mockResolvedValue(proOrg as any)
    mockCountDrafts.mockResolvedValue(24)
    await expect(assertCanSendNda('org-2')).resolves.toBeUndefined()
  })

  it('blocks send when PRO org has hit quarterly limit', async () => {
    mockFindOrg.mockResolvedValue(proOrg as any)
    mockCountDrafts.mockResolvedValue(25)
    await expect(assertCanSendNda('org-2')).rejects.toThrow('maximum number of NDAs')
  })
})
