'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Plus, FileText, Edit, Trash2, FileDown, CheckCircle, X, Search } from 'lucide-react';
import Link from 'next/link';
import { StatusPill, type StatusTone } from '@/components/ui/status-pill';
import ProfilePrompt from './ProfilePrompt';

interface NDA {
  id: string;
  partyName: string;
  status: string;
  workflowState?: string;
  recipientEmail?: string;
  partyBName?: string;
  partyBEmail?: string;
  createdAt: Date;
  signedAt: Date | null;
  type: 'created' | 'received';
  pdfId?: string | null;
  partyASignerId?: string | null;
  signerId?: string | null;
  senderName?: string;
  senderEmail?: string;
  senderOrganizationName?: string;
}

interface DashboardClientProps {
  ndas: NDA[];
  checkoutSuccess?: boolean;
  hasCompanyProfile?: boolean;
}

function getWorkflowStatusInfo(nda: NDA): { label: string; tone: StatusTone } {
  const workflowState = nda.workflowState;

  switch (workflowState) {
    case 'AWAITING_INPUT':
      return { label: 'Awaiting input', tone: 'progress' };
    case 'REVIEWING_CHANGES':
      return { label: 'Review changes', tone: 'action' };
    case 'READY_TO_SIGN':
      return { label: 'Ready to sign', tone: 'progress' };
    case 'AWAITING_SIGNATURE':
      return { label: 'Awaiting signature', tone: 'progress' };
    case 'SIGNING_COMPLETE':
    case 'COMPLETE':
      return { label: 'Complete', tone: 'done' };
    case 'AWAITING_PARTY_A_REVIEW':
      return { label: 'Changes to review', tone: 'action' };
    case 'AWAITING_PARTY_B_REVIEW':
      return { label: 'Waiting review', tone: 'progress' };
    case 'AWAITING_PARTY_A_SIGNATURE':
      return { label: 'Sign now', tone: 'action' };
    case 'AWAITING_PARTY_B_SIGNATURE':
      if (nda.type === 'received') {
        return { label: 'Sign now', tone: 'action' };
      }
      return { label: 'Waiting signature', tone: 'progress' };
    case 'FILLING':
    default:
      if (nda.status === 'cancelled') {
        return { label: 'Cancelled', tone: 'neutral' };
      } else if (nda.status === 'signed') {
        return { label: 'Signed', tone: 'done' };
      } else if (nda.status === 'sent' || nda.status === 'pending') {
        return { label: 'Sent', tone: 'progress' };
      } else {
        return { label: 'Draft', tone: 'neutral' };
      }
  }
}

