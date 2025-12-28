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
    pdfId?: string | null
}

type StatusFilter = 'all' | 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED'
type SortBy = 'newest' | 'oldest' | 'name' | 'status'

export default function MyNDAsPage() {
    const { userId, isLoaded } = useAuth()
    const [ndas, setNdas] = useState<NDA[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [sortBy, setSortBy] = useState<SortBy>('newest')

    useEffect(() => {
        if (isLoaded && userId) {
            fetchNDAs()
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
                setNdas(data.drafts.map((d: Record<string, unknown>) => ({
                    id: d.id,
                    title: d.title || 'Untitled NDA',
                    status: d.status,
                    workflowState: d.workflowState,
                    recipientEmail: d.recipientEmail,
                    createdAt: d.created_at || d.createdAt,
                    updatedAt: d.updated_at || d.updatedAt,
                    partyAName: (d.data as Record<string, unknown>)?.party_a_name || (d.content as Record<string, unknown>)?.party_a_name,
                    partyBName: (d.data as Record<string, unknown>)?.party_b_name || (d.content as Record<string, unknown>)?.party_b_name,
                    pdfId: d.pdfId,
                })))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
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
        if (nda.workflowState === 'AWAITING_INPUT') return 'Awaiting Party B'
        if (nda.workflowState === 'REVIEWING_CHANGES') return 'Review Changes'
        if (nda.workflowState === 'READY_TO_SIGN') return 'Ready to Sign'
        if (nda.workflowState === 'AWAITING_SIGNATURE') return 'Pending Signature'
        if (nda.workflowState === 'SIGNING_COMPLETE') return 'Completed'
        return null
    }

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-gray-900">{ndas.length}</div>
                        <div className="text-sm text-gray-600">Total NDAs</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
                        <div className="text-2xl font-bold text-amber-600">{ndas.filter(n => n.status === 'DRAFT').length}</div>
                        <div className="text-sm text-gray-600">Drafts</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
                        <div className="text-2xl font-bold text-blue-600">{ndas.filter(n => n.status === 'SENT').length}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4">
                        <div className="text-2xl font-bold text-emerald-600">{ndas.filter(n => n.status === 'SIGNED').length}</div>
                        <div className="text-sm text-gray-600">Signed</div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* NDA Cards Grid */}
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredNdas.map((nda) => (
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
                                                {getWorkflowLabel(nda) && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                        {getWorkflowLabel(nda)}
                                                    </span>
                                                )}
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
                                    {nda.partyAName && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="truncate"><strong>Party A:</strong> {nda.partyAName}</span>
                                        </div>
                                    )}
                                    {nda.partyBName && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span className="truncate"><strong>Party B:</strong> {nda.partyBName}</span>
                                        </div>
                                    )}
                                    {nda.recipientEmail && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{nda.recipientEmail}</span>
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
                                    <Link
                                        href={`/fillndahtml?draftId=${nda.id}`}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </Link>
                                    <Link
                                        href={`/viewpdf/${nda.id}`}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {filteredNdas.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Showing {filteredNdas.length} of {ndas.length} NDAs
                    </div>
                )}
            </div>
        </div>
    )
}
