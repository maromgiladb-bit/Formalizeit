import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { iconForEvent } from '@/lib/writeActivity';

/**
 * Public activity endpoint — Party B accesses via their signer ID.
 * GET /api/ndas/activity-public?signerId=xxx
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const signerId = searchParams.get('signerId');

        if (!signerId) {
            return NextResponse.json({ error: 'signerId required' }, { status: 400 });
        }

        // Validate the signer exists and get the draftId
        const signer = await prisma.signer.findUnique({
            where: { id: signerId },
            include: { signRequest: { select: { draftId: true } } },
        });

        if (!signer) {
            return NextResponse.json({ error: 'Invalid signer' }, { status: 404 });
        }

        const draftId = signer.signRequest.draftId;

        const events = await prisma.auditEvent.findMany({
            where: { draftId },
            orderBy: { createdAt: 'asc' },
        });

        const activity = events.map((e) => ({
            id: e.id,
            createdAt: e.createdAt,
            eventType: e.eventType,
            icon: iconForEvent(e.eventType),
            label: (e.metadata as Record<string, string> | null)?.label ?? e.eventType,
            actorName: (e.metadata as Record<string, string> | null)?.actorName ?? null,
            actorRole: (e.metadata as Record<string, string> | null)?.actorRole ?? null,
            // Note: we deliberately omit actorEmail from public response for privacy
        }));

        return NextResponse.json({ activity });
    } catch (err) {
        console.error('[activity-public] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
