export type DbMembershipRole = 'OWNER' | 'SIGNER' | 'CONTRIBUTOR'

// Minimal membership shape needed for permission checks.
// `isApprover` matches the Prisma field name (DB column: `is_approver`) and represents
// whether an OWNER has the signer toggle enabled. The field name predates the APPROVER→SIGNER
// rename and intentionally mirrors the DB to avoid an extra mapping layer at callsites.
export type MembershipForGuard = { role: DbMembershipRole; isApprover: boolean }

// ─── Role descriptions (used in info tooltips in team settings) ──────────────

export const ROLE_DESCRIPTIONS: Record<DbMembershipRole, { label: string; description: string }> = {
  OWNER: {
    label: 'Owner',
    description:
      'Manages team members, billing, and company settings. Can create, edit, and send NDAs. Can sign NDAs on behalf of the company when the signer toggle is enabled.',
  },
  SIGNER: {
    label: 'Signer',
    description:
      'Can create, edit, and send NDAs. Can sign NDAs on behalf of the company.',
  },
  CONTRIBUTOR: {
    label: 'Contributor',
    description:
      'Can create, edit, and send NDA drafts for review or input. Cannot sign NDAs on behalf of the company.',
  },
}

// ─── Role options shown in invite form and member role selector ───────────────
// OWNER is not assignable via invite — it is the org creator.

export const ORGANIZATION_ROLE_OPTIONS: Array<{ value: DbMembershipRole; label: string }> = [
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'SIGNER', label: 'Signer' },
]

export const SIGNER_TOGGLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'true', label: 'Signer' },
  { value: 'false', label: 'Contributor' },
]

// ─── Guard functions ──────────────────────────────────────────────────────────

/** Only the org owner — team management, billing, company profile, delete any draft. */
export function isOrganizationOwner(role: string): boolean {
  return role === 'OWNER'
}

/**
 * Can sign NDAs on behalf of the company and perform finalisation actions.
 * True for: SIGNER role, OR OWNER who has explicitly enabled the signer toggle.
 */
export function canSignNDA(membership: MembershipForGuard): boolean {
  return membership.role === 'SIGNER' || (membership.role === 'OWNER' && membership.isApprover)
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
    case 'SIGNER':
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
  if (normalized === 'OWNER' || normalized === 'SIGNER' || normalized === 'CONTRIBUTOR') {
    return normalized
  }
  return null
}
