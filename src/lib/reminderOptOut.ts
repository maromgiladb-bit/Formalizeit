import { createHmac, timingSafeEqual } from 'crypto'
import * as Sentry from '@sentry/nextjs'

/**
 * Signed "Stop these reminders" links for receivers (non-users).
 *
 * Token = HMAC-SHA256(secret, "reminder-stop:" + draftId), hex. The secret is the
 * dedicated REMINDER_LINK_SECRET (never exposed to clients; generate with
 * `openssl rand -hex 32`). In production a missing secret is a loud failure
 * (Sentry + throw); outside production a fixed dev-only fallback is used.
 */
const DEV_FALLBACK_SECRET = 'dev-only-reminder-link-secret'

function secret(): string {
  const key = process.env.REMINDER_LINK_SECRET
  if (key) return key
  if (process.env.NODE_ENV === 'production') {
    const error = new Error('REMINDER_LINK_SECRET is not set in production')
    Sentry.captureException(error, { tags: { area: 'reminder-opt-out' } })
    throw error
  }
  return DEV_FALLBACK_SECRET
}

export function reminderStopToken(draftId: string): string {
  return createHmac('sha256', secret()).update(`reminder-stop:${draftId}`).digest('hex')
}

export function verifyReminderStopToken(draftId: string, token: string): boolean {
  if (!token) return false
  const a = Buffer.from(reminderStopToken(draftId))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Absolute URL for the emailed link. It opens a confirmation page: GET never
 * changes state, so link scanners that prefetch it cannot stop reminders.
 */
export function reminderStopUrl(appUrl: string, draftId: string): string {
  const token = reminderStopToken(draftId)
  return `${appUrl}/reminders-stopped/confirm?d=${encodeURIComponent(draftId)}&t=${token}`
}
