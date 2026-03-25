import { prisma } from '@/lib/prisma'

/**
 * When a user registers or logs in for the first time, link any existing
 * Signer records (matched by email, no userId yet) to their new user ID.
 *
 * This covers:
 *  - Existing user who signs via a public email link before logging in
 *  - New user who receives + signs an NDA before creating an account
 */
export async function claimPendingSigners(email: string, userId: string): Promise<number> {
  const result = await prisma.signer.updateMany({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
      userId: null,
    },
    data: { userId },
  })
  return result.count
}
