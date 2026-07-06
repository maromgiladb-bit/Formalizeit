import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/db-organization';
import { getClientIp } from '@/lib/signatureEvidence';
import { getCurrentStandardNdaVersion } from '@/lib/ndaChangelog';

/**
 * Record that the signed-in user has reviewed & acknowledged the current
 * standard-NDA version (the "I've reviewed the updates" checkbox in the review
 * popup). Stores the version + timestamp on the user and writes an audit event.
 *
 * POST /api/user/acknowledge-nda-version
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { externalId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const version = getCurrentStandardNdaVersion();

    await prisma.user.update({
      where: { id: user.id },
      data: { acknowledgedNdaVersion: version, acknowledgedNdaVersionAt: new Date() },
    });

    // Audit the acknowledgement. organizationId is required on AuditEvent, so we
    // only write one when the user has an active org context (best-effort).
    try {
      const membership = await getActiveOrganization();
      if (membership) {
        await prisma.auditEvent.create({
          data: {
            organizationId: membership.organizationId,
            userId: user.id,
            eventType: 'NDA_VERSION_ACKNOWLEDGED',
            ipAddress: getClientIp(request),
            metadata: { version, email: user.email },
          },
        });
      }
    } catch (auditError) {
      console.error('Failed to write NDA acknowledgement audit event:', auditError);
    }

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error('Acknowledge NDA version error:', error);
    return NextResponse.json({ error: 'Failed to record acknowledgement' }, { status: 500 });
  }
}
