import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NdaStatus, NdaWorkflowState, Prisma } from '@prisma/client';
import { sendEmail, getAppUrl } from '@/lib/email';
import { createNotification, createNotificationsForOrgApprovers, createNotificationsForAllOrgMembers } from '@/lib/notifications';
import { linkSignerToUser } from '@/lib/linkSignerToUser';

export const runtime = 'nodejs'; // Required for Puppeteer

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signerId, signerName, signerTitle, signatureImage, signatureDate } = body;

        if (!signerId || !signerName || !signerTitle || !signatureImage) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get signer with related data
        const signer = await prisma.signer.findUnique({
            where: { id: signerId },
            include: {
                signRequest: {
                    include: {
                        draft: true,
                        organization: true,
                        ndaPdfs: true,
                    },
                },
            },
        });

        if (!signer) {
            return NextResponse.json({ error: 'Signer not found' }, { status: 404 });
        }

        // Idempotency: if this signer has already signed, do not process again
        if (signer.status === 'SIGNED') {
            return NextResponse.json(
                {
                    message: 'Signature already submitted',
                    status: 'SIGNED',
                },
                { status: 200 }
            );
        }

        // Check if signer role is Party A (APPROVER) or Party B (SIGNER)
        const isPartyA = signer.role === 'APPROVER';

        // Extract form data from draft
        const draft = signer.signRequest.draft;
        const formData = (draft.content as Prisma.JsonObject) || {};

        // Update draft content with signature
        let updatedContent = { ...formData };
        if (isPartyA) {
            updatedContent = {
                ...updatedContent,
                party_1_signatory_name: signerName,
                party_1_signatory_title: signerTitle,
                party_1_signature_date: signatureDate,
                party_1_signature_image: signatureImage, // Save signature image
            };
        } else {
            updatedContent = {
                ...updatedContent,
                party_2_signatory_name: signerName,
                party_2_signatory_title: signerTitle,
                party_2_signature_date: signatureDate,
                party_2_signature_image: signatureImage, // Save signature image
            };
        }

        // Determine next state
        let newWorkflowState: NdaWorkflowState = NdaWorkflowState.COMPLETE;
        let newStatus: NdaStatus = NdaStatus.SIGNED;

        // Find the OTHER signer
        const otherSignerRole = isPartyA ? 'SIGNER' : 'APPROVER';
        // First try to find a SIGNED record (any version)
        let otherSigner = await prisma.signer.findFirst({
            where: {
                signRequestId: signer.signRequestId,
                role: otherSignerRole,
                status: 'SIGNED'
            },
            orderBy: { createdAt: 'desc' }
        });

        // If no signed record, get the latest one (likely PENDING)
        if (!otherSigner) {
            otherSigner = await prisma.signer.findFirst({
                where: {
                    signRequestId: signer.signRequestId,
                    role: otherSignerRole
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Looking for other signer with role:', otherSignerRole);
            console.log('🔍 Other signer found:', otherSigner ? otherSigner.email : 'NOT FOUND');
        }

        // Fallback: If Party B signed but no APPROVER record exists, get Party A email from draft content
        let otherPartyEmail: string | null = null;
        let otherPartyName: string | null = null;

        if (process.env.NODE_ENV === 'development') {
            console.log('📧 Debug: isPartyA =', isPartyA);
            console.log(
                '📧 Debug: otherSigner =',
                otherSigner ? { email: otherSigner.email, status: otherSigner.status } : 'null'
            );
            console.log('📧 Debug: formData.party_a_email =', formData.party_a_email);
            console.log('📧 Debug: formData keys =', Object.keys(formData));
        }

        if (otherSigner) {
            // Use the signer record if it exists
            otherPartyEmail = otherSigner.email;
            otherPartyName = otherSigner.name;
        } else if (!isPartyA) {
            // Party B signed, but Party A signer record doesn't exist
            // Try to get Party A's email from the draft content
            otherPartyEmail = (formData.party_a_email as string) || null;
            otherPartyName =
                (formData.party_a_signatory_name as string) ||
                (formData.party_a_name as string) ||
                null;
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Fallback: Getting Party A email from draft content:', otherPartyEmail);
            }
        }

        const otherPartyHasSigned = otherSigner?.status === 'SIGNED';

        if (otherPartyHasSigned) {
            newWorkflowState = NdaWorkflowState.COMPLETE;
            newStatus = NdaStatus.SIGNED;
        } else {
            // Other party hasn't signed yet
            newStatus = NdaStatus.SENT;
            newWorkflowState = isPartyA ? NdaWorkflowState.AWAITING_PARTY_B_SIGNATURE : NdaWorkflowState.AWAITING_PARTY_A_SIGNATURE;
        }

        // Update draft
        await prisma.ndaDraft.update({
            where: { id: draft.id },
            data: {
                content: updatedContent,
                status: newStatus,
                workflowState: newWorkflowState,
            },
        });

        // Update sign request status
        const newSignRequestStatus = newWorkflowState === 'COMPLETE' ? 'SIGNED' : 'SENT';

        await prisma.signRequest.update({
            where: { id: signer.signRequestId },
            data: { status: newSignRequestStatus },
        });

        // Update current signer status
        await prisma.signer.update({
            where: { id: signerId },
            data: {
                status: 'SIGNED',
                name: signerName,
            },
        });

        // Link signer to user account if one exists with this email
        // This handles the case where a registered user signs via public link
        let matchedUserId: string | null = null
        try {
            const { linked, userId } = await linkSignerToUser(signerId, signer.email);
            matchedUserId = userId;
            if (linked && process.env.NODE_ENV === 'development') {
                console.log('🔗 Linked signer to user account:', userId);
            }
        } catch (linkError) {
            // Non-critical: failure here doesn't break signing
            console.error('Failed to link signer to user:', linkError);
        }

        // Send Email Notifications
        try {
            const appUrl = getAppUrl();
            const { timeToSignEmailHtml, congratulationsEmailHtml } = await import('@/lib/email');

            if (newWorkflowState === 'COMPLETE') {
                // Both signed - Generate PDF with both signatures and send to both parties
                console.log('📄 Both parties signed - generating final PDF with signatures...');

                // Generate final PDF with both signatures
                let pdfAttachment: { filename: string; content: string; contentType: string }[] | null = null;
                try {
                    const { renderNdaHtml } = await import('@/lib/renderNdaHtml');
                    const { renderHtmlToPdf } = await import('@/lib/htmlToPdf');

                    // Prepare template data with both signatures
                    const templateData = {
                        ...updatedContent,
                        party_1_name: formData.party_a_name || '',
                        party_1_address: formData.party_a_address || '',
                        party_1_signatory_name: formData.party_a_signatory_name || updatedContent.party_1_signatory_name || '',
                        party_1_signatory_title: formData.party_a_title || updatedContent.party_1_signatory_title || '',
                        party_1_phone: formData.party_a_phone || '',
                        party_1_emails_joined: formData.party_a_email || '',
                        party_1_signature_image: updatedContent.party_1_signature_image || '',
                        party_1_signature_date: updatedContent.party_1_signature_date || '',
                        party_2_name: formData.party_b_name || '',
                        party_2_address: formData.party_b_address || '',
                        party_2_signatory_name: formData.party_b_signatory_name || updatedContent.party_2_signatory_name || '',
                        party_2_signatory_title: formData.party_b_title || updatedContent.party_2_signatory_title || '',
                        party_2_phone: formData.party_b_phone || '',
                        party_2_emails_joined: formData.party_b_email || '',
                        party_2_signature_image: updatedContent.party_2_signature_image || '',
                        party_2_signature_date: updatedContent.party_2_signature_date || '',
                    };

                    const html = await renderNdaHtml(templateData, (formData.templateId as string) || 'professional_mutual_nda_v1');
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
                    try {
                        const { storeNdaPdf } = await import('@/lib/storeNdaPdf');
                        await storeNdaPdf({
                            signRequestId: signer.signRequestId,
                            kind: 'SIGNED',
                            pdfBuffer: pdfBuffer,
                        });
                        console.log('✅ SIGNED PDF stored in S3');
                    } catch (s3Error) {
                        console.error('❌ Failed to store PDF to S3:', s3Error);
                        // Continue - S3 storage failure shouldn't block completion
                    }
                } catch (pdfError) {
                    console.error('❌ Failed to generate PDF:', pdfError);
                    // Continue without attachment - still send email with download link
                }

                const pdfDownloadLink = `${appUrl}/api/ndas/viewpdf?draftId=${draft.id}`;

                // Email Current Signer
                await sendEmail({
                    to: signer.email,
                    subject: `🎉 Congratulations! NDA Completed - ${draft.title || 'NDA'}`,
                    html: congratulationsEmailHtml(draft.title || 'NDA', pdfDownloadLink),
                    attachments: pdfAttachment || undefined
                });
                console.log('📧 Congratulations email sent to current signer:', signer.email, pdfAttachment ? 'with PDF attachment' : '');

                // Email Other Signer (or use fallback email)
                const otherRecipientEmail = otherSigner?.email || otherPartyEmail;
                if (otherRecipientEmail) {
                    await sendEmail({
                        to: otherRecipientEmail,
                        subject: `🎉 Congratulations! NDA Completed - ${draft.title || 'NDA'}`,
                        html: congratulationsEmailHtml(draft.title || 'NDA', pdfDownloadLink),
                        attachments: pdfAttachment || undefined
                    });
                    console.log('📧 Congratulations email sent to other signer:', otherRecipientEmail, pdfAttachment ? 'with PDF attachment' : '');
                } else {
                    console.warn('⚠️  Could not send congratulations email to other party - no email found');
                }

            } else {
                // Partial signature - Email the OTHER party to come sign
                const recipientEmail = otherSigner?.email || otherPartyEmail;
                const recipientName = otherSigner?.name || otherPartyName;
                let recipientSignerId = otherSigner?.id;

                console.log('📧 Preparing to send email to:', recipientEmail);

                // If Party B signed and no Party A signer record exists, create one
                if (!otherSigner && !isPartyA && recipientEmail) {
                    console.log('🔧 Creating Party A signer record...');
                    const newSignerRecord = await prisma.signer.create({
                        data: {
                            signRequestId: signer.signRequestId,
                            email: recipientEmail,
                            name: recipientName || 'Party A',
                            role: 'APPROVER',
                            status: 'PENDING',
                        }
                    });
                    recipientSignerId = newSignerRecord.id;
                    console.log('✅ Party A signer record created with ID:', recipientSignerId);
                }

                if (recipientEmail && recipientSignerId) {
                    // Always use sign-nda-public for the signing link
                    const signPageLink = `${appUrl}/sign-nda-public/${recipientSignerId}`;

                    await sendEmail({
                        to: recipientEmail,
                        subject: `Action Required: ${draft.title || 'NDA'} - ${signerName} has signed`,
                        html: timeToSignEmailHtml(
                            draft.title || 'NDA',
                            signPageLink,
                            signerName
                        ),
                    });
                    console.log('📧 "Time to Sign" email sent to:', recipientEmail, 'with link:', signPageLink);
                } else if (recipientEmail) {
                    // Fallback: If we couldn't create a signer record, send to dashboard
                    const dashboardLink = `${appUrl}/mynda`;
                    await sendEmail({
                        to: recipientEmail,
                        subject: `Action Required: ${draft.title || 'NDA'} - ${signerName} has signed`,
                        html: timeToSignEmailHtml(
                            draft.title || 'NDA',
                            dashboardLink,
                            signerName
                        ),
                    });
                    console.log('📧 "Time to Sign" email sent to:', recipientEmail, '(fallback to dashboard)');
                } else {
                    console.warn('⚠️ Could not find email address for the other party');
                }
            }

        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
        }

        // In-app notifications based on outcome
        const orgId = signer.signRequest.organizationId
        const ndaTitle = draft.title || 'Untitled NDA'
        const ndaLink = `/dashboard#nda-${draft.id}`
        try {
            if (newWorkflowState === 'COMPLETE') {
                await createNotificationsForAllOrgMembers(
                    orgId,
                    matchedUserId ?? null,
                    'NDA_COMPLETED',
                    'NDA complete',
                    `"${ndaTitle}" has been signed by both parties`,
                    ndaLink,
                    draft.id
                )
                // Also notify the signer (Party B) if they have a registered account
                if (matchedUserId) {
                    await createNotification(
                        matchedUserId,
                        'NDA_COMPLETED',
                        'NDA complete',
                        `"${ndaTitle}" has been signed by both parties`,
                        ndaLink,
                        draft.id
                    )
                }
            } else if (!isPartyA) {
                // Party B signed, Party A still needs to sign
                await createNotificationsForOrgApprovers(
                    orgId,
                    null,
                    'NDA_SIGNED',
                    'Party B signed',
                    `${signerName} signed "${ndaTitle}" — your turn to sign`,
                    ndaLink,
                    draft.id
                )
            } else {
                // Party A signed, Party B still needs to sign — notify Party B if registered
                const partyBEmail = otherSigner?.email || otherPartyEmail
                if (partyBEmail) {
                    const partyBUser = await prisma.user.findUnique({
                        where: { email: partyBEmail.trim().toLowerCase() },
                        select: { id: true },
                    })
                    if (partyBUser) {
                        await createNotification(
                            partyBUser.id,
                            'NDA_SIGNED',
                            'Your turn to sign',
                            `${signerName} signed "${ndaTitle}" — your turn to sign`,
                            ndaLink,
                            draft.id
                        )
                    }
                }
            }
        } catch (e) {
            console.error('Failed to create sign notification:', e)
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: signer.signRequest.organizationId,
                draftId: draft.id,
                eventType: 'SIGNED',
                metadata: {
                    signer_email: signer.email,
                    signer_name: signerName,
                    action: 'public_signature_submitted',
                    party: isPartyA ? 'party_a' : 'party_b',
                    new_state: newWorkflowState
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Signature submitted successfully',
        });
    } catch (error) {
        console.error('Sign public error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : 'Failed to submit signature',
            },
            { status: 500 }
        );
    }
}
