'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09 } },
}

export default function SettingsPage() {
  const { userId } = useAuth()
  const { user } = useUser()

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
      window.location.href = '/?deleted=1'
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="initial"
      animate="animate"
    >

      {/* Account Information */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Account Information</h3>
              <p className="text-sm text-gray-500">Personal details and account management</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
            <p className="text-base text-gray-900 font-medium">{user?.fullName || 'Not set'}</p>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
            <p className="text-base text-gray-900 font-medium">{user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
          </div>
        </div>
      </motion.div>

      {/* Sign-in & Security */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <Link
          href="/settings/account-security"
          className="flex items-center gap-3 px-6 py-5 hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900">Sign-in &amp; Security</h3>
            <p className="text-sm text-gray-500">
              Update your password and manage how you sign in.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </Link>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fadeUp} className="rounded-xl border border-red-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-sm font-bold text-red-800">Danger Zone</h3>
          </div>
        </div>

        <div className="px-6 py-5 bg-red-50/30">
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Deleting your account removes your access immediately. Your signed NDAs are preserved for 30 days, after which your personal data is anonymized.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors duration-200 cursor-pointer"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-white border border-red-200 rounded-lg p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-800">
                Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                autoFocus
              />
              {deleteError && (
                <p className="text-sm text-red-600">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setDeleteError(null) }}
                  disabled={deleting}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
