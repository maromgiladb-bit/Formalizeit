import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { iconForEvent } from '@/lib/writeActivity';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ draftId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { draftId } = await params;

        // Verify the draft belongs to the caller's org
        const draft = await prisma.ndaDraft.findUnique({
            where: { id: draftId },
            include: { organization: { include: { memberships: { where: { user: { externalId: userId } } } } } },
        });

        if (!draft) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        if (draft.organization.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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
            actorEmail: (e.metadata as Record<string, string> | null)?.actorEmail ?? null,
            actorRole: (e.metadata as Record<string, string> | null)?.actorRole ?? null,
        }));

        return NextResponse.json({ activity });
    } catch (err) {
        console.error('[activity] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