export default function DashboardClient({ ndas, checkoutSuccess, hasCompanyProfile }: DashboardClientProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'received' | 'signed' | 'action'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [localNdas, setLocalNdas] = useState(ndas);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showProBanner, setShowProBanner] = useState(!!checkoutSuccess);

  useEffect(() => {
    if (checkoutSuccess) {
      // Remove only the `checkout` param, preserving any other search params
      const params = new URLSearchParams(window.location.search)
      params.delete('checkout')
      const clean = params.size > 0 ? `?${params.toString()}` : ''
      window.history.replaceState(null, '', `/dashboard${clean}`)
    }
  }, [checkoutSuccess]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#nda-')) return;
      const draftId = hash.slice(5);
      setHighlightedId(draftId);
      const el = document.getElementById(`nda-${draftId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setHighlightedId(null), 2500);
    };

    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/ndas/drafts/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete draft');
      }

      setLocalNdas(prev => prev.filter(nda => nda.id !== id));
      setMessage({ type: 'success', text: 'Draft deleted successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete draft',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = async (id: string, name: string) => {
    if (!confirm(`Cancel "${name}"? The recipient will no longer be able to act on it.`)) return;

    setCancellingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/ndas/${id}/cancel`, { method: 'POST' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel NDA');
      }

      setLocalNdas(prev => prev.map(nda => (nda.id === id ? { ...nda, status: 'cancelled' } : nda)));
      setMessage({ type: 'success', text: 'NDA cancelled' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Cancel error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to cancel NDA',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const isCancellable = (nda: NDA) =>
    nda.type === 'created' &&
    !['draft', 'signed', 'cancelled'].includes(nda.status) &&
    nda.workflowState !== 'COMPLETE' &&
    nda.workflowState !== 'SIGNING_COMPLETE' &&
    (nda.status === 'sent' || nda.status === 'pending' || (nda.workflowState?.startsWith('AWAITING') ?? false));

  const filteredNdas = localNdas
    .filter((nda) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const recipient = nda.type === 'received'
          ? (nda.senderName || nda.senderEmail || '')
          : (nda.partyBName || nda.partyBEmail || nda.recipientEmail || '');
        if (!nda.partyName.toLowerCase().includes(q) && !recipient.toLowerCase().includes(q)) return false;
      }
      if (filter === 'all') return true;
      const isActionRequired = ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '') ||
        (nda.type === 'received' && nda.workflowState === 'AWAITING_PARTY_B_SIGNATURE');
      const isSigned = nda.status === 'signed' || nda.workflowState === 'COMPLETE';
      if (filter === 'action') return isActionRequired;
      if (filter === 'signed') return isSigned && !isActionRequired;
      if (filter === 'draft') return nda.status === 'draft' && nda.type === 'created' && !isActionRequired && !isSigned;
      if (filter === 'sent') return nda.type === 'created' && (nda.status === 'sent' || nda.status === 'pending') && !isActionRequired && !isSigned;
      if (filter === 'received') return nda.type === 'received';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.partyName.localeCompare(b.partyName);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const actionRequired = (n: NDA) =>
    ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(n.workflowState || '') ||
    (n.type === 'received' && n.workflowState === 'AWAITING_PARTY_B_SIGNATURE');
  const isSigned = (n: NDA) => n.status === 'signed' || n.workflowState === 'COMPLETE';

  const stats = {
    total: localNdas.length,
    draft: localNdas.filter((n) => n.status === 'draft' && n.type === 'created' && !actionRequired(n) && !isSigned(n)).length,
    sent: localNdas.filter((n) => n.type === 'created' && (n.status === 'sent' || n.status === 'pending') && !actionRequired(n) && !isSigned(n)).length,
    received: localNdas.filter((n) => n.type === 'received').length,
    signed: localNdas.filter((n) => isSigned(n) && !actionRequired(n)).length,
    action: localNdas.filter((n) => actionRequired(n)).length,
  };

  const statCards: {
    key: typeof filter;
    label: string;
    count: number;
    iconColor: string;
    countColor: string;
    urgent?: boolean;
  }[] = [
    { key: 'all', label: 'Total NDAs', count: stats.total, iconColor: 'text-teal-700 bg-teal-50', countColor: 'text-ink' },
    { key: 'draft', label: 'Drafts', count: stats.draft, iconColor: 'text-gray-500 bg-gray-100', countColor: 'text-ink' },
    { key: 'sent', label: 'Sent', count: stats.sent, iconColor: 'text-teal-700 bg-teal-50', countColor: 'text-ink' },
    { key: 'received', label: 'Received', count: stats.received, iconColor: 'text-teal-700 bg-teal-50', countColor: 'text-ink' },
    { key: 'action', label: 'Action Required', count: stats.action, iconColor: 'text-amber-600 bg-amber-50', countColor: stats.action > 0 ? 'text-amber-600' : 'text-ink', urgent: true },
    { key: 'signed', label: 'Signed', count: stats.signed, iconColor: 'text-teal-700 bg-teal-50', countColor: 'text-ink' },
  ];

  const statIcons: Record<string, React.ReactNode> = {
    all: <FileText className="w-5 h-5" />,
    draft: <Edit className="w-5 h-5" />,
    sent: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    received: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    action: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    signed: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const getRecipient = (nda: NDA) => {
    if (nda.type === 'received') {
      const name = nda.senderName || nda.senderEmail || '—';
      return nda.senderOrganizationName ? `${name} at ${nda.senderOrganizationName}` : name;
    }
    return nda.partyBName || nda.partyBEmail || nda.recipientEmail || '—';
  };

  const getRecipientLabel = (nda: NDA) => {
    if (nda.type === 'received') return 'From';
    return 'To';
  };

  const renderActions = (nda: NDA) => (
    <>
      {/* DRAFT: Edit + Delete */}
      {nda.status === 'draft' && (
        <>
          <Link href={`/fillndahtml?draftId=${nda.id}`}>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          </Link>
          <button
            onClick={() => handleDelete(nda.id, nda.partyName)}
            disabled={deletingId === nda.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deletingId === nda.id ? 'Deleting...' : 'Delete'}
          </button>
        </>
      )}

      {/* AWAITING_PARTY_A_SIGNATURE: Sign Now */}
      {nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE' && nda.partyASignerId && (
        <Link href={`/sign-nda-public/${nda.partyASignerId}`}>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-800 text-white hover:bg-teal-700 transition-colors duration-200 cursor-pointer">
            <Edit className="w-3.5 h-3.5" />
            Sign Now
          </button>
        </Link>
      )}

      {/* AWAITING_PARTY_A_REVIEW: Review Changes */}
      {nda.workflowState === 'AWAITING_PARTY_A_REVIEW' && nda.partyASignerId && (
        <Link href={`/fillndahtml-public/${nda.partyASignerId}`}>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-200 cursor-pointer">
            <Eye className="w-3.5 h-3.5" />
            Review
          </button>
        </Link>
      )}

      {/* RECEIVED/INCOMING: Sign Now or Review */}
      {nda.type === 'received' && nda.signerId && !['COMPLETE', 'SIGNING_COMPLETE'].includes(nda.workflowState || '') && (
        nda.workflowState === 'AWAITING_PARTY_B_SIGNATURE' ? (
          <Link href={`/sign-nda-public/${nda.signerId}`}>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-800 text-white hover:bg-teal-700 transition-colors duration-200 cursor-pointer">
              <Edit className="w-3.5 h-3.5" />
              Sign Now
            </button>
          </Link>
        ) : (
          <Link href={`/fillndahtml-public/${nda.signerId}`}>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <Eye className="w-3.5 h-3.5" />
              Review
            </button>
          </Link>
        )
      )}

      {/* VIEW: completed / sent NDAs */}
      {(() => {
        const isComplete = nda.workflowState === 'COMPLETE' || nda.workflowState === 'SIGNING_COMPLETE' || nda.status === 'signed';
        const isDraft = nda.status === 'draft';
        const hasActionButton = ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '');
        const isReceivedWithReview = nda.type === 'received' && nda.signerId && !isComplete;

        if (isComplete) {
          return (
            <button
              onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.id}`, '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors duration-200 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              View PDF
            </button>
          );
        }

        if (!isDraft && !hasActionButton && !isReceivedWithReview && nda.type === 'created') {
          return (
            <Link href={`/view-nda/${nda.id}`}>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
            </Link>
          );
        }

        return null;
      })()}

      {/* In-flight: Cancel */}
      {isCancellable(nda) && (
        <button
          onClick={() => handleCancel(nda.id, nda.partyName)}
          disabled={cancellingId === nda.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-3.5 h-3.5" />
          {cancellingId === nda.id ? 'Cancelling...' : 'Cancel'}
        </button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Compact header */}
        <div className="flex items-center justify-between pt-8 pb-6 border-b border-gray-100">
          <div>
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">My NDAs</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track your non-disclosure agreements</p>
          </div>
          <Link href="/templates" className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-teal-800 text-white rounded-xl font-semibold shadow-card hover:bg-teal-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-700 text-sm">
            <Plus className="w-4 h-4" />
            New NDA
          </Link>
        </div>


        {/* Message banner */}
        {message && (
          <div className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-6">
          {statCards.map((card) => {
            const isActive = filter === card.key;
            return (
              <button
                key={card.key}
                onClick={() => setFilter(card.key)}
                className={`relative text-left p-4 rounded-2xl border transition-all duration-200 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-white border-transparent ring-2 ring-teal-600 shadow-card'
                    : 'bg-white border-gray-200 hover:shadow-card'
                }`}
              >
                {card.urgent && card.count > 0 && !isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 motion-safe:animate-pulse" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.iconColor}`}>
                  {statIcons[card.key]}
                </div>
                <p className={`text-2xl font-extrabold mb-0.5 ${card.countColor}`}>
                  {card.count}
                </p>
                <p className="text-xs font-medium text-gray-500 leading-tight">
                  {card.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 bg-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Recent activity */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-ink mb-3">
            {searchQuery ? `Results for "${searchQuery}"` : 'Recent Activity'}
          </h2>

          {filteredNdas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
              <div className="w-12 h-12 bg-teal-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-ink mb-2">Send your first NDA in minutes</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Pick a template, fill in the details, and send a secure link — no back-and-forth, no blank page.</p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-[10px]">1</span>
                  Choose template
                </span>
                <span className="text-gray-300">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-[10px]">2</span>
                  Fill details
                </span>
                <span className="text-gray-300">→</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-[10px]">3</span>
                  Send secure link
                </span>
              </div>
              <Link href="/templates" className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors duration-200 text-sm">
                <Plus className="w-4 h-4" />
                Send Your First NDA
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNdas.map((nda) => {
                const statusInfo = getWorkflowStatusInfo(nda);
                return (
                  <div
                    key={nda.id}
                    id={`nda-${nda.id}`}
                    className={`group rounded-2xl border bg-white px-4 sm:px-5 py-4 transition-all duration-200 ${
                      highlightedId === nda.id
                        ? 'border-transparent ring-2 ring-teal-600 bg-teal-50'
                        : 'border-gray-100 hover:shadow-card'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      {/* Document + counterparty */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-teal-50 items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-teal-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-ink truncate">{nda.partyName}</span>
                            {nda.type === 'received' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500 uppercase shrink-0">Received</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            <span className="text-xs text-gray-400 mr-1">{getRecipientLabel(nda)}:</span>
                            {getRecipient(nda)}
                          </p>
                        </div>
                      </div>

                      {/* Status, date, actions */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-4 gap-y-2">
                        <StatusPill tone={statusInfo.tone} label={statusInfo.label} />
                        <span className="hidden md:inline text-xs text-gray-400 whitespace-nowrap">
                          {new Date(nda.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex gap-2">
                          {renderActions(nda)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Profile setup prompt — bottom-right, shown when profile is incomplete */}
      {!hasCompanyProfile && <ProfilePrompt />}

      {/* Pro upgrade toast — bottom-right */}
      <AnimatePresence>
        {showProBanner && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-2xl shadow-float p-4 flex items-start gap-3 max-w-xs"
          >
            <div className="w-9 h-9 bg-teal-800 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">You&apos;re on Pro</p>
              <p className="text-sm text-gray-500">Welcome to FormalizeIt Pro!</p>
            </div>
            <button
              onClick={() => setShowProBanner(false)}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0 cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
