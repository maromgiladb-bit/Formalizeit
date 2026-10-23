import { describe, it, expect } from 'vitest'
import { assessDeparture, type DeletionMemberView } from '../accountDeletion'

const m = (
  userId: string,
  role: string,
  createdAt: string,
  status = 'ACTIVE',
): DeletionMemberView => ({ userId, role, status, createdAt: new Date(createdAt) })

describe('assessDeparture', () => {
  it('sole member is not stranding anyone', () => {
    const r = assessDeparture([m('a', 'ADMINISTRATOR', '2026-01-01')], 'a')
    expect(r.isSoleAdmin).toBe(true)
    expect(r.strandsCompany).toBe(false)
    expect(r.promoteUserId).toBeNull()
  })

  it('sole admin with other active members strands the company', () => {
    const r = assessDeparture(
      [
        m('a', 'ADMINISTRATOR', '2026-01-01'),
        m('c', 'CONTRIBUTOR', '2026-03-01'),
        m('s', 'SIGNER', '2026-02-01'),
      ],
      'a',
    )
    expect(r.strandsCompany).toBe(true)
    expect(r.remainingActiveMembers).toBe(2)
    expect(r.promoteUserId).toBe('s')
  })

  it('does not strand when another administrator exists', () => {
    const r = assessDeparture(
      [m('a', 'ADMINISTRATOR', '2026-01-01'), m('b', 'ADMINISTRATOR', '2026-02-01')],
      'a',
    )
    expect(r.isSoleAdmin).toBe(false)
    expect(r.strandsCompany).toBe(false)
  })

  it('ignores pending invites', () => {
    const r = assessDeparture(
      [m('a', 'ADMINISTRATOR', '2026-01-01'), m('p', 'CONTRIBUTOR', '2026-02-01', 'PENDING_INVITE')],
      'a',
    )
    expect(r.strandsCompany).toBe(false)
    expect(r.remainingActiveMembers).toBe(0)
  })

  it('does not strand when a non-admin leaves', () => {
    const r = assessDeparture(
      [m('a', 'ADMINISTRATOR', '2026-01-01'), m('c', 'CONTRIBUTOR', '2026-02-01')],
      'c',
    )
    expect(r.isSoleAdmin).toBe(false)
    expect(r.strandsCompany).toBe(false)
  })

  it('breaks createdAt ties deterministically by userId', () => {
    const r = assessDeparture(
      [m('a', 'ADMINISTRATOR', '2026-01-01'), m('z', 'SIGNER', '2026-02-01'), m('b', 'SIGNER', '2026-02-01')],
      'a',
    )
    expect(r.promoteUserId).toBe('b')
  })
})
