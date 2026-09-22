import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getActiveOrganization } from '@/lib/db-organization'
import { canContributeToDrafts } from '@/lib/organizationRoles'
import { applyNegotiationRound, pendingSuggestionsFromRevision, type SuggestionResponses } from '@/lib/negotiation'
import { persistNegotiationRound } from '@/lib/negotiationRound'
import { sendEmail, getAppUrl, negotiationReviewEmailHtml } from '@/lib/email'

/**
 * Party A responds to the counterparty's proposed changes from inside the app.
 *
 * This is the authenticated twin of the public `submit-input` route. Both
 * resolve a round through the same `applyNegotiationRound` +
 * `persistNegotiationRound` pair; they differ only in how they authenticate and
 * therefore in how the audit trail attributes the action.
 *
 * Deliberately NOT done by handing this page a signer token and pointing it at
 * the public route: that token is a long-lived bearer credential that today
 * lives only in one recipient's inbox, and routing an authenticated action
 * through it would bypass org-membership scoping and misattribute every audit
 * event to the email link.
 *
 * POST /api/ndas/approve-changes
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { draftId, filledFields, suggestedChanges, suggestionResponses } = body

        if (!draftId) {
            return NextResponse.json({ error: 'Missing draftId' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { externalId: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const activeMembership = await getActiveOrganization()
        if (!activeMembership) {
            return NextResponse.json({ error: 'No active organization context found' }, { status: 404 })
        }

        // Accepting, rejecting or countering terms is negotiation, not signing.
        // Per the product's role model the only action a contributor cannot take
        // is applying the company signature, which stays gated in the sign route
        // and on the sign page. The real authorization here is the
        // organizationId scoping on the query below.
        if (!canContributeToDrafts(activeMembership.role)) {
            return NextResponse.json({ error: 'You do not have access to this NDA' }, { status: 403 })
        }

        const existingDraft = await prisma.ndaDraft.findFirst({
            where: {
                id: draftId,
                organizationId: activeMembership.organizationId
            },
            include: {
                revisions: { orderBy: { createdAt: 'desc' }, take: 1 },
                signRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { signers: true },
                },
            }
        })

        if (!existingDraft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        const signRequest = existingDraft.signRequests[0]
        if (!signRequest) {
            return NextResponse.json({ error: 'This NDA has not been sent yet' }, { status: 400 })
        }

        const currentContent = (existingDraft.content as Record<string, unknown>) || {}

        // What the counterparty proposed last round, as the server knows it.
        // The dashboard treats anything with lastEditedBy === 'party_b' as
        // incoming, regardless of which teammate is looking; mirror that here
        // rather than comparing against this user's email, or a colleague's
        // acceptance would resolve against nothing.
        const incomingSuggestions = existingDraft.lastEditedBy === 'party_b'
            ? pendingSuggestionsFromRevision(existingDraft.revisions[0]?.content, '')
            : {}

        const round = applyNegotiationRound({
            currentContent,
            filledFields,
            suggestedChanges,
            responses: (suggestionResponses || {}) as SuggestionResponses,
            incomingSuggestions,
        })

        // Fully agreed means Party A signs next. Anything left open goes back to
        // the counterparty for another round — you cannot unilaterally sign a
        // version the other side has not agreed to.
        const newWorkflowState = round.fullyAccepted
            ? 'AWAITING_PARTY_A_SIGNATURE'
            : 'AWAITING_PARTY_B_REVIEW'

        const { revisionId } = await persistNegotiationRound({
            draftId: existingDraft.id,
            organizationId: existingDraft.organizationId,
            signRequestId: signRequest.id,
            actor: { kind: 'user', userId: user.id, email: user.email, isPartyA: true },
            round,
            newWorkflowState,
            eventType: round.fullyAccepted ? 'CHANGES_ACCEPTED' : 'CHANGES_REQUESTED',
        })

        // Hand the ball back to the counterparty when anything is still open.
        if (!round.fullyAccepted) {
            const partyBSigner = signRequest.signers.find(
                (s) => s.role === 'SIGNER' && s.email !== user.email
            )
            if (partyBSigner) {
                await prisma.signer.update({
                    where: { id: partyBSigner.id },
                    data: { status: 'PENDING' }
                })

                const actorName =
                    (currentContent.party_a_name as string) || user.name || user.email
                try {
                    await sendEmail({
                        to: partyBSigner.email,
                        subject: `${actorName} reviewed your changes – ${existingDraft.title || 'NDA'}`,
                        html: negotiationReviewEmailHtml(
                            existingDraft.title || 'Untitled NDA',
                            actorName,
                            round.summary,
                            `${getAppUrl()}/fillndahtml-public/${partyBSigner.id}`,
                        ),
                        replyTo: user.email,
                    })
                } catch (emailError) {
                    console.error('Failed to notify counterparty of review:', emailError)
                }
            }
        }

        return NextResponse.json({
            success: true,
            workflowState: newWorkflowState,
            fullyAccepted: round.fullyAccepted,
            revisionId,
        })
    } catch (error) {
        console.error('Approve changes error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to approve changes'
        }, { status: 500 })
    }
}
