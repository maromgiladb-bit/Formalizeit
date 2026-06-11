import { describe, it, expect } from 'vitest'
import {
  canSignNDA,
  canSendNDA,
  canContributeToDrafts,
  isOrganizationOwner,
  toDbMembershipRole,
  type MembershipForGuard,
} from '@/lib/organizationRoles'

const owner = (isApprover: boolean): MembershipForGuard => ({ role: 'OWNER', isApprover })
const signer = (): MembershipForGuard => ({ role: 'SIGNER', isApprover: false })
const contributor = (): MembershipForGuard => ({ role: 'CONTRIBUTOR', isApprover: false })

describe('canSignNDA', () => {
  it('SIGNER can sign', () => expect(canSignNDA(signer())).toBe(true))
  it('OWNER with isApprover=true can sign', () => expect(canSignNDA(owner(true))).toBe(true))
  it('OWNER with isApprover=false cannot sign', () => expect(canSignNDA(owner(false))).toBe(false))
  it('CONTRIBUTOR cannot sign', () => expect(canSignNDA(contributor())).toBe(false))
})

describe('canSendNDA', () => {
  it('all roles can send NDAs', () => {
    expect(canSendNDA(owner(false))).toBe(true)
    expect(canSendNDA(signer())).toBe(true)
    expect(canSendNDA(contributor())).toBe(true)
  })
})

describe('canContributeToDrafts', () => {
  it('all roles can contribute to drafts', () => {
    expect(canContributeToDrafts('OWNER')).toBe(true)
    expect(canContributeToDrafts('SIGNER')).toBe(true)
    expect(canContributeToDrafts('CONTRIBUTOR')).toBe(true)
  })
})

describe('isOrganizationOwner', () => {
  it('returns true only for OWNER', () => {
    expect(isOrganizationOwner('OWNER')).toBe(true)
    expect(isOrganizationOwner('SIGNER')).toBe(false)
    expect(isOrganizationOwner('CONTRIBUTOR')).toBe(false)
  })
})

describe('toDbMembershipRole', () => {
  it('normalises lowercase input', () => expect(toDbMembershipRole('signer')).toBe('SIGNER'))
  it('accepts valid roles', () => {
    expect(toDbMembershipRole('OWNER')).toBe('OWNER')
    expect(toDbMembershipRole('CONTRIBUTOR')).toBe('CONTRIBUTOR')
  })
  it('returns null for invalid or empty input', () => {
    expect(toDbMembershipRole(null)).toBeNull()
    expect(toDbMembershipRole('')).toBeNull()
    expect(toDbMembershipRole('ADMIN')).toBeNull()
  })
})
