export type DbMembershipRole = 'OWNER' | 'APPROVER' | 'CONTRIBUTOR'

// Minimal membership shape needed for permission checks
export type MembershipForGuard = { role: DbMembershipRole; isApprover: boolean }

// ─── Role descriptions (used in info tooltips in team settings) ──────────────

export const ROLE_DESCRIPTIONS: Record<DbMembershipRole, { label: string; description: string }> = {
  OWNER: {
    label: 'Owner',
    description:
      'Manages team members, billing, and company settings. Can create and edit drafts. Cannot send or approve NDAs unless the approver toggle is enabled.',
  },
  APPROVER: {
    label: 'Approver',
    description:
      'Can create drafts, send NDAs for review/signature, and sign on behalf of the company.',
  },
  CONTRIBUTOR: {
    label: 'Contributor',
    description:
      'Can create and edit NDA drafts and send them externally for review or input. Cannot sign NDAs on behalf of the company.',
  },
}

// ─── Role options shown in invite form and member role selector ───────────────
// OWNER is not assignable via invite — it is the org creator.

export const ORGANIZATION_ROLE_OPTIONS: Array<{ value: DbMembershipRole; label: string }> = [
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'APPROVER', label: 'Approver' },
]

export const APPROVER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'true', label: 'Approver' },
  { value: 'false', label: 'Contributor' },
]

// ─── Guard functions ──────────────────────────────────────────────────────────

/** Only the org owner — team management, billing, company profile, delete any draft. */
export function isOrganizationOwner(role: string): boolean {
  return role === 'OWNER'
}

/**
 * Can sign NDAs on behalf of the company, approve/reject internal submissions, and finalize.
 * True for: APPROVER role, OR OWNER who has explicitly enabled the approver toggle.
 */
export function canApproveAndSend(membership: MembershipForGuard): boolean {
  return membership.role === 'APPROVER' || (membership.role === 'OWNER' && membership.isApprover)
}

/**
 * Can send NDAs externally (for review or input). Does not include signing.
 * True for all roles — every member can send NDAs.
 */
export function canSendNDA(_membership: MembershipForGuard): boolean {
  return true
}

/** All roles can create and edit drafts. */
export function canContributeToDrafts(_role: string): boolean {
  return true
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function getOrganizationRoleLabel(role: DbMembershipRole): string {
  return ROLE_DESCRIPTIONS[role]?.label ?? 'Contributor'
}

export function getOrganizationRoleBadgeClass(role: DbMembershipRole): string {
  switch (role) {
    case 'OWNER':
      return 'bg-indigo-100 text-indigo-800'
    case 'APPROVER':
      return 'bg-teal-100 text-teal-800'
    case 'CONTRIBUTOR':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Convert a string input (from a form select) to a valid DbMembershipRole.
 * Returns null if the input is not a valid assignable role.
 */
export function toDbMembershipRole(input: string | null | undefined): DbMembershipRole | null {
  if (!input) return null
  const normalized = input.toUpperCase() as DbMembershipRole
  if (normalized === 'OWNER' || normalized === 'APPROVER' || normalized === 'CONTRIBUTOR') {
    return normalized
  }
  return null
}
