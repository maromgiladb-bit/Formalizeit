'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Plus, FileText, Edit, Trash2, FileDown, CheckCircle, Search, RotateCw, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusPill } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { inputClassesCrisp } from '@/components/ui/input';
import { canSignNDA } from '@/lib/organizationRoles';
import { canArchiveNda } from '@/lib/ndaLifecycle';
import ProfilePrompt from './ProfilePrompt';
import InvitePrompt, { type PendingInvite } from './InvitePrompt';
import NdaUpdatePrompt from './NdaUpdatePrompt';
import { NotifySignerModal } from './NotifySignerModal';
import type { NdaChangelogEntry } from '@/lib/ndaChangelog';
import { NEW_NDA_HREF } from '@/lib/newNdaHref';
import { getWorkflowStatusInfo as getSharedWorkflowStatusInfo, type WorkflowStatusInfo } from '@/lib/workflowStatus';

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
  expired?: boolean;
  archivedAt?: Date | string | null;
}

interface DashboardClientProps {
  ndas: NDA[];
  checkoutSuccess?: boolean;
  hasCompanyProfile?: boolean;
  pendingInvites?: PendingInvite[];
  ndaUpdate?: { version: string; entries: NdaChangelogEntry[] };
}

function getWorkflowStatusInfo(nda: NDA): WorkflowStatusInfo {
  // If we received it we are Party B; if we created it we are Party A.
  return getSharedWorkflowStatusInfo({
    workflowState: nda.workflowState,
    status: nda.status,
    viewer: nda.type === 'received' ? 'receiver' : 'sender',
    expired: nda.expired,
  });
}

