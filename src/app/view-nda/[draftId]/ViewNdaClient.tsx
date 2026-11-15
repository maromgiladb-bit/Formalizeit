'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { StatusPill } from '@/components/ui/status-pill';
import { getWorkflowStatusInfo } from '@/lib/workflowStatus';

interface ViewNdaClientProps {
  html: string;
  title: string;
  status: string;
  workflowState: string;
  recipientEmail: string | null;
  createdAt: string;
}

export default function ViewNdaClient({ html, title, status, workflowState, recipientEmail, createdAt }: ViewNdaClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // This page is only reachable from the sender's dashboard, so the viewer is Party A.
  const badge = getWorkflowStatusInfo({ workflowState, status, viewer: 'sender' });

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const adjustHeight = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          iframe.style.height = doc.body.scrollHeight + 40 + 'px';
        }
      } catch {
        // sandbox may block access
      }
    };

    iframe.addEventListener('load', adjustHeight);
    return () => iframe.removeEventListener('load', adjustHeight);
  }, [html]);

  return (
    <div className="min-h-screen bg-ground font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-ink hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Dashboard
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
          {/* NDA document in a sheet frame */}
          <Sheet meta={<>{title} &middot; created {formattedDate}</>} className="overflow-hidden order-2 lg:order-1">
            <iframe
              ref={iframeRef}
              srcDoc={html}
              sandbox="allow-same-origin"
              title="NDA Document"
              className="w-full border-0"
              style={{ minHeight: '1200px' }}
            />
          </Sheet>

          {/* Details panel */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 rounded-sheet border border-line bg-white p-5">
            <div className="flex items-start gap-2 min-w-0">
              <FileText className="w-4 h-4 text-muted-ink shrink-0 mt-1" aria-hidden="true" />
              <h1 className="font-display text-lg font-semibold text-ink tracking-tight break-words min-w-0">
                {title}
              </h1>
            </div>
            <div className="mt-3">
              <StatusPill tone={badge.tone} label={badge.label} shape="crisp" />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {recipientEmail && (
                <div>
                  <dt className="text-xs font-semibold text-muted-ink">Sent to</dt>
                  <dd className="text-ink break-all">{recipientEmail}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-muted-ink">Created</dt>
                <dd className="font-doc-mono text-xs text-ink">{formattedDate}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" size="sm" shape="crisp" className="mt-5 w-full shadow-none">
              <Link href="/dashboard">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                All NDAs
              </Link>
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
