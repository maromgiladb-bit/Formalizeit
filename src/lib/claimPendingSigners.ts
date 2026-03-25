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
  const normalizedEmail = email.trim().toLowerCase()
  const result = await prisma.signer.updateMany({
    where: {
      email: normalizedEmail,
      userId: null,
    },
    data: { userId },
  })
  return result.count
}
