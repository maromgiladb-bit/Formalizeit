import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the prisma module before importing the function under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    signer: {
      updateMany: vi.fn(),
    },
  },
}))

import { claimPendingSigners } from '@/lib/claimPendingSigners'
import { prisma } from '@/lib/prisma'

describe('claimPendingSigners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates signers with matching email and null userId', async () => {
    const mockUpdateMany = vi.mocked(prisma.signer.updateMany)
    mockUpdateMany.mockResolvedValue({ count: 3 })

    const result = await claimPendingSigners('party@example.com', 'user-uuid-123')

    expect(mockUpdateMany).toHaveBeenCalledOnce()
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        email: 'party@example.com',
        userId: null,
      },
      data: { userId: 'user-uuid-123' },
    })
    expect(result).toBe(3)
  })

  it('returns 0 when no matching signers exist', async () => {
    vi.mocked(prisma.signer.updateMany).mockResolvedValue({ count: 0 })

    const result = await claimPendingSigners('nobody@example.com', 'user-uuid-456')

    expect(result).toBe(0)
  })

  it('does not throw when prisma returns count 0', async () => {
    vi.mocked(prisma.signer.updateMany).mockResolvedValue({ count: 0 })

    await expect(claimPendingSigners('nope@test.com', 'uid')).resolves.not.toThrow()
  })

  it('propagates prisma errors', async () => {
    vi.mocked(prisma.signer.updateMany).mockRejectedValue(new Error('DB connection lost'))

    await expect(claimPendingSigners('err@test.com', 'uid')).rejects.toThrow('DB connection lost')
  })

  it('normalises uppercase email to lowercase before querying', async () => {
    vi.mocked(prisma.signer.updateMany).mockResolvedValue({ count: 1 })

    await claimPendingSigners('PARTY@EXAMPLE.COM', 'user-uuid-789')

    expect(prisma.signer.updateMany).toHaveBeenCalledWith({
      where: {
        email: 'party@example.com',
        userId: null,
      },
      data: { userId: 'user-uuid-789' },
    })
  })
})

