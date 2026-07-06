import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { getActiveOrganization } from '@/lib/db-organization';
import { getChangelogSince, getCurrentStandardNdaVersion } from '@/lib/ndaChangelog';
import { isDraftExpired } from '@/lib/signLink';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const params = await searchParams
  const checkoutSuccess = params.checkout === 'success'
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { externalId: userId },
    include: {
      signers: {
        // Include ALL signer roles — both SIGNER (received as Party B)
        // and SENDER (received sign-back request as Party A)
        include: {
          signRequest: {
            include: {
              draft: {
                include: {
                  createdBy: true,
                  organization: true,
                }
              },
              ndaPdfs: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
  });

  // Also fetch any signers matched by email but not yet linked to userId
  // (covers the case where user signed via public link before logging in)
  const emailSigners = user ? await prisma.signer.findMany({
    where: {
      email: user.email,
      userId: null,
    },
    include: {
      signRequest: {
        include: {
          draft: { include: { createdBy: true, organization: true } },
          ndaPdfs: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  }) : [];

  if (!user) {
    redirect('/settings/team');
  }

  // Fetch org-scoped drafts if user belongs to an organization
  const membership = await getActiveOrganization();

  if (!membership) {
    redirect('/onboarding');
  }

  const draftSource = await prisma.ndaDraft.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      signRequests: {
        include: {
          ndaPdfs: true,
          signers: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform created/sent NDAs
  const createdNdas = draftSource.map((draft) => {
    // Find the latest sign request and its PDF
    const latestSignRequest = draft.signRequests?.[0];
    const sentPdf = latestSignRequest?.ndaPdfs?.find((pdf: { kind: string }) => pdf.kind === 'SENT');
    const content = draft.content as Record<string, unknown> | null;

    // Find Party A signer (SENDER role) for sign link
    const partyASigner = latestSignRequest?.signers?.find((s: { role: string }) => s.role === 'SENDER');

    // A sent NDA whose signing link has lapsed — the sender can resend or delete it.
    const expired = isDraftExpired(latestSignRequest?.signers);

    return {
      id: draft.id,
      partyName: draft.title || 'Untitled NDA',
      status: draft.status?.toLowerCase() || 'draft',
      workflowState: (draft as { workflowState?: string }).workflowState || 'FILLING',
      recipientEmail: (draft as { recipientEmail?: string }).recipientEmail || undefined,
      partyBName: (content?.party_b_name as string) || undefined,
      partyBEmail: (content?.party_b_email as string) || (draft as { recipientEmail?: string }).recipientEmail || undefined,
      createdAt: draft.createdAt || new Date(),
      signedAt: null,
      type: 'created' as const,
      pdfId: sentPdf?.id || null,
      partyASignerId: (partyASigner as { id: string } | undefined)?.id || null,
      expired,
      archivedAt: draft.archivedAt ?? null,
    };
  });

  // Transform received NDAs (merge userId-linked and email-matched signers, deduplicate)
  const allSigners = [
    ...(user.signers || []),
    ...emailSigners.filter(es => !user.signers.some(us => us.id === es.id)),
  ];

  const receivedNdas = allSigners
    // Don't show NDAs the user created (they already appear in Sent tab)
    // We explicitly check createdByUserId rather than createdDraftIds because
    // in an org context, createdDraftIds contains ALL org drafts, not just the user's.
    .filter(signer => signer.signRequest.draft.createdByUserId !== user!.id)
    .map((signer) => {
      const draft = signer.signRequest.draft;
      const sender = (draft as { createdBy?: { name?: string; email?: string } }).createdBy;
      const content = draft.content as Record<string, unknown> | null;

      const senderOrg = (draft as { organization?: { name?: string } }).organization;

      return {
        id: draft.id,
        partyName: draft.title || 'Untitled NDA',
        status: signer.status?.toLowerCase() || 'pending',
        workflowState: (draft as { workflowState?: string }).workflowState || undefined,
        createdAt: draft.createdAt || new Date(),
        signedAt: signer.updatedAt,
        type: 'received' as const,
        signerId: signer.id,
        senderName: sender?.name || (content?.party_a_name as string) || undefined,
        senderEmail: sender?.email || undefined,
        senderOrganizationName: senderOrg?.name || undefined,
      };
    });

  // Combine all NDAs. A draft created by a teammate in the same org can appear
  // in both createdNdas (org-scoped) and receivedNdas (current user is a signer
  // on it). Keep the created/Sent entry and drop the duplicate received one so
  // every row has a unique key.
  const createdIds = new Set(createdNdas.map((n) => n.id));
  const allNdas = [
    ...createdNdas,
    ...receivedNdas.filter((n) => !createdIds.has(n.id)),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { organizationId: membership.organizationId },
    select: { companyName: true },
  });
  const hasCompanyProfile = !!(companyProfile?.companyName);

  // Surface any pending team invites so they aren't missed after sign-in.
  const pendingInviteRows = await prisma.membership.findMany({
    where: { userId: user.id, status: 'PENDING_INVITE' },
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const pendingInvites = pendingInviteRows.map((m) => ({
    membershipId: m.id,
    organizationName: m.organization?.name || 'a company',
    role: m.role as string,
  }));

  // Standard NDA review popup: show when the current standard-NDA version is
  // newer than what this user last acknowledged.
  const currentNdaVersion = getCurrentStandardNdaVersion();
  const ndaChanges = getChangelogSince(user.acknowledgedNdaVersion);

  return (
    <DashboardClient
      ndas={allNdas}
      checkoutSuccess={checkoutSuccess}
      hasCompanyProfile={hasCompanyProfile}
      pendingInvites={pendingInvites}
      ndaUpdate={ndaChanges.length > 0 ? { version: currentNdaVersion, entries: ndaChanges } : undefined}
    />
  );
}
