import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getAppUrl, timeToSignEmailHtml, congratulationsEmailHtml } from '@/lib/email';
import { createNotificationsForAllOrgMembers, createNotification } from '@/lib/notifications';

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
                sentAt: draft.sentAt ?? new Date(),
            },
        });

        if (signRequest) {
            const partyASigner = signRequest.signers.find(s => s.role === 'APPROVER');
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
                // Both signed - Generate final PDF with both signatures
                let pdfAttachment: { filename: string; content: string; contentType: string }[] | undefined;

                try {
                    const { renderNdaHtml } = await import('@/lib/renderNdaHtml');
                    const { renderHtmlToPdf } = await import('@/lib/htmlToPdf');

                    console.log('📄 Generating final PDF with both signatures...');

                    const html = await renderNdaHtml(updatedContent, draft.templateId || 'professional_mutual_nda_v1');
                    const pdfBuffer = await renderHtmlToPdf(html, {
                        pageWidthPx: 900,
                        baseUrl: appUrl,
                        isA4: true,
                    });

                    const pdfBase64 = pdfBuffer.toString('base64');
                    pdfAttachment = [{
                        filename: `${draft.title || 'NDA'}_Signed.pdf`,
                        content: pdfBase64,
                        contentType: 'application/pdf'
                    }];

                    console.log('✅ Final PDF generated with both signatures');

                    // Store SIGNED PDF to S3
                    if (signRequest) {
                        try {
                            const { storeNdaPdf } = await import('@/lib/storeNdaPdf');
                            await storeNdaPdf({
                                signRequestId: signRequest.id,
                                kind: 'SIGNED',
                                pdfBuffer: pdfBuffer,
                            });
                            console.log('✅ SIGNED PDF stored in S3');
                        } catch (s3Error) {
                            console.error('❌ Failed to store PDF to S3:', s3Error);
                            // Continue - S3 storage failure shouldn't block completion
                        }
                    }
                } catch (pdfError) {
                    console.error('❌ Failed to generate PDF:', pdfError);
                    // Continue without attachment
                }

                // Send Congratulations to BOTH parties
                const dashboardLink = `${appUrl}/mynda`;

                // Email Party A (current signer)
                if (signerEmail || user.email) {
                    await sendEmail({
                        to: signerEmail || user.email,
                        subject: `Congratulations! Your NDA is complete`,
                        html: congratulationsEmailHtml(draft.title || 'NDA', dashboardLink),
                        attachments: pdfAttachment
                    });
                    console.log('📧 Congratulations email sent to Party A:', signerEmail || user.email);
                }

                // Email Party B
                if (partyBSigner) {
                    await sendEmail({
                        to: partyBSigner.email,
                        subject: `Congratulations! Your NDA is complete`,
                        html: congratulationsEmailHtml(draft.title || 'NDA', dashboardLink),
                        attachments: pdfAttachment
                    });
                    console.log('📧 Congratulations email sent to Party B:', partyBSigner.email);
                }
            } else {
                // Party A signed - Email Party B to come sign
                if (partyBSigner) {
                    const fillPageLink = `${appUrl}/fillndahtml-public/${partyBSigner.id}`;

                    const partyACompany = (updatedContent.party_a_name as string) || ''
                    await sendEmail({
                        to: partyBSigner.email,
                        subject: `Time to sign! ${signerName}${partyACompany ? ` from ${partyACompany}` : ''} has already signed the NDA`,
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

        // In-app notification based on outcome
        if (newWorkflowState === 'COMPLETE') {
            try {
                await createNotificationsForAllOrgMembers(
                    draft.organizationId,
                    null,
                    'NDA_COMPLETED',
                    'NDA complete',
                    `"${draft.title || 'Untitled NDA'}" has been signed by both parties`,
                    `/dashboard#nda-${draftId}`,
                    draftId
                )
            } catch (e) {
                console.error('Failed to create completion notification:', e)
            }
        } else if (newWorkflowState === 'AWAITING_PARTY_B_SIGNATURE' && partyBSigner) {
            // Party A signed first — notify Party B if they have a registered account
            try {
                const normalizedPartyBEmail = partyBSigner.email?.trim().toLowerCase();
                const partyBUser = normalizedPartyBEmail
                    ? await prisma.user.findUnique({
                        where: { email: normalizedPartyBEmail },
                        select: { id: true },
                    })
                    : null;
                if (partyBUser) {
                    await createNotification(
                        partyBUser.id,
                        'NDA_SIGNED',
                        'Your turn to sign',
                        `${signerName} signed "${draft.title || 'Untitled NDA'}" — your turn to sign`,
                        `/dashboard#nda-${draftId}`,
                        draftId
                    )
                }
            } catch (e) {
                console.error('Failed to create Party B sign notification:', e)
            }
        }

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
