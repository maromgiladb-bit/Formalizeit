import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getActiveOrganization } from '@/lib/db-organization'

/**
 * Returns the current user's membership role and isApprover flag.
 * Used by client components to conditionally render role-based UI.
 * GET /api/user/role
 */
export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await getActiveOrganization()
    if (!membership) return NextResponse.json({ error: 'No active organization' }, { status: 404 })

    return NextResponse.json({
        role: membership.role,
        isApprover: membership.isApprover,
    })
}
