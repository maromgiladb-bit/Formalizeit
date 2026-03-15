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

        // Find all signers linked to this user
        const signers = await prisma.signer.findMany({
            where: {
                OR: [
                    { userId: dbUser.id },
                    { email: dbUser.email }
                ],
                role: 'SIGNER' // Only Party B signers, not APPROVER (which is Party A reviewing)
            },
            include: {
                signRequest: {
                    include: {
                        draft: true,
                        createdBy: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Map to incoming NDA format
        const incomingNdas = signers
            .filter(s => s.signRequest?.draft) // Ensure draft exists
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
