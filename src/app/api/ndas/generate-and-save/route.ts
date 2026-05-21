import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import { sanitizeForHtml } from '@/lib/sanitize';
import { htmlToPdf } from '@/lib/htmlToPdf';
import { storeNdaPdf } from '@/lib/storeNdaPdf';
import { getActiveOrganization } from '@/lib/db-organization';
import { canSignNDA } from '@/lib/organizationRoles';

export const runtime = 'nodejs'; // Required for Puppeteer

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { draftId, formData, signatureImage, signerName, signerTitle, signerDate } = body;

        if (!draftId || !formData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user to verify ownership
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

        if (!canSignNDA(activeMembership)) {
            return NextResponse.json({ error: 'You do not have permission to generate and save NDAs.' }, { status: 403 });
        }

        // Get the draft in active organization
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

        // Update draft with form data and status
        const updatedDraft = await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                content: formData,
                status: 'SENT',
                sentAt: new Date(),
            },
        });

        // Create or update sign request
        let signRequest = await prisma.signRequest.findFirst({
            where: {
                draftId: draftId,
            },
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

        // Generate PDF with signature
        console.log('📄 Generating PDF with signature...');
        let html = await renderNdaHtml(formData);

        // Inject signature into HTML if provided
        if (signatureImage) {
            console.log('✍️ Injecting signature into HTML...');

            // Try multiple patterns for different templates
            const patterns = [
                // Professional template pattern
                /<div class="sign-box" id="party-a-signature">([\s\S]*?)<\/div>/,
                // Basic template pattern with class="line"
                /<div class="line"><\/div>/,
                // Generic fallback
                /<div[^>]*(?:id|class)="[^"]*signature[^"]*"[^>]*>[\s\S]*?<\/div>/i
            ];

            let injected = false;
            for (const pattern of patterns) {
                if (pattern.test(html)) {
                    const signatureHtml = `
                        <div style="margin-top: 10px;">
                            <img src="${signatureImage}" alt="Signature" style="max-height: 60px; display: block;" />
                            <div style="margin-top: 5px; font-size: 14px;">
                                <div><strong>${sanitizeForHtml(signerName)}</strong></div>
                                <div>${sanitizeForHtml(signerTitle)}</div>
                                <div>${sanitizeForHtml(signerDate)}</div>
                            </div>
                        </div>
                    `;

                    html = html.replace(pattern, (match) => {
                        return match.replace(/<\/div>$/, `${signatureHtml}</div>`);
                    });

                    injected = true;
                    console.log('✅ Signature injected using pattern');
                    break;
                }
            }

            if (!injected) {
                console.warn('⚠️ No signature placeholder found in template');
            }
        }

        const pdfBuffer = await htmlToPdf(html);
        console.log('📄 PDF generated, size:', pdfBuffer.length, 'bytes');

        // Store PDF in S3
        try {
            await storeNdaPdf({
                signRequestId: signRequest.id,
                kind: 'SENT',
                pdfBuffer: pdfBuffer,
            });
            console.log('✅ PDF stored in S3 (SENT)');
        } catch (s3Error) {
            console.error('❌ Failed to store PDF in S3:', s3Error);
            throw new Error('Failed to store PDF in S3');
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'SENT',
                metadata: {
                    action: 'generate_and_save_pdf',
                },
            },
        });

        // Get the stored PDF to return its ID
        const storedPdf = await prisma.ndaPdf.findUnique({
            where: {
                signRequestId_kind: {
                    signRequestId: signRequest.id,
                    kind: 'SENT',
                },
            },
        });

        return NextResponse.json({
            success: true,
            draft: updatedDraft,
            signRequest,
            pdfId: storedPdf?.id,
            message: 'PDF generated and saved successfully',
        });
    } catch (error) {
        console.error('Generate and save PDF error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to generate and save PDF',
            },
            { status: 500 }
        );
    }
}
