import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSignedS3Url } from '@/lib/s3';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Look up the user in our database using Clerk's externalId
        const user = await prisma.user.findUnique({
            where: { externalId: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Load NdaPdf with organization relationship
        const ndaPdf = await prisma.ndaPdf.findUnique({
            where: { id },
            include: {
                organization: true,
            },
        });

        if (!ndaPdf) {
            return NextResponse.json(
                { error: 'PDF not found' },
                { status: 404 }
            );
        }

        // Check organization membership using database user UUID
        const membership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                organizationId: ndaPdf.organizationId,
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Forbidden: You are not a member of this organization' },
                { status: 403 }
            );
        }

        // Generate signed URL (expires in 5 minutes). Force inline so the PDF
        // renders in the new tab instead of downloading.
        const signedUrl = await getSignedS3Url(ndaPdf.s3Key, 300, { inline: true });

        // Redirect to the signed URL
        return NextResponse.redirect(signedUrl);
    } catch (error) {
        console.error('Error retrieving NDA PDF:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
