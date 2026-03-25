'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { redirect, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SettingsPage() {
  const { userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!userId) {
    redirect('/sign-in')
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      // Redirect home — Clerk session is now invalid
      router.push('/?deleted=1')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Personal details and account management
        </p>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-6">
        <div className="group">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
          <p className="text-lg text-gray-900 font-medium">{user?.fullName || 'Not set'}</p>
        </div>
        <div className="h-px bg-gray-100"></div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
          <p className="text-lg text-gray-900 font-medium">{user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
        </div>
        <div className="h-px bg-gray-100"></div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-600 mb-2">User ID</label>
          <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-200">{userId}</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="mt-8 px-4 py-5 sm:px-6 border-t border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Show Organization Switcher</span>
              <span className="text-sm text-gray-500">Display the organization dropdown in the toolbar</span>
            </span>
            <button
              type="button"
              disabled
              className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
              role="switch"
              aria-checked="false"
            >
              <span aria-hidden="true" className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>
          <p className="text-xs text-gray-400 italic">* This setting is managed by your organization administrator (Coming Soon)</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 px-4 py-5 sm:px-6 border-t border-gray-200 bg-red-50 sm:rounded-b-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-600 mb-4">
          Deleting your account removes your access immediately. Your signed NDAs are preserved for 30 days, after which your personal data is anonymized.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="bg-white border border-red-300 rounded-lg p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-800">
              Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setDeleteError(null) }}
                disabled={deleting}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
