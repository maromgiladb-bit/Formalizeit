import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import { htmlToPdf } from '@/lib/htmlToPdf';
import { storeNdaPdf } from '@/lib/storeNdaPdf';
import { sendEmail, recipientSignRequestEmailHtml, getAppUrl } from '@/lib/email';

export const runtime = 'nodejs'; // Required for Puppeteer

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

        // Get draft
        const draft = await prisma.ndaDraft.findUnique({
            where: {
                id: draftId,
                createdByUserId: user.id,
            },
        });

        if (!draft) {
            return NextResponse.json(
                { error: 'Draft not found or unauthorized' },
                { status: 404 }
            );
        }

        // Update draft status and content
        const updatedDraft = await prisma.ndaDraft.update({
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

        // Generate PDF with Party A's signature
        console.log('📄 Generating PDF with Party A signature...');
        let html = await renderNdaHtml(formData);

        // Inject Party A's signature
        if (signatureImage) {
            const patterns = [
                /<div class="sign-box" id="party-a-signature">([\s\S]*?)<\/div>/,
                /<div class="line"><\/div>/,
            ];

            for (const pattern of patterns) {
                if (pattern.test(html)) {
                    const signatureHtml = `
            <div style="margin-top: 10px;">
              <img src="${signatureImage}" alt="Signature" style="max-height: 60px; display: block;" />
              <div style="margin-top: 5px; font-size: 14px;">
                <div><strong>${signerName}</strong></div>
                <div>${signerTitle}</div>
                <div>${signerDate}</div>
              </div>
            </div>
          `;

                    html = html.replace(pattern, (match) => {
                        return match.replace(/<\/div>$/, `${signatureHtml}</div>`);
                    });
                    break;
                }
            }
        }

        const pdfBuffer = await htmlToPdf(html);
        console.log('📄 PDF generated, size:', pdfBuffer.length, 'bytes');

        // Store SENT PDF in S3
        await storeNdaPdf({
            signRequestId: signRequest.id,
            kind: 'SENT',
            pdfBuffer: pdfBuffer,
        });
        console.log('✅ SENT PDF stored in S3');

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

        // Send email with PDF attachment
        const signLink = `${getAppUrl()}/sign-nda-public/${signer.id}`;
        const pdfBase64 = pdfBuffer.toString('base64');

        try {
            await sendEmail({
                to: partyBEmail,
                subject: `Please sign NDA – ${draft.title || 'NDA'}`,
                html: recipientSignRequestEmailHtml(
                    draft.title || 'Untitled NDA',
                    signLink
                ),
                attachments: [
                    {
                        filename: `${draft.title || 'NDA'}-${draft.id.substring(0, 8)}.pdf`,
                        content: pdfBase64,
                        contentType: 'application/pdf',
                    },
                ],
            });
            console.log('✅ Email sent successfully to:', partyBEmail);
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send email. Please check your email configuration.' },
                { status: 500 }
            );
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
