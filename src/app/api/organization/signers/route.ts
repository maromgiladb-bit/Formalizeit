import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/db-organization';

/**
 * List the active organization's authorized signers, excluding the current user.
 *
 * A signer is a member who can apply the company signature: role SIGNER, or role
 * ADMINISTRATOR with the signer toggle on. Used by the dashboard "Ask a teammate to
 * sign" picker so a contributor can choose exactly who to notify.
 *
 * GET /api/organization/signers -> { signers: { id, name, email }[] }
 */
export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeMembership = await getActiveOrganization();
    if (!activeMembership) {
        return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({ where: { externalId: userId } });

    const signerMemberships = await prisma.membership.findMany({
        where: {
            organizationId: activeMembership.organizationId,
            status: 'ACTIVE',
            OR: [
                { role: 'SIGNER' },
                { role: 'ADMINISTRATOR', isSigner: true },
            ],
        },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    const signers = signerMemberships
        .map(m => m.user)
        .filter(u => u.id !== currentUser?.id && !!u.email)
        .map(u => ({ id: u.id, name: u.name ?? '', email: u.email }));

    return NextResponse.json({ signers });
}
