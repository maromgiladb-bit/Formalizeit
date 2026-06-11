import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ndas/incoming
 * Fetch NDAs where the current user is a signer (Party B)
 */
export async function GET() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find user in database
        const dbUser = await prisma.user.findUnique({
            where: { externalId: userId }
        })

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Include ALL signer roles: SIGNER (received as Party B) and
        // SENDER (received sign-back from Party B, waiting for Party A to countersign)
        const signers = await prisma.signer.findMany({
            where: {
                OR: [
                    { userId: dbUser.id },
                    { email: dbUser.email }
                ],
            },
            include: {
                signRequest: {
                    include: {
                        draft: {
                            include: { createdBy: true }
                        },
                        createdBy: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Deduplicate by signRequestId (user may have multiple signer records per request)
        const seen = new Set<string>()
        const incomingNdas = signers
            .filter(s => s.signRequest?.draft) // Ensure draft exists
            .filter(s => {
                // Exclude NDAs the user created themselves (those belong in Sent)
                const draft = s.signRequest.draft as { createdByUserId?: string }
                if (draft.createdByUserId === dbUser.id) return false
                // Deduplicate: take one entry per sign request
                if (seen.has(s.signRequestId)) return false
                seen.add(s.signRequestId)
                return true
            })
            .map(signer => {
                const draft = signer.signRequest.draft
                const content = draft.content as Record<string, unknown> || {}

                return {
                    id: signer.id,
                    draftId: draft.id,
                    title: draft.title || 'Untitled NDA',
                    status: signer.status,
                    workflowState: draft.workflowState,
                    createdAt: signer.createdAt,
                    updatedAt: draft.updatedAt,
                    fromName: content.party_a_name || signer.signRequest.createdBy?.name || 'Party A',
                    fromEmail: signer.signRequest.createdBy?.email || '',
                    partyBName: content.party_b_name || signer.name,
                    partyBEmail: signer.email,
                    signerId: signer.id
                }
            })

        return NextResponse.json({ incomingNdas })
    } catch (error) {
        console.error('Incoming NDAs fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch incoming NDAs' }, { status: 500 })
    }
}
