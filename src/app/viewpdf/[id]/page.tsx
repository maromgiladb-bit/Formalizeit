'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Draft {
  id: string
  title: string
  status: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
  signers: Array<{
    id: string
    email: string
    role: string
    status: string
    signed_at: string | null
  }>
}

export default function ViewPDF() {
  const params = useParams()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfPath, setPdfPath] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const fetchDraftAndGeneratePdf = useCallback(async () => {
    try {
      // Fetch draft data
      const response = await fetch(`/api/ndas/drafts/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch draft')
      }

      const data = await response.json()
      if (data.draft) {
        setDraft(data.draft)

        // Generate preview PDF
        setGeneratingPdf(true)
        const pdfResponse = await fetch(`/api/ndas/preview/${params.id}`)
        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json()
          setPdfPath(pdfData.path)
        }
        setGeneratingPdf(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchDraftAndGeneratePdf()
    }
  }, [params.id, fetchDraftAndGeneratePdf])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'SIGNED': return 'bg-green-100 text-green-800'
      case 'VOID': return 'bg-red-100 text-red-800'
      case 'PENDING_OWNER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'WAITING_REVIEW': return 'bg-purple-100 text-purple-800'
      case 'NEEDS_RECIPIENT_CHANGES': return 'bg-orange-100 text-orange-800'
      case 'READY_TO_SIGN': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING_OWNER_REVIEW': return 'Waiting for Your Review'
      case 'NEEDS_RECIPIENT_CHANGES': return 'Needs Changes'
      case 'READY_TO_SIGN': return 'Ready to Sign'
      case 'WAITING_REVIEW': return 'Waiting Review'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Draft not found</h2>
          <p className="text-gray-600 mb-4">The requested NDA draft could not be found.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                aria-label="Back to dashboard"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg aria-hidden="true" className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{draft.title}</h1>
                <p className="text-gray-600 mt-1">
                  Created {new Date(draft.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(draft.status)}`}>
                {getStatusLabel(draft.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
              </div>
              <div className="p-6">
                {generatingPdf ? (
                  <div className="flex flex-col items-center justify-center h-[700px] bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Generating PDF preview...</p>
                    <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
                  </div>
                ) : pdfPath ? (
                  <iframe
                    src={pdfPath}
                    className="w-full h-[700px] border border-gray-300 rounded-lg"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[700px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <svg aria-hidden="true" className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">PDF preview not available</p>
                      <button
                        onClick={fetchDraftAndGeneratePdf}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Document Info</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(draft.status)}`}>
                    {getStatusLabel(draft.status)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(draft.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(draft.updated_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </div>
            </div>

            {/* Signers */}
            {draft.signers && draft.signers.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Signers</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {draft.signers.map((signer) => (
                      <div key={signer.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{signer.email}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{signer.role}</p>
                          {signer.signed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Signed {new Date(signer.signed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(signer.status)}`}>
                          {signer.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                {pdfPath && (
                  <a
                    href={pdfPath}
                    download={`${draft.title}.pdf`}
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-blue-300 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                )}
                {draft.status === 'DRAFT' && (
                  <Link
                    href={`/fillndahtml?draftId=${draft.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Document
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg aria-hidden="true" className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
