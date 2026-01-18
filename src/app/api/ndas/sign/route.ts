import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getAppUrl, timeToSignEmailHtml, congratulationsEmailHtml } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { draftId, signerEmail, signerName, signerTitle, signatureImage, signatureDate } = body;

        // Validate required fields
        if (!draftId || !signatureImage || !signerName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { externalId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find the draft with sign request info
        const draft = await prisma.ndaDraft.findUnique({
            where: { id: draftId },
            include: {
                signRequests: {
                    include: {
                        signers: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        // Party A is signing (internal user)
        const currentContent = draft.content as Record<string, any>;
        const updatedContent = {
            ...currentContent,
            party_1_signatory_name: signerName,
            party_1_signatory_title: signerTitle,
            party_1_signature_date: signatureDate,
            party_1_signature_image: signatureImage,
        };

        // Check if Party B has already signed
        const signRequest = draft.signRequests[0];
        const partyBSigner = signRequest?.signers.find(s => s.role === 'SIGNER');
        const partyBHasSigned = partyBSigner?.status === 'SIGNED';

        // Determine workflow state
        let newWorkflowState: string;
        let newStatus: string;

        if (partyBHasSigned) {
            // Both parties have signed
            newWorkflowState = 'COMPLETE';
            newStatus = 'SIGNED';
        } else {
            // Party A signed first, waiting for Party B
            newWorkflowState = 'AWAITING_PARTY_B_SIGNATURE';
            newStatus = 'SENT';
        }

        // Update draft
        const updatedDraft = await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                content: updatedContent,
                status: newStatus as any,
                workflowState: newWorkflowState as any,
            },
        });

        if (signRequest) {
            const partyASigner = await prisma.signer.findFirst({
                where: {
                    signRequestId: signRequest.id,
                    role: 'APPROVER'
                },
                orderBy: { createdAt: 'desc' }
            });
            if (partyASigner) {
                await prisma.signer.update({
                    where: { id: partyASigner.id },
                    data: {
                        status: 'SIGNED',
                        name: signerName,
                    },
                });
            } else {
                // Create Party A signer if doesn't exist
                await prisma.signer.create({
                    data: {
                        signRequestId: signRequest.id,
                        email: signerEmail || user.email,
                        name: signerName,
                        role: 'APPROVER',
                        status: 'SIGNED',
                    },
                });
            }
        }

        // Send Email Notifications
        try {
            const appUrl = getAppUrl();

            if (newWorkflowState === 'COMPLETE') {
                // Both signed - Send Congratulations to BOTH parties
                const dashboardLink = `${appUrl}/mynda`;

                // Email Party A (current signer)
                if (signerEmail || user.email) {
                    await sendEmail({
                        to: signerEmail || user.email,
                        subject: `🎉 Congratulations! NDA Completed - ${draft.title || 'NDA'}`,
                        html: congratulationsEmailHtml(draft.title || 'NDA', dashboardLink),
                    });
                    console.log('📧 Congratulations email sent to Party A:', signerEmail || user.email);
                }

                // Email Party B
                if (partyBSigner) {
                    await sendEmail({
                        to: partyBSigner.email,
                        subject: `🎉 Congratulations! NDA Completed - ${draft.title || 'NDA'}`,
                        html: congratulationsEmailHtml(draft.title || 'NDA', dashboardLink),
                    });
                    console.log('📧 Congratulations email sent to Party B:', partyBSigner.email);
                }
            } else {
                // Party A signed - Email Party B to come sign
                if (partyBSigner) {
                    const fillPageLink = `${appUrl}/fillndahtml-public/${partyBSigner.id}`;

                    await sendEmail({
                        to: partyBSigner.email,
                        subject: `Action Required: ${draft.title || 'NDA'} - ${signerName} has signed`,
                        html: timeToSignEmailHtml(
                            draft.title || 'NDA',
                            fillPageLink,
                            signerName
                        ),
                    });
                    console.log('📧 "Time to Sign" email sent to Party B:', partyBSigner.email);
                }
            }
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Don't fail the request if email fails
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'SIGNED',
                metadata: {
                    signer_email: signerEmail || user.email,
                    signer_name: signerName,
                    action: 'internal_signature_submitted',
                    party: 'party_a',
                    new_state: newWorkflowState,
                },
            },
        });

        return NextResponse.json({
            success: true,
            signedDraftId: updatedDraft.id,
            message: 'Signature submitted successfully',
            workflowState: newWorkflowState,
        });

    } catch (error) {
        console.error('Signature submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit signature' },
            { status: 500 }
        );
    }
}
