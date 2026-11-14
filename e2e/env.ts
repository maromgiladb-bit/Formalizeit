/**
 * Shared settings and the production guard for the Playwright suite.
 *
 * The suite creates real Clerk users, companies and NDAs, so it must only
 * ever run against a Clerk *development* instance and the development
 * database. `assertSafeTarget()` refuses to start otherwise.
 */
import path from 'path'

/** Port 3100 so the suite's own server never collides with `npm run dev` on 3000. */
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3100'

/** Dedicated test users. `+clerk_test` makes Clerk skip real email delivery. */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin+clerk_test@example.com',
  firstName: 'E2E',
  lastName: 'Admin',
  company: 'E2E Test Co',
}

/**
 * Receiver (Party B) address. Resend's test inbox accepts mail without
 * delivering it anywhere, so signed-copy and notification emails sent during
 * a run don't bounce or hurt the sending domain's reputation.
 */
export const RECEIVER_EMAIL = process.env.E2E_RECEIVER_EMAIL ?? 'delivered+e2e@resend.dev'

export const AUTH_DIR = path.join(__dirname, '.auth')
export const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json')

/** Neon host of the production database (docs/launch/phase-0-external-setup.md). */
const PRODUCTION_DB_HOST = 'ep-wild-sea-aglnn451'

export function assertSafeTarget(): void {
  const secret = process.env.CLERK_SECRET_KEY ?? ''
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  const db = process.env.DATABASE_URL ?? ''

  const problems: string[] = []
  if (!secret.startsWith('sk_test_')) problems.push('CLERK_SECRET_KEY is not a development (sk_test_) key')
  if (!publishable.startsWith('pk_test_')) problems.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not a development (pk_test_) key')
  if (db.includes(PRODUCTION_DB_HOST)) problems.push('DATABASE_URL points at the production database')
  if (/formalizeit\.com/i.test(BASE_URL)) problems.push(`E2E_BASE_URL (${BASE_URL}) is the live site`)

  if (problems.length > 0) {
    throw new Error(
      'Refusing to run the e2e suite against production:\n  - ' + problems.join('\n  - '),
    )
  }
}
