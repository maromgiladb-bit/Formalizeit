import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

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

  if (!user) {
    // If auth exists but checking DB failed to find user, try to sync/create
    const { email } = await currentUser().then(u => ({ email: u?.emailAddresses[0]?.emailAddress }));

    if (email) {
      user = await prisma.user.create({
        data: {
          externalId: userId,
          email: email
        },
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
            orderBy: { createdAt: 'desc' }
          },
          signers: {
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
        }
      });
    } else {
      // connecting issues or no email
      redirect('/');
    }
  }

  // Transform created/sent NDAs
  const createdNdas = user.createdDrafts.map((draft) => {
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

  // Transform received NDAs
  const receivedNdas = user.signers.map((signer) => {
    const draft = signer.signRequest.draft;
    const sender = (draft as { createdBy?: { name?: string; email?: string } }).createdBy;
    const content = draft.content as Record<string, unknown> | null;

    return {
      id: draft.id,
      partyName: draft.title || 'Untitled NDA',
      status: signer.status?.toLowerCase() || 'pending',
      workflowState: (draft as { workflowState?: string }).workflowState || undefined,
      createdAt: draft.createdAt || new Date(),
      signedAt: signer.updatedAt, // Approximation
      type: 'received' as const,
      signerId: signer.id,
      senderName: sender?.name || (content?.party_a_name as string) || undefined,
      senderEmail: sender?.email || (draft as { recipientEmail?: string }).recipientEmail || undefined,
    };
  });

  // Combine all NDAs
  const allNdas = [...createdNdas, ...receivedNdas].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return <DashboardClient ndas={allNdas} />;
}
