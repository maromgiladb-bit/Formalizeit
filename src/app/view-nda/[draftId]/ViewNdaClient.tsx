'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { StatusPill, type StatusTone } from '@/components/ui/status-pill';

interface ViewNdaClientProps {
  html: string;
  title: string;
  status: string;
  workflowState: string;
  recipientEmail: string | null;
  createdAt: string;
}

function getStatusBadge(workflowState: string, status: string): { label: string; tone: StatusTone } {
  switch (workflowState) {
    case 'AWAITING_PARTY_B_REVIEW':
      return { label: 'Waiting review', tone: 'progress' };
    case 'AWAITING_PARTY_B_SIGNATURE':
      return { label: 'Waiting signature', tone: 'progress' };
    case 'PENDING_INTERNAL_APPROVAL':
      return { label: 'Awaiting approval', tone: 'action' };
    case 'AWAITING_PARTY_A_SIGNATURE':
      return { label: 'Awaiting signature', tone: 'action' };
    case 'COMPLETE':
    case 'SIGNING_COMPLETE':
      return { label: 'Complete', tone: 'done' };
    default:
      if (status === 'SIGNED') return { label: 'Signed', tone: 'done' };
      if (status === 'SENT' || status === 'PENDING') return { label: 'Sent', tone: 'progress' };
      return { label: 'Draft', tone: 'neutral' };
  }
}

export default function ViewNdaClient({ html, title, status, workflowState, recipientEmail, createdAt }: ViewNdaClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const badge = getStatusBadge(workflowState, status);

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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header (static — the global floating nav owns the top of the viewport) */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <h1 className="text-sm font-bold text-ink truncate max-w-[200px] sm:max-w-[400px]">
                {title}
              </h1>
              <StatusPill tone={badge.tone} label={badge.label} className="shrink-0" />
            </div>

            <span className="text-xs text-gray-500 hidden sm:block">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Info bar */}
      {recipientEmail && (
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-600">Sent to:</span> {recipientEmail}
            </p>
          </div>
        </div>
      )}

      {/* NDA Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            sandbox="allow-same-origin"
            title="NDA Document"
            className="w-full border-0"
            style={{ minHeight: '1200px' }}
          />
        </div>
      </div>
    </div>
  );
}
