'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

interface ViewNdaClientProps {
  html: string;
  title: string;
  status: string;
  workflowState: string;
  recipientEmail: string | null;
  createdAt: string;
}

function getStatusBadge(workflowState: string, status: string): { label: string; color: string; bgColor: string } {
  switch (workflowState) {
    case 'AWAITING_PARTY_B_REVIEW':
      return { label: 'WAITING REVIEW', color: 'text-orange-700', bgColor: 'bg-orange-50' };
    case 'AWAITING_PARTY_B_SIGNATURE':
      return { label: 'WAITING SIGNATURE', color: 'text-purple-700', bgColor: 'bg-purple-50' };
    case 'AWAITING_PARTY_A_SIGNATURE':
      return { label: 'AWAITING SIGNATURE', color: 'text-purple-700', bgColor: 'bg-purple-50' };
    case 'COMPLETE':
    case 'SIGNING_COMPLETE':
      return { label: 'COMPLETE', color: 'text-green-700', bgColor: 'bg-green-50' };
    default:
      if (status === 'SIGNED') return { label: 'SIGNED', color: 'text-green-700', bgColor: 'bg-green-50' };
      if (status === 'SENT' || status === 'PENDING') return { label: 'SENT', color: 'text-teal-700', bgColor: 'bg-teal-50' };
      return { label: 'DRAFT', color: 'text-gray-600', bgColor: 'bg-gray-100' };
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
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
              <h1 className="text-sm font-bold text-gray-900 truncate max-w-[200px] sm:max-w-[400px]">
                {title}
              </h1>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${badge.bgColor} ${badge.color}`}>
                {badge.label}
              </span>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
