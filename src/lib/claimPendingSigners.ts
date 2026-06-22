import { prisma } from '@/lib/prisma'

/**
 * When a user registers or logs in for the first time, link any existing
 * Signer records (no userId yet) to their new user ID by matching email.
 *
 * Matches case-insensitively (signer emails are stored as entered by the
 * sender, so casing may differ) and accepts multiple emails so a user's
 * secondary/verified Clerk addresses also pick up their NDAs.
 *
 * This covers:
 *  - Existing user who signs via a public email link before logging in
 *  - New user who receives + signs an NDA before creating an account
 *  - A user who was invited at a different address than their primary email
 */
export async function claimPendingSigners(
  emails: string | string[],
  userId: string,
): Promise<number> {
  const list = (Array.isArray(emails) ? emails : [emails])
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  if (list.length === 0) return 0

  const result = await prisma.signer.updateMany({
    where: {
      userId: null,
      OR: list.map(email => ({ email: { equals: email, mode: 'insensitive' as const } })),
    },
    data: { userId },
  })
  return result.count
}
