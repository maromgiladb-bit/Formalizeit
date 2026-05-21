import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ndaId, partyASignature, partyBSignature } = body;

        if (!ndaId || !partyASignature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify user and NDA ownership
        const user = await prisma.user.findUnique({ where: { externalId: userId } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const existingDraft = await prisma.ndaDraft.findUnique({
            where: { id: ndaId },
        });

        if (!existingDraft || existingDraft.createdByUserId !== user.id) {
            return NextResponse.json({ error: 'NDA not found or unauthorized' }, { status: 404 });
        }

        // Prepare updated data
        // We merge the new signatures into the existing data object
        const currentData = (existingDraft.content as Record<string, any>) || {};
        const updatedData = {
            ...currentData,
            partyASignature,
            partyBSignature,
        };

        // Update the NDA
        const nda = await prisma.ndaDraft.update({
            where: { id: ndaId },
            data: {
                status: 'SIGNED',
                sentAt: existingDraft.sentAt ?? new Date(),
                content: updatedData,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, nda });

    } catch (error) {
        console.error('Error signing NDA:', error);
        return NextResponse.json({ error: 'Failed to sign NDA' }, { status: 500 });
    }
}
