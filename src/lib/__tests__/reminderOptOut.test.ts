import { describe, it, expect, afterEach, vi } from 'vitest'
import { reminderStopToken, verifyReminderStopToken, reminderStopUrl } from '@/lib/reminderOptOut'
import { signReminderEmailHtml } from '@/lib/email'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

const ID = '123e4567-e89b-42d3-a456-426614174000'

afterEach(() => vi.unstubAllEnvs())

describe('reminder opt-out token', () => {
  it('verifies its own token and rejects tampering or another draft', () => {
    vi.stubEnv('REMINDER_LINK_SECRET', 'secret-a')
    const t = reminderStopToken(ID)
    expect(verifyReminderStopToken(ID, t)).toBe(true)
    expect(verifyReminderStopToken(ID, t.slice(0, -1) + (t.endsWith('0') ? '1' : '0'))).toBe(false)
    expect(verifyReminderStopToken('123e4567-e89b-42d3-a456-426614174001', t)).toBe(false)
    expect(verifyReminderStopToken(ID, '')).toBe(false)
  })

  it('does not verify a token signed with a different secret', () => {
    vi.stubEnv('REMINDER_LINK_SECRET', 'secret-a')
    const t = reminderStopToken(ID)
    vi.stubEnv('REMINDER_LINK_SECRET', 'secret-b')
    expect(verifyReminderStopToken(ID, t)).toBe(false)
  })

  it('ignores CRON_SECRET', () => {
    vi.stubEnv('REMINDER_LINK_SECRET', 'secret-a')
    const t = reminderStopToken(ID)
    vi.stubEnv('CRON_SECRET', 'secret-a-but-cron')
    expect(verifyReminderStopToken(ID, t)).toBe(true)
  })

  it('throws in production when the secret is missing', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('REMINDER_LINK_SECRET', '')
    expect(() => reminderStopToken(ID)).toThrow(/REMINDER_LINK_SECRET/)
    expect(() => reminderStopUrl('https://x', ID)).toThrow()
  })

  it('uses a dev-only fallback outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('REMINDER_LINK_SECRET', '')
    expect(verifyReminderStopToken(ID, reminderStopToken(ID))).toBe(true)
  })

  it('emailed URL targets the confirmation page, not the state-changing route', () => {
    vi.stubEnv('REMINDER_LINK_SECRET', 'secret-a')
    const url = reminderStopUrl('https://x', ID)
    expect(url).toContain('https://x/reminders-stopped/confirm?d=' + ID)
    expect(url).not.toContain('/api/')
  })
})

describe('reminder email footer', () => {
  it('includes the stop link only when given, plus the shared legal footer', () => {
    const withStop = signReminderEmailHtml('T', 'https://x/s', 'Dana', false, 'sign', 'https://x/stop')
    expect(withStop).toContain('Stop these reminders')
    expect(withStop).toContain('https://x/stop')
    expect(withStop).toContain('is not a law firm')
    expect(withStop).toContain('/terms')
    expect(withStop).toContain('/privacy')
    expect(signReminderEmailHtml('T', 'https://x/s')).not.toContain('Stop these reminders')
  })
})
