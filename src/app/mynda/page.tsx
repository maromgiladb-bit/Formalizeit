'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { FileText, Plus, Search } from 'lucide-react'

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

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [sortBy, setSortBy] = useState<SortBy>('newest')
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'action_required' | 'sent' | 'draft' | 'signed'>('all')

    const [incomingSearch, setIncomingSearch] = useState('')
    const [incomingStatusFilter, setIncomingStatusFilter] = useState<'all' | 'PENDING' | 'SIGNED' | 'SENT' | 'VIEWED'>('all')

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
            if (!response.ok) throw new Error('Failed to fetch NDAs')
            const data = await response.json()
            if (data.drafts) {
                setNdas(data.drafts.map((d: Record<string, unknown>) => {
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
                if (data.incomingNdas) setIncomingNdas(data.incomingNdas)
            }
        } catch (err) {
            console.error('Failed to fetch incoming NDAs:', err)
        }
    }

    const filteredIncomingNdas = incomingNdas.filter(nda => {
        if (incomingSearch) {
            const q = incomingSearch.toLowerCase()
            if (!nda.title?.toLowerCase().includes(q) && !nda.fromName?.toLowerCase().includes(q) && !nda.fromEmail?.toLowerCase().includes(q)) return false
        }
        if (incomingStatusFilter !== 'all' && nda.status !== incomingStatusFilter) return false
        return true
    })

    const deleteDraft = async (id: string) => {
        if (!confirm('Are you sure you want to delete this NDA?')) return
        try {
            const response = await fetch(`/api/ndas/drafts/${id}`, { method: 'DELETE' })
            if (response.ok) setNdas(ndas.filter(n => n.id !== id))
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const filteredNdas = ndas
        .filter(nda => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (!nda.title?.toLowerCase().includes(query) &&
                    !nda.partyAName?.toLowerCase().includes(query) &&
                    !nda.partyBName?.toLowerCase().includes(query) &&
                    !nda.recipientEmail?.toLowerCase().includes(query)) return false
            }
            if (statusFilter !== 'all' && nda.status !== statusFilter) return false
            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case 'name': return (a.title || '').localeCompare(b.title || '')
                case 'status': return (a.status || '').localeCompare(b.status || '')
                default: return 0
            }
        })

    const getWorkflowLabel = (nda: NDA) => {
        if (nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE') return { label: 'Sign now', style: 'bg-red-50 text-red-700' }
        if (nda.workflowState === 'AWAITING_PARTY_A_REVIEW') return { label: 'Changes to review', style: 'bg-amber-50 text-amber-700' }
        if (nda.workflowState === 'AWAITING_PARTY_B_SIGNATURE') return { label: 'Waiting for Party B', style: 'bg-teal-50 text-teal-700' }
        if (nda.workflowState === 'AWAITING_PARTY_B_REVIEW') return { label: 'Waiting for Party B', style: 'bg-teal-50 text-teal-700' }
        if (nda.workflowState === 'AWAITING_INPUT') return { label: 'Awaiting Party B', style: 'bg-teal-50 text-teal-700' }
        if (nda.workflowState === 'COMPLETE' || nda.workflowState === 'SIGNING_COMPLETE') return { label: 'Completed', style: 'bg-green-50 text-green-700' }
        if (nda.workflowState === 'REVIEWING_CHANGES') return { label: 'Review Changes', style: 'bg-amber-50 text-amber-700' }
        if (nda.workflowState === 'READY_TO_SIGN') return { label: 'Ready to Sign', style: 'bg-teal-50 text-teal-700' }
        if (nda.workflowState === 'AWAITING_SIGNATURE') return { label: 'Pending Signature', style: 'bg-teal-50 text-teal-700' }
        return null
    }

    type NdaCategory = 'action_required' | 'sent' | 'draft' | 'signed'
    const getNdaCategory = (nda: NDA): NdaCategory => {
        if (['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '')) return 'action_required'
        if (nda.status === 'SIGNED' || nda.workflowState === 'COMPLETE') return 'signed'
        if (nda.status === 'SENT') return 'sent'
        return 'draft'
    }

    const categorizedNdas = {
        action_required: filteredNdas.filter(nda => getNdaCategory(nda) === 'action_required'),
        sent: filteredNdas.filter(nda => getNdaCategory(nda) === 'sent'),
        draft: filteredNdas.filter(nda => getNdaCategory(nda) === 'draft'),
        signed: filteredNdas.filter(nda => getNdaCategory(nda) === 'signed'),
    }

    const allCategorized = {
        action_required: ndas.filter(nda => getNdaCategory(nda) === 'action_required').length,
        sent: ndas.filter(nda => getNdaCategory(nda) === 'sent').length,
        draft: ndas.filter(nda => getNdaCategory(nda) === 'draft').length,
        signed: ndas.filter(nda => getNdaCategory(nda) === 'signed').length,
    }

    const isSignedOrComplete = (nda: NDA) =>
        nda.status === 'SIGNED' || nda.workflowState === 'COMPLETE' || nda.workflowState === 'SIGNING_COMPLETE'

    const renderNdaRow = (nda: NDA) => {
        const workflowInfo = getWorkflowLabel(nda)
        const signed = isSignedOrComplete(nda)

        return (
            <div
                key={nda.id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 p-5"
            >
                <div className="flex items-start justify-between gap-4">
                    {/* Left: icon + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200">
                            <FileText className="w-4 h-4 text-teal-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="text-sm font-bold text-gray-900">{nda.title}</h3>
                                {/* Status badge */}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    nda.status === 'SIGNED' ? 'bg-green-50 text-green-700' :
                                    nda.status === 'SENT' ? 'bg-teal-50 text-teal-700' :
                                    nda.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {nda.status}
                                </span>
                                {workflowInfo && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${workflowInfo.style}`}>
                                        {workflowInfo.label}
                                    </span>
                                )}
                            </div>

                            {(nda.partyBName || nda.partyBEmail) && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    To: <span className="text-gray-700 font-medium">{nda.partyBName || nda.partyBEmail}</span>
                                    {nda.partyBName && nda.partyBEmail && <span className="text-gray-400"> · {nda.partyBEmail}</span>}
                                </p>
                            )}

                            <p className="text-xs text-gray-400 mt-1">
                                Created {new Date(nda.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        {/* DRAFT: Edit + Delete */}
                        {nda.status === 'DRAFT' && (
                            <>
                                <Link href={`/fillndahtml?draftId=${nda.id}`}>
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-all duration-200">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                </Link>
                                <button
                                    onClick={() => deleteDraft(nda.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100 text-red-500 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </>
                        )}

                        {/* AWAITING_PARTY_A_SIGNATURE: Sign Now */}
                        {nda.workflowState === 'AWAITING_PARTY_A_SIGNATURE' && nda.partyASignerId && (
                            <Link href={`/sign-nda-public/${nda.partyASignerId}`}>
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-800 text-white hover:bg-teal-700 transition-colors duration-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Sign Now
                                </button>
                            </Link>
                        )}

                        {/* AWAITING_PARTY_A_REVIEW: Review Changes */}
                        {nda.workflowState === 'AWAITING_PARTY_A_REVIEW' && nda.partyASignerId && (
                            <Link href={`/fillndahtml-public/${nda.partyASignerId}`}>
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Review Changes
                                </button>
                            </Link>
                        )}

                        {/* SIGNED / COMPLETE: View PDF */}
                        {signed && (
                            <button
                                onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.id}`, '_blank')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View PDF
                            </button>
                        )}

                        {/* SENT (not action, not signed): View */}
                        {nda.status === 'SENT' && !signed &&
                            !['AWAITING_PARTY_A_SIGNATURE', 'AWAITING_PARTY_A_REVIEW'].includes(nda.workflowState || '') && (
                                <Link href={`/view-nda/${nda.id}`}>
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-all duration-200">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                    </button>
                                </Link>
                            )
                        }
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
            </div>
        )
    }

    const outgoingCategoryTabs = [
        { key: 'all' as const, label: 'All', count: filteredNdas.length },
        { key: 'action_required' as const, label: 'Action Required', count: allCategorized.action_required, urgent: allCategorized.action_required > 0 },
        { key: 'sent' as const, label: 'Sent', count: allCategorized.sent },
        { key: 'draft' as const, label: 'Drafts', count: allCategorized.draft },
        { key: 'signed' as const, label: 'Signed', count: allCategorized.signed },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page header */}
                <div className="flex items-center justify-between py-10 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My NDAs</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage all your non-disclosure agreements</p>
                        </div>
                    </div>
                    <Link href="/fillndahtml?new=true">
                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer">
                            <Plus className="w-4 h-4" />
                            New NDA
                        </button>
                    </Link>
                </div>

                {/* Sent / Received tabs */}
                <div className="flex gap-2 pt-5 pb-1">
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'outgoing'
                                ? 'bg-teal-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-gray-900'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Sent
                        <span className={`text-xs font-bold ${activeTab === 'outgoing' ? 'opacity-70' : 'text-gray-400'}`}>{ndas.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'incoming'
                                ? 'bg-teal-800 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-gray-900'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        Received
                        <span className={`text-xs font-bold ${activeTab === 'incoming' ? 'opacity-70' : 'text-gray-400'}`}>{incomingNdas.length}</span>
                    </button>
                </div>

                {/* ── OUTGOING TAB ── */}
                {activeTab === 'outgoing' && (
                    <>
                        {/* Search + Sort toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 py-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, party name, or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700"
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="name">Name A–Z</option>
                                <option value="status">Status</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700"
                            >
                                <option value="all">All statuses</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="SIGNED">Signed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex flex-wrap gap-2 pb-4">
                            {outgoingCategoryTabs.map(({ key, label, count, urgent }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCategory(key)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                        selectedCategory === key
                                            ? urgent ? 'bg-red-600 text-white' : 'bg-teal-800 text-white'
                                            : urgent && count > 0
                                                ? 'bg-white border border-red-200 text-red-600 hover:border-red-400'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-gray-900'
                                    }`}
                                >
                                    {label}
                                    <span className={`text-xs font-bold ${selectedCategory === key ? 'opacity-70' : 'text-gray-400'}`}>{count}</span>
                                    {urgent && count > 0 && selectedCategory !== key && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center gap-2.5">
                                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* NDA rows */}
                        {filteredNdas.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-6 h-6 text-gray-300" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                                    {searchQuery || statusFilter !== 'all' ? 'No matching NDAs' : 'No NDAs yet'}
                                </h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first NDA to get started'}
                                </p>
                                {!searchQuery && statusFilter === 'all' && (
                                    <Link href="/fillndahtml?new=true">
                                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer">
                                            <Plus className="w-4 h-4" />
                                            New NDA
                                        </button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8 pb-12">
                                {(selectedCategory === 'all' || selectedCategory === 'action_required') && categorizedNdas.action_required.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{categorizedNdas.action_required.length}</span>
                                            <p className="text-xs font-bold uppercase tracking-widest text-red-600">Action Required</p>
                                        </div>
                                        <div className="space-y-3">{categorizedNdas.action_required.map(renderNdaRow)}</div>
                                    </div>
                                )}
                                {(selectedCategory === 'all' || selectedCategory === 'sent') && categorizedNdas.sent.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3">Sent <span className="text-gray-400 font-normal normal-case tracking-normal">({categorizedNdas.sent.length})</span></p>
                                        <div className="space-y-3">{categorizedNdas.sent.map(renderNdaRow)}</div>
                                    </div>
                                )}
                                {(selectedCategory === 'all' || selectedCategory === 'draft') && categorizedNdas.draft.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3">Drafts <span className="text-gray-400 font-normal normal-case tracking-normal">({categorizedNdas.draft.length})</span></p>
                                        <div className="space-y-3">{categorizedNdas.draft.map(renderNdaRow)}</div>
                                    </div>
                                )}
                                {(selectedCategory === 'all' || selectedCategory === 'signed') && categorizedNdas.signed.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3">Signed <span className="text-gray-400 font-normal normal-case tracking-normal">({categorizedNdas.signed.length})</span></p>
                                        <div className="space-y-3">{categorizedNdas.signed.map(renderNdaRow)}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── INCOMING TAB ── */}
                {activeTab === 'incoming' && (
                    <>
                        {/* Search + filter */}
                        {incomingNdas.length > 0 && (
                            <div className="flex flex-col sm:flex-row gap-3 py-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by title or sender..."
                                        value={incomingSearch}
                                        onChange={(e) => setIncomingSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                                    />
                                </div>
                                <select
                                    value={incomingStatusFilter}
                                    onChange={(e) => setIncomingStatusFilter(e.target.value as typeof incomingStatusFilter)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-700"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="SENT">Sent to me</option>
                                    <option value="VIEWED">Viewed</option>
                                    <option value="SIGNED">Signed</option>
                                </select>
                            </div>
                        )}

                        {/* Status pills */}
                        {incomingNdas.length > 0 && (
                            <div className="flex gap-2 flex-wrap pb-4">
                                {(['all', 'PENDING', 'SENT', 'SIGNED'] as const).map(s => {
                                    const count = s === 'all' ? incomingNdas.length : incomingNdas.filter(n => n.status === s).length
                                    if (s !== 'all' && count === 0) return null
                                    const label = s === 'all' ? 'All' : s === 'PENDING' ? 'Pending' : s === 'SENT' ? 'Sent to me' : 'Signed'
                                    const active = incomingStatusFilter === s
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setIncomingStatusFilter(s)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                                active
                                                    ? 'bg-teal-800 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-gray-900'
                                            }`}
                                        >
                                            {label}
                                            <span className={`text-xs font-bold ${active ? 'opacity-70' : 'text-gray-400'}`}>{count}</span>
                                        </button>
                                    )
                                })}
                                {(incomingSearch || incomingStatusFilter !== 'all') && (
                                    <button
                                        onClick={() => { setIncomingSearch(''); setIncomingStatusFilter('all') }}
                                        className="px-3 py-1.5 text-xs text-teal-700 hover:text-teal-900 font-medium"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}

                        {filteredIncomingNdas.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-6 h-6 text-gray-300" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                                    {incomingSearch || incomingStatusFilter !== 'all' ? 'No matching NDAs' : 'No incoming NDAs'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {incomingSearch || incomingStatusFilter !== 'all' ? 'Try adjusting your search or filters' : "You haven't received any NDAs yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-12">
                                {filteredIncomingNdas.map((nda) => (
                                    <div
                                        key={nda.id}
                                        className="group bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 p-5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200">
                                                    <FileText className="w-4 h-4 text-teal-700" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <h3 className="text-sm font-bold text-gray-900">{nda.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            nda.status === 'SIGNED' ? 'bg-green-50 text-green-700' :
                                                            nda.status === 'PENDING' || nda.status === 'SENT' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {nda.status === 'PENDING' ? 'Awaiting your action' : nda.status === 'SENT' ? 'Sent to you' : nda.status}
                                                        </span>
                                                    </div>
                                                    {(nda.fromName || nda.fromEmail) && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            From: <span className="text-gray-700 font-medium">{nda.fromName || nda.fromEmail}</span>
                                                            {nda.fromName && nda.fromEmail && <span className="text-gray-400"> · {nda.fromEmail}</span>}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Received {new Date(nda.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 shrink-0">
                                                {nda.status === 'SIGNED' ? (
                                                    <button
                                                        onClick={() => window.open(`/api/ndas/viewpdf?draftId=${nda.draftId}`, '_blank')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        View PDF
                                                    </button>
                                                ) : nda.workflowState === 'AWAITING_PARTY_B_SIGNATURE' ? (
                                                    <Link href={`/sign-nda-public/${nda.signerId}`}>
                                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-800 text-white hover:bg-teal-700 transition-colors duration-200">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                            Sign Now
                                                        </button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/fillndahtml-public/${nda.signerId}`}>
                                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-all duration-200">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Review
                                                        </button>
                                                    </Link>
                                                )}
                                            </div>
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
