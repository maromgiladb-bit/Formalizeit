import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, recipientSignRequestEmailHtml, getAppUrl } from '@/lib/email';
import { getActiveOrganization } from '@/lib/db-organization';
import { canSendNDA } from '@/lib/organizationRoles';
import { newSignLinkExpiry } from '@/lib/signLink';

/**
 * Re-issue an expired signing link. There is intentionally no "cancel" for an
 * in-progress NDA — links expire after 2 weeks, and the sender resends to hand
 * the counterparty a fresh link. Resets the pending signer's status + expiry,
 * restarts the reminder windows, and re-emails the recipient.
 *
 * POST /api/ndas/resend  { draftId }
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { draftId } = await request.json();
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
        if (!canSendNDA(activeMembership)) {
            return NextResponse.json({ error: 'You do not have permission to send NDAs.' }, { status: 403 });
        }

        const draft = await prisma.ndaDraft.findFirst({
            where: { id: draftId, organizationId: activeMembership.organizationId },
        });
        if (!draft) {
            return NextResponse.json({ error: 'Draft not found or unauthorized' }, { status: 404 });
        }

        const signRequest = await prisma.signRequest.findFirst({
            where: { draftId },
            orderBy: { createdAt: 'desc' },
        });
        if (!signRequest) {
            return NextResponse.json({ error: 'This NDA has not been sent yet.' }, { status: 400 });
        }

        // Pick the party whose action is pending. Party A (SENDER) when awaiting
        // Party A, otherwise the receiver (Party B, SIGNER).
        const workflowState = (draft as { workflowState?: string }).workflowState || '';
        const targetRole = workflowState.startsWith('AWAITING_PARTY_A') ? 'SENDER' : 'SIGNER';

        const signer = await prisma.signer.findFirst({
            where: {
                signRequestId: signRequest.id,
                role: targetRole,
                status: { notIn: ['SIGNED', 'DECLINED'] },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!signer?.email) {
            return NextResponse.json({ error: 'No pending recipient to resend to.' }, { status: 400 });
        }

        // Re-issue the link: fresh expiry, reopen status, restart reminder windows.
        await prisma.signer.update({
            where: { id: signer.id },
            data: { status: 'SENT', expiresAt: newSignLinkExpiry() },
        });
        if (signRequest.status === 'EXPIRED') {
            await prisma.signRequest.update({ where: { id: signRequest.id }, data: { status: 'SENT' } });
        }
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: { sentAt: new Date(), reminder48hSentAt: null, reminder5dSentAt: null },
        });

        const signLink = `${getAppUrl()}/sign-nda-public/${signer.id}`;

        // When re-emailing the receiver, route their replies back to the sender.
        const draftContent = (draft.content as Record<string, unknown>) || {};
        const senderReplyTo = (draftContent.party_a_email as string) || user.email;

        try {
            await sendEmail({
                to: signer.email,
                subject: `Reminder: please sign ${draft.title || 'your NDA'}`,
                html: recipientSignRequestEmailHtml(draft.title || 'Untitled NDA', signLink),
                replyTo: targetRole === 'SIGNER' ? senderReplyTo : undefined,
            });
        } catch (emailError) {
            console.error('❌ Failed to resend NDA email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send email. Please try again.' },
                { status: 500 }
            );
        }

        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'SENT',
                metadata: {
                    recipient_email: signer.email,
                    action: 'resend',
                },
            },
        });

        return NextResponse.json({ success: true, recipientEmail: signer.email });
    } catch (error) {
        console.error('Resend NDA error:', error);
        return NextResponse.json({ error: 'Failed to resend NDA' }, { status: 500 });
    }
}
