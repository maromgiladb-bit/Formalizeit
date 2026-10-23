/**
 * Pure decision helpers for removing a user from a company when their account
 * is deleted. No DB access here so the rules can be unit tested.
 */

export interface DeletionMemberView {
  userId: string
  role: string
  status: string
  createdAt: Date
}

export interface DepartureAssessment {
  /** The leaving user is the only ACTIVE administrator of this company. */
  isSoleAdmin: boolean
  /** Other ACTIVE members who would remain after the user leaves. */
  remainingActiveMembers: number
  /** Leaving would strand the company: sole admin with other active members. */
  strandsCompany: boolean
  /** Longest-standing remaining ACTIVE member (promotion candidate), if stranded. */
  promoteUserId: string | null
}

export function assessDeparture(
  members: DeletionMemberView[],
  leavingUserId: string,
): DepartureAssessment {
  const active = members.filter((m) => m.status === 'ACTIVE')
  const leaving = active.find((m) => m.userId === leavingUserId)
  const otherAdmins = active.filter(
    (m) => m.userId !== leavingUserId && m.role === 'ADMINISTRATOR',
  )
  const others = active.filter((m) => m.userId !== leavingUserId)

  const isSoleAdmin = !!leaving && leaving.role === 'ADMINISTRATOR' && otherAdmins.length === 0
  const strandsCompany = isSoleAdmin && others.length > 0

  let promoteUserId: string | null = null
  if (strandsCompany) {
    const sorted = [...others].sort(
      (a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime() || a.userId.localeCompare(b.userId),
    )
    promoteUserId = sorted[0].userId
  }

  return {
    isSoleAdmin,
    remainingActiveMembers: others.length,
    strandsCompany,
    promoteUserId,
  }
}
