import { describe, it, expect } from 'vitest'
import {
  canSignNDA,
  canSendNDA,
  canContributeToDrafts,
  isOrganizationOwner,
  toDbMembershipRole,
  type MembershipForGuard,
} from '@/lib/organizationRoles'

const admin = (isSigner: boolean): MembershipForGuard => ({ role: 'ADMINISTRATOR', isSigner })
const signer = (): MembershipForGuard => ({ role: 'SIGNER', isSigner: false })
const contributor = (): MembershipForGuard => ({ role: 'CONTRIBUTOR', isSigner: false })

describe('canSignNDA', () => {
  it('SIGNER can sign', () => expect(canSignNDA(signer())).toBe(true))
  it('ADMINISTRATOR with isSigner=true can sign', () => expect(canSignNDA(admin(true))).toBe(true))
  it('ADMINISTRATOR with isSigner=false cannot sign', () => expect(canSignNDA(admin(false))).toBe(false))
  it('CONTRIBUTOR cannot sign', () => expect(canSignNDA(contributor())).toBe(false))
})

describe('canSendNDA', () => {
  it('all roles can send NDAs', () => {
    expect(canSendNDA(admin(false))).toBe(true)
    expect(canSendNDA(signer())).toBe(true)
    expect(canSendNDA(contributor())).toBe(true)
  })
})

describe('canContributeToDrafts', () => {
  it('all roles can contribute to drafts', () => {
    expect(canContributeToDrafts('ADMINISTRATOR')).toBe(true)
    expect(canContributeToDrafts('SIGNER')).toBe(true)
    expect(canContributeToDrafts('CONTRIBUTOR')).toBe(true)
  })
})

describe('isOrganizationOwner', () => {
  it('returns true only for ADMINISTRATOR', () => {
    expect(isOrganizationOwner('ADMINISTRATOR')).toBe(true)
    expect(isOrganizationOwner('SIGNER')).toBe(false)
    expect(isOrganizationOwner('CONTRIBUTOR')).toBe(false)
  })
})

describe('toDbMembershipRole', () => {
  it('normalises lowercase input', () => expect(toDbMembershipRole('signer')).toBe('SIGNER'))
  it('accepts valid roles', () => {
    expect(toDbMembershipRole('ADMINISTRATOR')).toBe('ADMINISTRATOR')
    expect(toDbMembershipRole('CONTRIBUTOR')).toBe('CONTRIBUTOR')
  })
  it('returns null for invalid or empty input', () => {
    expect(toDbMembershipRole(null)).toBeNull()
    expect(toDbMembershipRole('')).toBeNull()
    expect(toDbMembershipRole('ADMIN')).toBeNull()
  })
})
