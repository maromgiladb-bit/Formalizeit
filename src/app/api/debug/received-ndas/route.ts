import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/debug/received-ndas
 * Debug endpoint: shows raw signer records for the logged-in user
 * Remove this file once the bug is resolved.
 */
export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { externalId: userId },
        select: { id: true, email: true }
    })

    if (!user) return NextResponse.json({ error: 'No DB user' }, { status: 404 })

    // All signers linked by userId (any role)
    const byUserId = await prisma.signer.findMany({
        where: { userId: user.id },
        select: { id: true, email: true, role: true, status: true, userId: true, signRequestId: true }
    })

    // All signers matched by email (regardless of userId)
    const byEmail = await prisma.signer.findMany({
        where: { email: user.email },
        select: { id: true, email: true, role: true, status: true, userId: true, signRequestId: true }
    })

    // Case-insensitive email match (Postgres ilike)
    const byEmailInsensitive = await prisma.signer.findMany({
        where: { email: { equals: user.email, mode: 'insensitive' } },
        select: { id: true, email: true, role: true, status: true, userId: true, signRequestId: true }
    })

    return NextResponse.json({
        user: { id: user.id, email: user.email },
        byUserId,
        byEmail,
        byEmailInsensitive,
        counts: {
            byUserId: byUserId.length,
            byEmail: byEmail.length,
            byEmailInsensitive: byEmailInsensitive.length,
        }
    })
}
