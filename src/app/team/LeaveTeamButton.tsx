'use client'

import { leaveOrganization } from '@/actions/team'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LeaveTeamButton({
    membershipId,
    orgName,
}: {
    membershipId: string
    orgName: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)

    const handleLeave = () => {
        startTransition(async () => {
            await leaveOrganization(membershipId)
            setShowConfirm(false)
            router.push('/dashboard')
        })
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="text-xs text-red-600 hover:text-red-800 hover:underline"
            >
                Leave Team
            </button>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-sm font-semibold text-gray-900">Leave Team</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Are you sure you want to leave <strong>{orgName}</strong>? You will lose access to team documents.
                            </p>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isPending}
                                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeave}
                                    disabled={isPending}
                                    className="text-xs px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {isPending ? 'Leaving...' : 'Leave Team'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
