import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getAppUrl, needsYourSignatureEmailHtml } from '@/lib/email';
import { getActiveOrganization } from '@/lib/db-organization';
import { createNotification } from '@/lib/notifications';

/**
 * Ask a teammate who can sign to apply the company signature.
 *
 * Used when the person who has the NDA cannot sign (Contributor / Administrator
 * without the signer toggle). Instead of forwarding a public bearer-token link —
 * which would attribute the signature to the wrong person — this notifies the org's
 * signers (in-app + email) and sends them to the authenticated in-app document, so
 * whoever signs is correctly recorded as the signatory.
 *
 * POST /api/ndas/notify-signer  { draftId }
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const draftId: string | undefined = body?.draftId;
        // Optional subset chosen in the picker. When present, only these signers are
        // notified (still intersected with the authoritative signer set below); when
        // absent, all eligible signers are notified.
        const requestedUserIds: string[] | undefined = Array.isArray(body?.recipientUserIds)
            ? body.recipientUserIds.filter((id: unknown): id is string => typeof id === 'string')
            : undefined;
        if (!draftId) {
            return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { externalId: userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const activeMembership = await getActiveOrganization();
        if (!activeMembership) {
            return NextResponse.json({ error: 'No active organization context found' }, { status: 404 });
        }

        const draft = await prisma.ndaDraft.findFirst({
            where: { id: draftId, organizationId: activeMembership.organizationId },
        });
        if (!draft) {
            return NextResponse.json({ error: 'Draft not found or unauthorized' }, { status: 404 });
        }

        // The company signature is only needed once the NDA is awaiting Party A.
        const workflowState = (draft as { workflowState?: string }).workflowState || '';
        if (workflowState !== 'AWAITING_PARTY_A_SIGNATURE') {
            return NextResponse.json(
                { error: 'This NDA is not currently awaiting your company signature.' },
                { status: 400 }
            );
        }

        // Signers = role SIGNER, or ADMINISTRATOR with the signer toggle on.
        const signerMemberships = await prisma.membership.findMany({
            where: {
                organizationId: activeMembership.organizationId,
                status: 'ACTIVE',
                OR: [
                    { role: 'SIGNER' },
                    { role: 'ADMINISTRATOR', isSigner: true },
                ],
            },
            include: { user: { select: { id: true, email: true } } },
        });

        // Don't notify the requester if they happen to be a signer already.
        const eligible = signerMemberships
            .map(m => m.user)
            .filter(u => u.id !== user.id && !!u.email);

        if (eligible.length === 0) {
            return NextResponse.json(
                { error: 'No teammate on your team can sign. Ask an administrator to enable a signer.' },
                { status: 400 }
            );
        }

        // If the picker sent a subset, intersect with the authoritative set so a client
        // can never notify a non-signer or someone outside the org.
        const recipients = requestedUserIds
            ? eligible.filter(u => requestedUserIds.includes(u.id))
            : eligible;

        if (recipients.length === 0) {
            return NextResponse.json(
                { error: 'Select at least one signer to notify.' },
                { status: 400 }
            );
        }

        const docLink = `${getAppUrl()}/dashboard#nda-${draft.id}`;
        const requesterName = user.name || user.email;
        const title = draft.title || 'Untitled NDA';

        // In-app notifications (batch) — reuse the existing signer query semantics.
        await Promise.all(
            recipients.map(r =>
                createNotification(
                    r.id,
                    'NDA_SENT_TO_YOU',
                    'Signature needed',
                    `${requesterName} asked you to sign "${title}" on behalf of your company`,
                    docLink,
                    draft.id
                ).catch(e => console.error('Failed to create notify-signer notification:', e))
            )
        );

        // Email each signer, with reply-to set to the requester so they can reply back.
        await Promise.all(
            recipients.map(r =>
                sendEmail({
                    to: r.email,
                    subject: `${requesterName} asked you to sign "${title}"`,
                    html: needsYourSignatureEmailHtml(title, docLink, requesterName),
                    replyTo: user.email,
                }).catch(e => console.error('Failed to send notify-signer email:', e))
            )
        );

        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'SENT',
                metadata: {
                    action: 'notify_signer',
                    notified_count: recipients.length,
                },
            },
        });

        return NextResponse.json({ success: true, notifiedCount: recipients.length });
    } catch (error) {
        console.error('Notify signer error:', error);
        return NextResponse.json({ error: 'Failed to notify a signer' }, { status: 500 });
    }
}
