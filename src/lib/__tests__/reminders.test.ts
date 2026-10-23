import { describe, it, expect } from 'vitest'
import { REMINDER_STATES, reminderMode, reminderLinkPath } from '@/lib/reminders'
import { signReminderEmailHtml } from '@/lib/email'

describe('REMINDER_STATES', () => {
  it('includes the review state a first send leaves the receiver in', () => {
    expect(REMINDER_STATES).toContain('AWAITING_PARTY_B_REVIEW')
  })

  it('still includes both signature states', () => {
    expect(REMINDER_STATES).toContain('AWAITING_PARTY_B_SIGNATURE')
    expect(REMINDER_STATES).toContain('AWAITING_PARTY_A_SIGNATURE')
  })

  it('never reminds in draft or complete states', () => {
    expect(REMINDER_STATES).not.toContain('DRAFT')
    expect(REMINDER_STATES).not.toContain('COMPLETE')
  })
})

describe('reminderMode / reminderLinkPath', () => {
  it('sends review-state receivers to the fill/review page', () => {
    expect(reminderMode('AWAITING_PARTY_B_REVIEW')).toBe('review')
    expect(reminderLinkPath('AWAITING_PARTY_B_REVIEW', 'abc')).toBe('/fillndahtml-public/abc')
  })

  it('sends signature-state receivers to the sign page', () => {
    expect(reminderMode('AWAITING_PARTY_B_SIGNATURE')).toBe('sign')
    expect(reminderLinkPath('AWAITING_PARTY_B_SIGNATURE', 'abc')).toBe('/sign-nda-public/abc')
    expect(reminderLinkPath('AWAITING_PARTY_A_SIGNATURE', 'abc')).toBe('/sign-nda-public/abc')
  })
})

describe('signReminderEmailHtml', () => {
  it('defaults to the signing wording', () => {
    const html = signReminderEmailHtml('Test NDA', 'https://x/sign', 'Dana')
    expect(html).toContain('waiting for your signature')
    expect(html).toContain('Review and Sign')
  })

  it('uses review wording in review mode, for both reminders', () => {
    for (const second of [false, true]) {
      const html = signReminderEmailHtml('Test NDA', 'https://x/review', 'Dana', second, 'review')
      expect(html).toContain('waiting for your review')
      expect(html).toContain('Review the NDA')
      expect(html).not.toContain('your signature')
    }
  })
})