export default function DashboardClient({ ndas, checkoutSuccess, hasCompanyProfile, pendingInvites, ndaUpdate }: DashboardClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'received' | 'signed' | 'action' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  // Draft whose "Ask a teammate to sign" picker is open (null = closed).
  const [notifyModalDraftId, setNotifyModalDraftId] = useState<string | null>(null);
  // Whether the current user can apply the company signature. null = still loading.
  const [canSign, setCanSign] = useState<boolean | null>(null);
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

  // Resolve whether this user can sign on behalf of the company, to decide between
  // "Sign Now" and "Ask a teammate to sign".
  useEffect(() => {
    let active = true;
    fetch('/api/user/role')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!active) return;
        setCanSign(data?.role ? canSignNDA({ role: data.role, isSigner: data.isSigner ?? false }) : false);
      })
      .catch(() => active && setCanSign(false));
    return () => { active = false; };
  }, []);

  // Notify the signers chosen in the picker. Throws on failure so the modal can show an
  // inline error; sets the success banner on the dashboard when it succeeds.
  const notifySigners = async (id: string, selectedIds: string[]) => {
    setMessage(null);

    const res = await fetch('/api/ndas/notify-signer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId: id, recipientUserIds: selectedIds }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to notify a signer');
    }

    setMessage({ type: 'success', text: `We notified ${data.notifiedCount} teammate${data.notifiedCount === 1 ? '' : 's'} who can sign` });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDelete = async (id: string, name: string, hardDelete: boolean) => {
    const confirmMsg = hardDelete
      ? `Permanently delete "${name}"?\n\nThis removes the NDA and its audit trail from the database. This cannot be undone.`
      : `Are you sure you want to delete "${name}"? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

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
      // Drop the row from the server component cache too, so a refresh/return
      // never resurrects the deleted draft (fixes the "Draft not found" reopen).
      router.refresh();
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

  const handleArchive = async (id: string, archived: boolean) => {
    setArchivingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/ndas/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update archive');
      }

      setLocalNdas(prev => prev.map(nda => (nda.id === id ? { ...nda, archivedAt: archived ? new Date().toISOString() : null } : nda)));
      setMessage({ type: 'success', text: archived ? 'NDA archived' : 'NDA moved back to your list' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Archive error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update archive',
      });
    } finally {
      setArchivingId(null);
    }
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    setMessage(null);

    try {
      const res = await fetch('/api/ndas/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend NDA');
      }

      setLocalNdas(prev => prev.map(nda => (nda.id === id ? { ...nda, expired: false } : nda)));
      setMessage({ type: 'success', text: `A fresh signing link was sent to ${data.recipientEmail}` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error('Resend error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to resend NDA',
      });
    } finally {
      setResendingId(null);
    }
  };

  const filteredNdas = localNdas
    .filter((nda) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const recipient = nda.type === 'received'
          ? (nda.senderName || nda.senderEmail || '')
          : (nda.partyBName || nda.partyBEmail || nda.recipientEmail || '');
        if (!nda.partyName.toLowerCase().includes(q) && !recipient.toLowerCase().includes(q)) return false;
      }
      const isArchived = nda.archivedAt != null;
      if (filter === 'archived') return isArchived;
      if (isArchived) return false; // archived rows are hidden from every other view
      if (filter === 'all') return true;
      const isActionRequired = ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '') ||
        (nda.type === 'received' && ['AWAITING_PARTY_B_SIGNATURE', 'AWAITING_PARTY_B_REVIEW'].includes(nda.workflowState || ''));
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
    (n.type === 'received' && ['AWAITING_PARTY_B_SIGNATURE', 'AWAITING_PARTY_B_REVIEW'].includes(n.workflowState || ''));
  const isSigned = (n: NDA) => n.status === 'signed' || n.workflowState === 'COMPLETE';

  const active = localNdas.filter((n) => n.archivedAt == null);
  const stats = {
    total: active.length,
    draft: active.filter((n) => n.status === 'draft' && n.type === 'created' && !actionRequired(n) && !isSigned(n)).length,
    sent: active.filter((n) => n.type === 'created' && (n.status === 'sent' || n.status === 'pending') && !actionRequired(n) && !isSigned(n)).length,
    received: active.filter((n) => n.type === 'received').length,
    signed: active.filter((n) => isSigned(n) && !actionRequired(n)).length,
    action: active.filter((n) => actionRequired(n)).length,
    archived: localNdas.filter((n) => n.archivedAt != null).length,
  };

  const filterTabs: { key: typeof filter; label: string; count: number; urgent?: boolean }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'action', label: 'Needs you', count: stats.action, urgent: true },
    { key: 'sent', label: 'Waiting', count: stats.sent },
    { key: 'received', label: 'Received', count: stats.received },
    { key: 'signed', label: 'Signed', count: stats.signed },
    { key: 'draft', label: 'Drafts', count: stats.draft },
    { key: 'archived', label: 'Archived', count: stats.archived },
  ];
  // Row action styling (Ink & Seal crisp buttons)
  const secondaryBtn = 'shadow-none text-ink';
  const dangerBtn = 'shadow-none text-muted-ink hover:border-red-200 hover:bg-red-50 hover:text-red-600';

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
          <Button asChild variant="outline" size="sm" shape="crisp" className={secondaryBtn}>
            <Link href={`/fillndahtml?draftId=${nda.id}`}>
              <Edit className="w-3.5 h-3.5" aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            shape="crisp"
            onClick={() => handleDelete(nda.id, nda.partyName, false)}
            disabled={deletingId === nda.id}
            className={dangerBtn}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            {deletingId === nda.id ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      )}

      {/* AWAITING_PARTY_A_SIGNATURE: Sign Now (signers only) or ask a teammate (everyone else).
          "Sign Now" renders only once we've confirmed the user can sign — while the role is
          still loading (canSign === null) we show the non-signer path, so a contributor never
          sees a clickable Sign Now during the fetch. */}
      {nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE' && nda.partyASignerId && (
        canSign === true ? (
          <Button asChild size="sm" shape="crisp">
            <Link href={`/sign-nda-public/${nda.partyASignerId}`}>
              <Edit className="w-3.5 h-3.5" aria-hidden="true" />
              Sign Now
            </Link>
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              shape="crisp"
              onClick={() => setNotifyModalDraftId(nda.id)}
              disabled={canSign === null}
            >
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Ask a teammate to sign
            </Button>
            <span className="text-xs text-muted-ink">Only Signers can sign this NDA.</span>
          </div>
        )
      )}

      {/* AWAITING_PARTY_A_REVIEW: Review Changes */}
      {nda.workflowState === 'AWAITING_PARTY_A_REVIEW' && nda.partyASignerId && (
        <Button asChild size="sm" shape="crisp">
          <Link href={`/fillndahtml-public/${nda.partyASignerId}`}>
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Review
          </Link>
        </Button>
      )}

      {/* RECEIVED/INCOMING: Sign Now or Review */}
      {nda.type === 'received' && nda.signerId && !['COMPLETE', 'SIGNING_COMPLETE'].includes(nda.workflowState || '') && (
        nda.workflowState === 'AWAITING_PARTY_B_SIGNATURE' ? (
          <Button asChild size="sm" shape="crisp">
            <Link href={`/sign-nda-public/${nda.signerId}`}>
              <Edit className="w-3.5 h-3.5" aria-hidden="true" />
              Sign Now
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" shape="crisp" className={secondaryBtn}>
            <Link href={`/fillndahtml-public/${nda.signerId}`}>
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Review
            </Link>
          </Button>
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
            <Button
              variant="outline"
              size="sm"
              shape="crisp"
              onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.id}`, '_blank')}
              className={secondaryBtn}
            >
              <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
              View PDF
            </Button>
          );
        }

        if (!isDraft && !hasActionButton && !isReceivedWithReview && nda.type === 'created') {
          return (
            <Button asChild variant="outline" size="sm" shape="crisp" className={secondaryBtn}>
              <Link href={`/view-nda/${nda.id}`}>
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                View
              </Link>
            </Button>
          );
        }

        return null;
      })()}

      {/* Expired link: Resend a fresh 14-day signing link */}
      {nda.type === 'created' && nda.expired && (
        <Button
          size="sm"
          shape="crisp"
          onClick={() => handleResend(nda.id)}
          disabled={resendingId === nda.id}
        >
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          {resendingId === nda.id ? 'Resending…' : 'Resend NDA'}
        </Button>
      )}

      {/* Expired or legacy-cancelled created NDA: hard delete (dashboard + DB) */}
      {nda.type === 'created' && (nda.expired || nda.status === 'cancelled') && (
        <Button
          variant="outline"
          size="sm"
          shape="crisp"
          onClick={() => handleDelete(nda.id, nda.partyName, true)}
          disabled={deletingId === nda.id}
          className={dangerBtn}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          {deletingId === nda.id ? 'Deleting…' : 'Delete'}
        </Button>
      )}

      {/* Finalized created NDA: archive / unarchive */}
      {nda.type === 'created' && canArchiveNda({ status: nda.status, workflowState: nda.workflowState }) && (
        nda.archivedAt ? (
          <Button
            variant="outline"
            size="sm"
            shape="crisp"
            onClick={() => handleArchive(nda.id, false)}
            disabled={archivingId === nda.id}
            className={`${secondaryBtn} text-muted-ink`}
          >
            <ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" />
            {archivingId === nda.id ? 'Restoring…' : 'Unarchive'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            shape="crisp"
            onClick={() => handleArchive(nda.id, true)}
            disabled={archivingId === nda.id}
            className={`${secondaryBtn} text-muted-ink`}
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            {archivingId === nda.id ? 'Archiving…' : 'Archive'}
          </Button>
        )
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-ground font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Header */}
        <div className="pt-8">
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight">My NDAs</h1>
          <p className="text-sm text-muted-ink mt-1">Manage and track your Non-Disclosure Agreements</p>
        </div>

        {/* Message banner */}
        {message && (
          <div role="status" className={`mt-4 px-4 py-3 rounded-sheet border flex items-center gap-2.5 text-sm font-medium bg-white ${
            message.type === 'success'
              ? 'border-line text-ink'
              : 'border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* Filter tabs + search + sort */}
        <div className="mt-6 flex flex-col gap-4">
          <div role="group" aria-label="Filter NDAs" className="flex flex-wrap gap-x-0 min-w-0 border-b border-line">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.key;
              const needs = tab.urgent && tab.count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${tab.label}, ${tab.count}${needs ? ', needs your attention' : ''}`}
                  onClick={() => setFilter(tab.key)}
                  title={tab.key === 'action' ? 'NDAs that need you to review or sign' : undefined}
                  className={`-mb-px inline-flex items-center gap-2 h-10 px-2.5 border-b-2 text-sm cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 rounded-t-control ${
                    isActive
                      ? 'border-teal-800 text-ink font-semibold'
                      : 'border-transparent text-muted-ink font-medium hover:text-ink'
                  }`}
                >
                  {tab.label}
                  <span className={`font-doc-mono text-xs leading-none px-1.5 py-1 rounded ${
                    needs ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200' : 'bg-gray-100 text-muted-ink'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex w-full gap-2 sm:max-w-lg">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by title or counterparty..."
                aria-label="Search NDAs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClassesCrisp} pl-9`}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort NDAs"
              className={`${inputClassesCrisp} w-auto! shrink-0`}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="mt-4">
          {searchQuery ? (
            <h2 className="text-sm font-semibold text-muted-ink mb-2">Results for &quot;{searchQuery}&quot;</h2>
          ) : (
            <h2 className="sr-only">Recent activity</h2>
          )}

          {filteredNdas.length === 0 ? (
            <div className="bg-white rounded-sheet border border-line p-10 sm:p-12 text-center">
              <div className="w-11 h-11 bg-teal-800 rounded-control flex items-center justify-center mx-auto mb-4">
                <FileText className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink tracking-tight mb-2">Send your first NDA in minutes</h3>
              <p className="text-sm text-muted-ink mb-5 max-w-xs mx-auto">Pick a template, fill in the details, and send a secure link — no back-and-forth, no blank page.</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-ink mb-6">
                {['Choose template', 'Fill details', 'Send secure link'].map((step, i) => (
                  <span key={step} className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded border border-line bg-ground flex items-center justify-center text-ink font-doc-mono text-xs">{i + 1}</span>
                    {step}
                  </span>
                ))}
              </div>
              <Button asChild shape="crisp">
                <Link href={NEW_NDA_HREF}>
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Send Your First NDA
                </Link>
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-sheet border border-line overflow-hidden">
              <div
                aria-hidden="true"
                className="hidden md:grid grid-cols-[minmax(0,1fr)_168px_88px_auto] gap-4 items-center px-5 h-9 bg-ground border-b border-line text-xs font-semibold text-muted-ink"
              >
                <span>Name</span>
                <span>Status</span>
                <span>Updated</span>
                <span className="w-[1px]" />
              </div>
              <div role="list">
              {filteredNdas.map((nda) => {
                const statusInfo = getWorkflowStatusInfo(nda);
                const needsYou = actionRequired(nda);
                return (
                  <div
                    key={nda.id}
                    id={`nda-${nda.id}`}
                    role="listitem"
                    className={`group border-b border-line last:border-b-0 px-4 sm:px-5 py-4 transition-colors duration-150 ${
                      highlightedId === nda.id
                        ? 'bg-teal-50 ring-2 ring-inset ring-teal-700'
                        : needsYou
                          ? 'bg-amber-50 hover:bg-amber-100/60'
                          : 'hover:bg-gray-50/70'
                    }`}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_168px_88px_auto] gap-x-4 gap-y-3 items-center">
                      {/* Document + counterparty */}
                      <div className="min-w-0 order-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-display text-[15px] font-semibold text-ink tracking-tight truncate">{nda.partyName}</span>
                          {nda.type === 'received' && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-muted-ink shrink-0">Received</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-ink truncate mt-0.5">
                          <span className="text-xs mr-1">{getRecipientLabel(nda)}:</span>
                          {getRecipient(nda)}
                        </p>
                      </div>

                      <div className="order-2 justify-self-end md:justify-self-start">
                        <StatusPill tone={statusInfo.tone} label={statusInfo.label} shape="crisp" />
                      </div>

                      <span className="order-3 font-doc-mono text-xs text-muted-ink whitespace-nowrap">
                        {new Date(nda.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>

                      <div className="order-4 col-span-2 md:col-span-1 flex flex-wrap items-center justify-start md:justify-end gap-2 empty:hidden">
                        {renderActions(nda)}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending team invite popup — takes precedence over other prompts */}
      {pendingInvites && pendingInvites.length > 0 ? (
        <InvitePrompt pendingInvites={pendingInvites} />
      ) : (
        /* Standard NDA update review popup — only when there's no invite to handle */
        ndaUpdate && <NdaUpdatePrompt version={ndaUpdate.version} entries={ndaUpdate.entries} />
      )}

      {/* Signer picker — choose which authorized signer(s) to notify */}
      <NotifySignerModal
        isOpen={notifyModalDraftId !== null}
        onClose={() => setNotifyModalDraftId(null)}
        onConfirm={(selectedIds) => notifySigners(notifyModalDraftId as string, selectedIds)}
      />

      {/* Profile setup prompt — bottom-right, shown when profile is incomplete */}
      {!hasCompanyProfile && <ProfilePrompt />}

      {/* Pro upgrade toast — bottom-right */}
      <AnimatePresence>
        {showProBanner && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-line rounded-sheet shadow-sheet p-4 flex items-start gap-3 max-w-xs"
          >
            <div className="w-9 h-9 bg-teal-800 rounded-control flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-ink">You&apos;re on Pro</p>
              <p className="text-sm text-muted-ink">Welcome to FormalizeIt Pro!</p>
            </div>
            <button
              onClick={() => setShowProBanner(false)}
              aria-label="Dismiss"
              className="text-gray-500 hover:text-gray-600 text-lg leading-none shrink-0 cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
