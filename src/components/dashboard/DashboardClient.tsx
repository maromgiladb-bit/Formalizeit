'use client';

import { useState } from 'react';
import { Eye, Plus, FileText, Edit, Trash2, FileDown } from 'lucide-react';
import Link from 'next/link';

interface NDA {
  id: string;
  partyName: string;
  status: string;
  workflowState?: string; // Workflow-specific state
  recipientEmail?: string; // Party B email
  partyBName?: string; // Party B company/person name
  partyBEmail?: string; // Party B email from form
  createdAt: Date;
  signedAt: Date | null;
  type: 'created' | 'received';
  pdfId?: string | null;
  partyASignerId?: string | null; // For sign link when waiting for Party A
  signerId?: string | null; // For review link on incoming NDAs
  senderName?: string; // Who sent the NDA (for incoming)
  senderEmail?: string; // Sender email (for incoming)
}

interface DashboardClientProps {
  ndas: NDA[];
}

// Helper function to get workflow status display
function getWorkflowStatusInfo(nda: NDA): { label: string; color: string; bgColor: string } {
  const workflowState = nda.workflowState;

  switch (workflowState) {
    case 'AWAITING_INPUT':
      return { label: 'AWAITING INPUT', color: 'text-orange-800', bgColor: 'bg-orange-100' };
    case 'REVIEWING_CHANGES':
      return { label: 'REVIEW CHANGES', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
    case 'READY_TO_SIGN':
      return { label: 'READY TO SIGN', color: 'text-blue-800', bgColor: 'bg-blue-100' };
    case 'AWAITING_SIGNATURE':
      return { label: 'AWAITING SIGNATURE', color: 'text-purple-800', bgColor: 'bg-purple-100' };
    case 'SIGNING_COMPLETE':
    case 'COMPLETE':
      return { label: 'COMPLETE', color: 'text-green-800', bgColor: 'bg-green-100' };

    // New states
    case 'AWAITING_PARTY_A_REVIEW':
      return { label: 'CHANGES TO REVIEW', color: 'text-red-800', bgColor: 'bg-red-100' };
    case 'AWAITING_PARTY_B_REVIEW':
      return { label: 'WAITING REVIEW', color: 'text-orange-800', bgColor: 'bg-orange-100' };
    case 'AWAITING_PARTY_A_SIGNATURE':
      return { label: 'SIGN NOW', color: 'text-red-800', bgColor: 'bg-red-100' };
    case 'AWAITING_PARTY_B_SIGNATURE':
      return { label: 'WAITING SIG.', color: 'text-purple-800', bgColor: 'bg-purple-100' };

    case 'PENDING_INTERNAL_APPROVAL':
      return { label: 'AWAITING APPROVAL', color: 'text-amber-800', bgColor: 'bg-amber-100' };

    case 'FILLING':
    default:
      // Fall back to status-based display
      if (nda.status === 'signed') {
        return { label: 'SIGNED', color: 'text-green-800', bgColor: 'bg-green-100' };
      } else if (nda.status === 'sent' || nda.status === 'pending') {
        return { label: 'SENT', color: 'text-purple-800', bgColor: 'bg-purple-100' };
      } else {
        return { label: 'DRAFT', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
      }
  }
}

export default function DashboardClient({ ndas }: DashboardClientProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'received' | 'signed' | 'action'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localNdas, setLocalNdas] = useState(ndas);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/ndas/drafts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete draft');
      }

      // Remove from local state
      setLocalNdas(prev => prev.filter(nda => nda.id !== id));
      setMessage({ type: 'success', text: 'Draft deleted successfully' });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete draft'
      });
    } finally {
      setDeletingId(null);
    }
  };


  const filteredNdas = localNdas.filter((nda) => {
    if (filter === 'all') return true;
    // Action Required: highest priority - NDA needs your action
    const isActionRequired = ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '');
    // Signed/Complete: takes priority over sent
    const isSigned = nda.status === 'signed' || nda.workflowState === 'COMPLETE';

    if (filter === 'action') return isActionRequired;
    if (filter === 'signed') return isSigned && !isActionRequired;
    if (filter === 'draft') return nda.status === 'draft' && nda.type === 'created' && !isActionRequired && !isSigned;
    if (filter === 'sent') return nda.type === 'created' && (nda.status === 'sent' || nda.status === 'pending') && !isActionRequired && !isSigned;
    if (filter === 'received') return nda.type === 'received' && !isSigned && !isActionRequired;
    return true;
  });

  // Compute mutually exclusive stats
  const actionRequired = (n: NDA) => ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(n.workflowState || '');
  const isSigned = (n: NDA) => n.status === 'signed' || n.workflowState === 'COMPLETE';

  const stats = {
    total: localNdas.length,
    draft: localNdas.filter((n) => n.status === 'draft' && n.type === 'created' && !actionRequired(n) && !isSigned(n)).length,
    sent: localNdas.filter((n) => n.type === 'created' && (n.status === 'sent' || n.status === 'pending') && !actionRequired(n) && !isSigned(n)).length,
    received: localNdas.filter((n) => n.type === 'received' && !isSigned(n) && !actionRequired(n)).length,
    signed: localNdas.filter((n) => isSigned(n) && !actionRequired(n)).length,
    action: localNdas.filter((n) => actionRequired(n)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-800)] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[var(--teal-600)] rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-2">My NDAs</h1>
                <p className="text-xl text-gray-200">Manage and track your non-disclosure agreements</p>
              </div>
            </div>
            <Link href="/templates">
              <button className="px-6 py-3 bg-[var(--teal-600)] text-white rounded-xl font-bold shadow-lg hover:bg-[var(--teal-700)] hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New NDA
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${message.type === 'success'
            ? 'bg-green-50 border-green-500 text-green-800'
            : 'bg-red-50 border-red-500 text-red-800'
            } flex items-center gap-3 animate-fade-in`}>
            {message.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        )}

        {/* Stats Cards - Now clickable filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${filter === 'all'
              ? 'bg-[var(--teal-50)] border-[var(--teal-600)]'
              : 'bg-white border-gray-200 hover:border-[var(--teal-100)]'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total NDAs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filter === 'all' ? 'bg-[var(--teal-600)]' : 'bg-[var(--teal-100)]'
                }`}>
                <FileText className={`w-6 h-6 ${filter === 'all' ? 'text-white' : 'text-[var(--teal-600)]'}`} />
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('draft')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${filter === 'draft'
              ? 'bg-yellow-50 border-yellow-500'
              : 'bg-white border-gray-200 hover:border-yellow-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Drafts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.draft}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filter === 'draft' ? 'bg-yellow-600' : 'bg-yellow-100'
                }`}>
                <svg className={`w-6 h-6 ${filter === 'draft' ? 'text-white' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('sent')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${filter === 'sent'
              ? 'bg-purple-50 border-purple-500'
              : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.sent}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filter === 'sent' ? 'bg-purple-600' : 'bg-purple-100'
                }`}>
                <svg className={`w-6 h-6 ${filter === 'sent' ? 'text-white' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('received')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${filter === 'received'
              ? 'bg-orange-50 border-orange-500'
              : 'bg-white border-gray-200 hover:border-orange-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Incoming NDAs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.received}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filter === 'received' ? 'bg-orange-600' : 'bg-orange-100'
                }`}>
                <svg className={`w-6 h-6 ${filter === 'received' ? 'text-white' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('action')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${filter === 'action'
              ? 'bg-red-50 border-red-500'
              : 'bg-white border-gray-200 hover:border-red-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Action Required</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.action}
                  {stats.action > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">!</span>
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filter === 'action' ? 'bg-red-600' : 'bg-red-100'
                }`}>
                <svg className={`w-6 h-6 ${filter === 'action' ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('signed')}
            className={`p-6 rounded-xl shadow-sm border-2 transition-all text-left hover:shadow-md hover:scale-105 ${filter === 'signed'
              ? 'bg-green-50 border-green-500'
              : 'bg-white border-gray-200 hover:border-green-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Signed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.signed}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${filter === 'signed' ? 'bg-green-600' : 'bg-green-100'
                }`}>
                <svg className={`w-6 h-6 ${filter === 'signed' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* NDA List */}
        <div className="space-y-4">
          {filteredNdas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No NDAs found</h3>
              <p className="text-gray-600 mb-6">Add a new NDA to get started.</p>
              <Link href="/templates">
                <button className="px-6 py-3 bg-[var(--teal-600)] text-white rounded-xl font-bold shadow-lg hover:bg-[var(--teal-700)] hover:shadow-xl hover:scale-105 transition-all duration-300">
                  + New NDA
                </button>
              </Link>
            </div>
          ) : (
            filteredNdas.map((nda) => (
              <div
                key={nda.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-102"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">
                        {nda.partyName}
                      </h3>
                      {nda.type === 'received' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          RECEIVED
                        </span>
                      )}
                      {(() => {
                        const statusInfo = getWorkflowStatusInfo(nda);
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                    {/* From: Sender info - for incoming NDAs */}
                    {nda.type === 'received' && (nda.senderName || nda.senderEmail) && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-1">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                          <span className="text-gray-500">From:</span>{' '}
                          {nda.senderName && <span className="font-semibold">{nda.senderName}</span>}
                          {nda.senderName && nda.senderEmail && <span className="text-gray-400 mx-1">•</span>}
                          {nda.senderEmail && <span className="text-gray-600">{nda.senderEmail}</span>}
                        </span>
                      </div>
                    )}
                    {/* To: Party B info - for outgoing NDAs */}
                    {nda.type === 'created' && (nda.partyBName || nda.partyBEmail) && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-1">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>
                          <span className="text-gray-500">To:</span>{' '}
                          {nda.partyBName && <span className="font-semibold">{nda.partyBName}</span>}
                          {nda.partyBName && nda.partyBEmail && <span className="text-gray-400 mx-1">•</span>}
                          {nda.partyBEmail && <span className="text-gray-600">{nda.partyBEmail}</span>}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created: {new Date(nda.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {nda.signedAt && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Signed: {new Date(nda.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* DRAFT: Edit + Delete */}
                    {nda.status === 'draft' && (
                      <>
                        <Link href={`/fillndahtml?draftId=${nda.id}`}>
                          <button className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-[var(--teal-600)] transition-all flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(nda.id, nda.partyName)}
                          disabled={deletingId === nda.id}
                          className="px-4 py-2 bg-white border-2 border-red-300 rounded-xl text-red-700 font-semibold hover:bg-red-50 hover:border-red-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === nda.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* AWAITING_PARTY_A_SIGNATURE: Sign Now */}
                    {nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE' && nda.partyASignerId && (
                      <Link href={`/sign-nda-public/${nda.partyASignerId}`}>
                        <button className="px-4 py-2 bg-orange-500 border-2 border-orange-500 rounded-xl text-white font-semibold hover:bg-orange-600 transition-all flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Sign Now
                        </button>
                      </Link>
                    )}

                    {/* AWAITING_PARTY_A_REVIEW: Review Changes */}
                    {nda.workflowState === 'AWAITING_PARTY_A_REVIEW' && nda.partyASignerId && (
                      <Link href={`/fillndahtml-public/${nda.partyASignerId}`}>
                        <button className="px-4 py-2 bg-yellow-500 border-2 border-yellow-500 rounded-xl text-white font-semibold hover:bg-yellow-600 transition-all flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Review Changes
                        </button>
                      </Link>
                    )}

                    {/* RECEIVED/INCOMING: Review + sender info */}
                    {nda.type === 'received' && nda.signerId && !['COMPLETE', 'SIGNING_COMPLETE'].includes(nda.workflowState || '') && (
                      <Link href={`/fillndahtml-public/${nda.signerId}`}>
                        <button className="px-4 py-2 bg-orange-500 border-2 border-orange-500 rounded-xl text-white font-semibold hover:bg-orange-600 transition-all flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      </Link>
                    )}

                    {/* VIEW BUTTON: Different behavior based on status */}
                    {(() => {
                      const isComplete = nda.workflowState === 'COMPLETE' || nda.workflowState === 'SIGNING_COMPLETE' || nda.status === 'signed';
                      const isDraft = nda.status === 'draft';
                      const hasActionButton = ['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '');
                      const isReceivedWithReview = nda.type === 'received' && nda.signerId && !isComplete;

                      // COMPLETE: View PDF from S3
                      if (isComplete) {
                        return (
                          <button
                            onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.id}`, '_blank')}
                            className="px-4 py-2 bg-green-600 border-2 border-green-600 rounded-xl text-white font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                          >
                            <FileDown className="h-4 w-4" />
                            View PDF
                          </button>
                        );
                      }

                      // NOT COMPLETE: View in public fillnda page (for created NDAs that aren't draft and don't have action buttons)
                      if (!isDraft && !hasActionButton && !isReceivedWithReview && nda.type === 'created' && nda.partyASignerId) {
                        return (
                          <Link href={`/fillndahtml-public/${nda.partyASignerId}`}>
                            <button className="px-4 py-2 bg-[var(--teal-600)] border-2 border-[var(--teal-600)] rounded-xl text-white font-semibold hover:bg-[var(--teal-700)] transition-all flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </Link>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}