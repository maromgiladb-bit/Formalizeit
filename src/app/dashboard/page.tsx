import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { getActiveOrganization } from '@/lib/db-organization';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  let user = await prisma.user.findUnique({
    where: { externalId: userId },
    include: {
      createdDrafts: {
        include: {
          signRequests: {
            include: {
              ndaPdfs: true,
              signers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      signers: {
        // Include ALL signer roles — both SIGNER (received as Party B)
        // and APPROVER (received sign-back request as Party A)
        include: {
          signRequest: {
            include: {
              draft: {
                include: {
                  createdBy: true,
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
          draft: { include: { createdBy: true } },
          ndaPdfs: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  }) : [];

  if (!user) {
    // ensureDbUser() in layout guarantees the user exists;
    // if somehow missing, redirect to team settings
    redirect('/settings/team');
  }

  // Fetch org-scoped drafts if user belongs to an organization
  const membership = await getActiveOrganization();
  const draftSource = membership
    ? await prisma.ndaDraft.findMany({
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
      })
    : user.createdDrafts;

  // Transform created/sent NDAs
  const createdNdas = draftSource.map((draft) => {
    // Find the latest sign request and its PDF
    const latestSignRequest = draft.signRequests?.[0];
    const sentPdf = latestSignRequest?.ndaPdfs?.find((pdf: { kind: string }) => pdf.kind === 'SENT');
    const content = draft.content as Record<string, unknown> | null;

    // Find Party A signer (APPROVER role) for sign link
    const partyASigner = latestSignRequest?.signers?.find((s: { role: string }) => s.role === 'APPROVER');

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
    };
  });

  // Transform received NDAs (merge userId-linked and email-matched signers, deduplicate)
  const allSigners = [
    ...(user.signers || []),
    ...emailSigners.filter(es => !user.signers.some(us => us.id === es.id)),
  ];

  // Build set of draft IDs the user CREATED so we can avoid double-listing them
  const createdDraftIds = new Set(createdNdas.map(n => n.id));

  const receivedNdas = allSigners
    // Don't show NDAs the user created (they already appear in Sent tab)
    .filter(signer => !createdDraftIds.has(signer.signRequest.draft.id))
    .map((signer) => {
      const draft = signer.signRequest.draft;
      const sender = (draft as { createdBy?: { name?: string; email?: string } }).createdBy;
      const content = draft.content as Record<string, unknown> | null;

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
      };
    });

  // Combine all NDAs
  const allNdas = [...createdNdas, ...receivedNdas].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return <DashboardClient ndas={allNdas} />;
}
