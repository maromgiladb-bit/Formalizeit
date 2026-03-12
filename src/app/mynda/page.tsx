'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

interface NDA {
    id: string
    title: string
    status: string
    workflowState?: string
    recipientEmail?: string
    createdAt: string
    updatedAt: string
    partyAName?: string
    partyBName?: string
    partyBEmail?: string
    pdfId?: string | null
    partyASignerId?: string | null
}

interface IncomingNDA {
    id: string
    draftId: string
    title: string
    status: string
    workflowState?: string
    createdAt: string
    updatedAt: string
    fromName?: string
    fromEmail?: string
    partyBName?: string
    partyBEmail?: string
    signerId: string
}

type StatusFilter = 'all' | 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED'
type SortBy = 'newest' | 'oldest' | 'name' | 'status'

export default function MyNDAsPage() {
    const { userId, isLoaded } = useAuth()
    const [ndas, setNdas] = useState<NDA[]>([])
    const [incomingNdas, setIncomingNdas] = useState<IncomingNDA[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing')

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [sortBy, setSortBy] = useState<SortBy>('newest')
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'action_required' | 'sent' | 'draft' | 'signed'>('all')

    useEffect(() => {
        if (isLoaded && userId) {
            fetchNDAs()
            fetchIncomingNDAs()
        } else if (isLoaded && !userId) {
            setLoading(false)
            setError('Please sign in to view your NDAs')
        }
    }, [userId, isLoaded])

    const fetchNDAs = async () => {
        try {
            setError(null)
            const response = await fetch('/api/ndas/drafts')
            if (!response.ok) {
                throw new Error('Failed to fetch NDAs')
            }
            const data = await response.json()
            if (data.drafts) {
                setNdas(data.drafts.map((d: Record<string, unknown>) => {
                    // Find Party A signer (APPROVER role) for sign link
                    const signers = (d.signers as Array<{ id: string, role: string }>) || []
                    const partyASigner = signers.find(s => s.role === 'APPROVER')

                    return {
                        id: d.id,
                        title: d.title || 'Untitled NDA',
                        status: d.status,
                        workflowState: d.workflowState,
                        recipientEmail: d.recipientEmail,
                        createdAt: d.created_at || d.createdAt,
                        updatedAt: d.updated_at || d.updatedAt,
                        partyAName: (d.data as Record<string, unknown>)?.party_a_name || (d.content as Record<string, unknown>)?.party_a_name,
                        partyBName: (d.data as Record<string, unknown>)?.party_b_name || (d.content as Record<string, unknown>)?.party_b_name,
                        partyBEmail: (d.data as Record<string, unknown>)?.party_b_email || (d.content as Record<string, unknown>)?.party_b_email || d.recipientEmail,
                        pdfId: d.pdfId,
                        partyASignerId: partyASigner?.id || null,
                    }
                }))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const fetchIncomingNDAs = async () => {
        try {
            const response = await fetch('/api/ndas/incoming')
            if (response.ok) {
                const data = await response.json()
                if (data.incomingNdas) {
                    setIncomingNdas(data.incomingNdas)
                }
            }
        } catch (err) {
            console.error('Failed to fetch incoming NDAs:', err)
        }
    }

    const deleteDraft = async (id: string) => {
        if (!confirm('Are you sure you want to delete this NDA?')) return
        try {
            const response = await fetch(`/api/ndas/drafts/${id}`, { method: 'DELETE' })
            if (response.ok) {
                setNdas(ndas.filter(n => n.id !== id))
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    // Filter and sort NDAs
    const filteredNdas = ndas
        .filter(nda => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = nda.title?.toLowerCase().includes(query)
                const matchesPartyA = nda.partyAName?.toLowerCase().includes(query)
                const matchesPartyB = nda.partyBName?.toLowerCase().includes(query)
                const matchesEmail = nda.recipientEmail?.toLowerCase().includes(query)
                if (!matchesTitle && !matchesPartyA && !matchesPartyB && !matchesEmail) {
                    return false
                }
            }
            // Status filter
            if (statusFilter !== 'all' && nda.status !== statusFilter) {
                return false
            }
            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case 'name':
                    return (a.title || '').localeCompare(b.title || '')
                case 'status':
                    return (a.status || '').localeCompare(b.status || '')
                default:
                    return 0
            }
        })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: 'bg-amber-100 text-amber-800 border-amber-200',
            SENT: 'bg-blue-100 text-blue-800 border-blue-200',
            SIGNED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
        }
        return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getWorkflowLabel = (nda: NDA) => {
        // "Waiting for you" states - Party B has responded and now it's Party A's turn
        if (nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE') return { label: 'Sign now', style: 'bg-orange-100 text-orange-800 border-orange-200' }
        if (nda.workflowState === 'AWAITING_PARTY_A_REVIEW') return { label: 'Changes to review', style: 'bg-orange-100 text-orange-800 border-orange-200' }

        // "Waiting for other party" states
        if (nda.workflowState === 'AWAITING_PARTY_B_SIGNATURE') return { label: 'Waiting for Party B', style: 'bg-blue-100 text-blue-800 border-blue-200' }
        if (nda.workflowState === 'AWAITING_PARTY_B_REVIEW') return { label: 'Waiting for Party B', style: 'bg-blue-100 text-blue-800 border-blue-200' }
        if (nda.workflowState === 'AWAITING_INPUT') return { label: 'Awaiting Party B', style: 'bg-purple-100 text-purple-800 border-purple-200' }

        // Completed state
        if (nda.workflowState === 'COMPLETE') return { label: 'Completed', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' }

        // Legacy states
        if (nda.workflowState === 'REVIEWING_CHANGES') return { label: 'Review Changes', style: 'bg-purple-100 text-purple-800 border-purple-200' }
        if (nda.workflowState === 'READY_TO_SIGN') return { label: 'Ready to Sign', style: 'bg-teal-100 text-teal-800 border-teal-200' }
        if (nda.workflowState === 'AWAITING_SIGNATURE') return { label: 'Pending Signature', style: 'bg-blue-100 text-blue-800 border-blue-200' }
        if (nda.workflowState === 'SIGNING_COMPLETE') return { label: 'Completed', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' }

        return null
    }

    // Categorize each NDA into exactly one bucket (mutually exclusive)
    type NdaCategory = 'action_required' | 'sent' | 'draft' | 'signed'
    const getNdaCategory = (nda: NDA): NdaCategory => {
        // Action Required takes highest priority
        if (['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '')) {
            return 'action_required'
        }
        // Signed/Complete
        if (nda.status === 'SIGNED' || nda.workflowState === 'COMPLETE') {
            return 'signed'
        }
        // Sent (waiting on Party B)
        if (nda.status === 'SENT') {
            return 'sent'
        }
        // Everything else is a draft
        return 'draft'
    }

    // Group NDAs by category
    const categorizedNdas = {
        action_required: filteredNdas.filter(nda => getNdaCategory(nda) === 'action_required'),
        sent: filteredNdas.filter(nda => getNdaCategory(nda) === 'sent'),
        draft: filteredNdas.filter(nda => getNdaCategory(nda) === 'draft'),
        signed: filteredNdas.filter(nda => getNdaCategory(nda) === 'signed'),
    }

    // Category counts (unfiltered, for stats)
    const allCategorized = {
        action_required: ndas.filter(nda => getNdaCategory(nda) === 'action_required').length,
        sent: ndas.filter(nda => getNdaCategory(nda) === 'sent').length,
        draft: ndas.filter(nda => getNdaCategory(nda) === 'draft').length,
        signed: ndas.filter(nda => getNdaCategory(nda) === 'signed').length,
    }

    // Render a single NDA card (shared across category sections)
    const renderNdaCard = (nda: NDA) => (
        <div
            key={nda.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all overflow-hidden"
        >
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{nda.title}</h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(nda.status)}`}>
                                {nda.status}
                            </span>
                            {(() => {
                                const workflowInfo = getWorkflowLabel(nda)
                                return workflowInfo && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${workflowInfo.style}`}>
                                        {workflowInfo.label}
                                    </span>
                                )
                            })()}
                        </div>
                    </div>
                    <button
                        onClick={() => deleteDraft(nda.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-3 text-sm">
                {(nda.partyBName || nda.partyBEmail) && (
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">To</div>
                                {nda.partyBName && <div className="font-semibold text-gray-900 truncate">{nda.partyBName}</div>}
                                {nda.partyBEmail && <div className="text-gray-600 truncate">{nda.partyBEmail}</div>}
                            </div>
                        </div>
                    </div>
                )}
                {nda.partyAName && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate"><strong>From:</strong> {nda.partyAName}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created {new Date(nda.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                {/* DRAFT: Edit button */}
                {nda.status === 'DRAFT' && (
                    <Link
                        href={`/fillndahtml?draftId=${nda.id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </Link>
                )}

                {/* SENT: View PDF (only if not action-required) */}
                {nda.status === 'SENT' && !['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '') && (
                    <button
                        onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.id}`, '_blank')}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View PDF
                    </button>
                )}

                {/* AWAITING_PARTY_A_SIGNATURE: Sign Now */}
                {nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE' && nda.partyASignerId && (
                    <Link
                        href={`/sign-nda-public/${nda.partyASignerId}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Sign Now
                    </Link>
                )}

                {/* AWAITING_PARTY_A_REVIEW: Review Changes */}
                {nda.workflowState === 'AWAITING_PARTY_A_REVIEW' && nda.partyASignerId && (
                    <Link
                        href={`/fillndahtml-public/${nda.partyASignerId}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Review Changes
                    </Link>
                )}

                {/* COMPLETE/SIGNED: View PDF */}
                {(nda.status === 'SIGNED' || nda.workflowState === 'COMPLETE') && (
                    <button
                        onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.id}`, '_blank')}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View PDF
                    </button>
                )}

                {/* Preview - placeholder for future */}
                <button
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => { }}
                >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                </button>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My NDAs</h1>
                            <p className="text-gray-600 mt-1">Manage all your Non-Disclosure Agreements</p>
                        </div>
                        <Link
                            href="/fillndahtml?new=true"
                            className="inline-flex items-center px-5 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create New NDA
                        </Link>
                    </div>
                </div>

                {/* Tabs for Outgoing/Incoming */}
                <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'outgoing'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Sent ({ndas.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'incoming'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            Received ({incomingNdas.length})
                        </span>
                    </button>
                </div>

                {/* Outgoing NDAs Tab */}
                {activeTab === 'outgoing' && (
                    <>
                        {/* Search and Filters Bar */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by title, party name, or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                        className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="SENT">Sent</option>
                                        <option value="SIGNED">Signed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                        className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="name">Name A-Z</option>
                                        <option value="status">Status</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`text-left rounded-xl shadow-sm border p-4 transition-all focus:outline-none ${selectedCategory === 'all'
                                    ? 'border-gray-800 bg-gray-50 ring-2 ring-gray-800 ring-offset-2'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-2xl font-bold text-gray-800">{filteredNdas.length}</div>
                                <div className="text-sm text-gray-600 font-medium">All NDAs</div>
                            </button>

                            <button
                                onClick={() => setSelectedCategory('action_required')}
                                className={`text-left rounded-xl shadow-sm border p-4 transition-all focus:outline-none ${selectedCategory === 'action_required'
                                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500 ring-offset-2'
                                    : allCategorized.action_required > 0
                                        ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                                        : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50'
                                    }`}
                            >
                                <div className={`text-2xl font-bold ${allCategorized.action_required > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                    {allCategorized.action_required}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Action Required</div>
                            </button>

                            <button
                                onClick={() => setSelectedCategory('sent')}
                                className={`text-left rounded-xl shadow-sm border p-4 transition-all focus:outline-none ${selectedCategory === 'sent'
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2'
                                    : 'border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                            >
                                <div className="text-2xl font-bold text-blue-600">{allCategorized.sent}</div>
                                <div className="text-sm text-gray-600 font-medium">Sent</div>
                            </button>

                            <button
                                onClick={() => setSelectedCategory('draft')}
                                className={`text-left rounded-xl shadow-sm border p-4 transition-all focus:outline-none ${selectedCategory === 'draft'
                                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500 ring-offset-2'
                                    : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                                    }`}
                            >
                                <div className="text-2xl font-bold text-amber-600">{allCategorized.draft}</div>
                                <div className="text-sm text-gray-600 font-medium">Drafts</div>
                            </button>

                            <button
                                onClick={() => setSelectedCategory('signed')}
                                className={`text-left rounded-xl shadow-sm border p-4 transition-all focus:outline-none ${selectedCategory === 'signed'
                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-offset-2'
                                    : 'border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                            >
                                <div className="text-2xl font-bold text-emerald-600">{allCategorized.signed}</div>
                                <div className="text-sm text-gray-600 font-medium">Signed</div>
                            </button>
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* NDA Cards - Grouped by Category */}
                        {filteredNdas.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {searchQuery || statusFilter !== 'all' ? 'No matching NDAs found' : 'No NDAs yet'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your search or filters'
                                        : 'Create your first NDA to get started'
                                    }
                                </p>
                                {!searchQuery && statusFilter === 'all' && (
                                    <Link
                                        href="/fillndahtml?new=true"
                                        className="inline-flex items-center px-5 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all"
                                    >
                                        Create Your First NDA
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Action Required Section */}
                                {(selectedCategory === 'all' || selectedCategory === 'action_required') && categorizedNdas.action_required.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-orange-500 rounded-full">{categorizedNdas.action_required.length}</span>
                                            <h2 className="text-lg font-bold text-orange-800">Action Required</h2>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {categorizedNdas.action_required.map((nda) => renderNdaCard(nda))}
                                        </div>
                                    </div>
                                )}

                                {/* Sent Section */}
                                {(selectedCategory === 'all' || selectedCategory === 'sent') && categorizedNdas.sent.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <h2 className="text-lg font-bold text-blue-800">Sent</h2>
                                            <span className="text-sm text-gray-500">({categorizedNdas.sent.length})</span>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {categorizedNdas.sent.map((nda) => renderNdaCard(nda))}
                                        </div>
                                    </div>
                                )}

                                {/* Drafts Section */}
                                {(selectedCategory === 'all' || selectedCategory === 'draft') && categorizedNdas.draft.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <h2 className="text-lg font-bold text-amber-800">Drafts</h2>
                                            <span className="text-sm text-gray-500">({categorizedNdas.draft.length})</span>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {categorizedNdas.draft.map((nda) => renderNdaCard(nda))}
                                        </div>
                                    </div>
                                )}

                                {/* Signed Section */}
                                {(selectedCategory === 'all' || selectedCategory === 'signed') && categorizedNdas.signed.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <h2 className="text-lg font-bold text-emerald-800">Signed</h2>
                                            <span className="text-sm text-gray-500">({categorizedNdas.signed.length})</span>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {categorizedNdas.signed.map((nda) => renderNdaCard(nda))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Results Count */}
                        {filteredNdas.length > 0 && (
                            <div className="mt-6 text-center text-sm text-gray-500">
                                Showing {filteredNdas.length} of {ndas.length} NDAs
                            </div>
                        )}
                    </>
                )}

                {/* Incoming NDAs Tab */}
                {activeTab === 'incoming' && (
                    <>
                        {incomingNdas.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incoming NDAs</h3>
                                <p className="text-gray-600">You haven&apos;t received any NDAs yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {incomingNdas.map((nda) => (
                                    <div
                                        key={nda.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all overflow-hidden"
                                    >
                                        {/* Card Header */}
                                        <div className="p-5 border-b border-gray-100">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{nda.title}</h3>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${nda.status === 'SIGNED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                            nda.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                                'bg-blue-100 text-blue-800 border-blue-200'
                                                            }`}>
                                                            {nda.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 space-y-3 text-sm">
                                            {/* From: Party A section */}
                                            {(nda.fromName || nda.fromEmail) && (
                                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">From</div>
                                                            {nda.fromName && (
                                                                <div className="font-semibold text-gray-900 truncate">{nda.fromName}</div>
                                                            )}
                                                            {nda.fromEmail && (
                                                                <div className="text-gray-600 truncate">{nda.fromEmail}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>Received {new Date(nda.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                                            <Link
                                                href={`/fillndahtml-public/${nda.signerId}`}
                                                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
