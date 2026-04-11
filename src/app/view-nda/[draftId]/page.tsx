import { notFound, redirect } from 'next/navigation';
import { getActiveOrganization } from '@/lib/db-organization';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import ViewNdaClient from './ViewNdaClient';

export default async function ViewNdaPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;

  const activeMembership = await getActiveOrganization();
  if (!activeMembership) redirect('/dashboard');

  const draft = await prisma.ndaDraft.findFirst({
    where: {
      id: draftId,
      organizationId: activeMembership.organizationId,
    },
  });

  if (!draft) notFound();

  const formData = (draft.content as Record<string, unknown>) || {};
  const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';

  let html: string;
  try {
    html = await renderNdaHtml(formData, templateId);
  } catch {
    html = '<div style="padding:2rem;color:#666;text-align:center;">Unable to render NDA content.</div>';
  }

  return (
    <ViewNdaClient
      html={html}
      title={draft.title || (formData.docName as string) || 'Untitled NDA'}
      status={draft.status}
      workflowState={draft.workflowState}
      recipientEmail={draft.recipientEmail}
      createdAt={draft.createdAt.toISOString()}
    />
  );
}
