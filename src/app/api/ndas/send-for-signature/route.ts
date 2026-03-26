import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, recipientSignRequestEmailHtml, getAppUrl } from '@/lib/email';
import { getActiveOrganization } from '@/lib/db-organization';
import { canApproveAndSend } from '@/lib/organizationRoles';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            draftId,
            partyBEmail,
            partyBName,
            signatureImage,
            signerName,
            signerTitle,
            signerDate,
            formData,
        } = body;

        // Validate required fields
        if (!draftId || !partyBEmail || !partyBName || !signatureImage || !formData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!EMAIL_REGEX.test(partyBEmail)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { externalId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const activeMembership = await getActiveOrganization();
        if (!activeMembership) {
            return NextResponse.json({ error: 'No active organization context found' }, { status: 404 });
        }

        if (!canApproveAndSend(activeMembership)) {
            return NextResponse.json({ error: 'Only approvers can send NDAs for signature' }, { status: 403 });
        }

        // Get draft in active organization
        const draft = await prisma.ndaDraft.findFirst({
            where: {
                id: draftId,
                organizationId: activeMembership.organizationId,
            },
        });

        if (!draft) {
            return NextResponse.json(
                { error: 'Draft not found or unauthorized' },
                { status: 404 }
            );
        }

        // Update draft status and content
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                content: formData,
                status: 'SENT',
                workflowState: 'AWAITING_PARTY_B_SIGNATURE',
            },
        });

        // Create or update sign request
        let signRequest = await prisma.signRequest.findFirst({
            where: { draftId: draftId },
            orderBy: { createdAt: 'desc' },
        });

        if (!signRequest) {
            signRequest = await prisma.signRequest.create({
                data: {
                    organizationId: draft.organizationId,
                    draftId: draftId,
                    createdByUserId: user.id,
                    status: 'SENT',
                },
            });
        } else {
            signRequest = await prisma.signRequest.update({
                where: { id: signRequest.id },
                data: { status: 'SENT' },
            });
        }

        // Create or update signer record with token
        const existingSigner = await prisma.signer.findFirst({
            where: {
                signRequestId: signRequest.id,
                email: partyBEmail,
            },
        });

        let signer;
        if (existingSigner) {
            signer = await prisma.signer.update({
                where: { id: existingSigner.id },
                data: {
                    status: 'PENDING',
                    role: 'SIGNER',
                },
            });
        } else {
            // Create Party B (SIGNER) record
            signer = await prisma.signer.create({
                data: {
                    signRequestId: signRequest.id,
                    email: partyBEmail,
                    role: 'SIGNER',
                    status: 'PENDING',
                },
            });

            // Also ensure Party A (APPROVER) record exists for bidirectional email notifications
            const existingApprover = await prisma.signer.findFirst({
                where: {
                    signRequestId: signRequest.id,
                    role: 'APPROVER',
                },
            });

            if (!existingApprover) {
                const partyAEmail = (formData.party_a_email as string) || user.email;
                const partyAName = (formData.party_a_signatory_name as string) || signerName || null;
                await prisma.signer.create({
                    data: {
                        signRequestId: signRequest.id,
                        email: partyAEmail,
                        name: partyAName,
                        role: 'APPROVER',
                        status: 'PENDING',
                    },
                });
            }
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'SENT',
                metadata: {
                    recipient_email: partyBEmail,
                    recipient_name: partyBName,
                    action: 'send_for_signature',
                },
            },
        });

        // Send email (without PDF attachment - PDF will be attached only in final completion email)
        const signLink = `${getAppUrl()}/sign-nda-public/${signer.id}`;

        try {
            await sendEmail({
                to: partyBEmail,
                subject: `Please sign NDA – ${draft.title || 'NDA'}`,
                html: recipientSignRequestEmailHtml(
                    draft.title || 'Untitled NDA',
                    signLink
                )
            });
            console.log('✅ Email sent successfully to:', partyBEmail);
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send email. Please check your email configuration.' },
                { status: 500 }
            );
        }

        // Notify the draft creator if they are different from the sender
        if (draft.createdByUserId !== user.id) {
            try {
                await createNotification(
                    draft.createdByUserId,
                    'NDA_SENT_TO_YOU',
                    'NDA sent',
                    `"${draft.title || 'Untitled NDA'}" was sent to ${partyBEmail} for signature`,
                    `/dashboard#nda-${draftId}`,
                    draftId
                )
            } catch (e) {
                console.error('Failed to create sent notification:', e)
            }
        }

        // Notify the recipient if they have a registered account
        const normalizedPartyBEmail = partyBEmail?.trim().toLowerCase();
        const recipientUser = normalizedPartyBEmail
            ? await prisma.user.findUnique({ where: { email: normalizedPartyBEmail }, select: { id: true } })
            : null;
        if (recipientUser) {
            try {
                await createNotification(
                    recipientUser.id,
                    'NDA_SENT_TO_YOU',
                    'Incoming NDA',
                    `${user.name || user.email} sent you "${draft.title || 'Untitled NDA'}" to sign`,
                    `/dashboard#nda-${draftId}`,
                    draftId
                )
            } catch (e) {
                console.error('Failed to create recipient notification:', e)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'NDA sent successfully',
            signRequest,
            signer,
        });
    } catch (error) {
        console.error('Send for signature error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : 'Failed to send NDA',
            },
            { status: 500 }
        );
    }
}
