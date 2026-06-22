import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/claim?signerId=<id>
 * Counterparty entry point: stashes the signer id in an httpOnly cookie so that
 * the account they create next gets bound to this NDA (see claimSignerByCookie in
 * src/lib/db-user.ts), then sends them to sign-up. Works even if they register
 * with a different email than the NDA was sent to.
 */
export async function GET(req: NextRequest) {
    const signerId = req.nextUrl.searchParams.get('signerId')

    if (signerId) {
        const cookieStore = await cookies()
        cookieStore.set('pending-claim-signer', signerId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            sameSite: 'lax',
        })
    }

    return NextResponse.redirect(new URL('/signup', req.url))
}
