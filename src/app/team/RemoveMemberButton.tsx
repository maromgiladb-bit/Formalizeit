'use client'

import { removeMember } from '@/actions/team'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RemoveMemberButton({
    membershipId,
    memberName,
}: {
    membershipId: string
    memberName: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)

    const handleRemove = () => {
        startTransition(async () => {
            const fd = new FormData()
            fd.set('membershipId', membershipId)
            await removeMember(fd)
            setShowConfirm(false)
            router.refresh()
        })
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="text-xs text-red-600 hover:text-red-800 hover:underline"
            >
                Remove Member
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
                            <h3 className="text-sm font-semibold text-gray-900">Remove member</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Are you sure you want to remove <strong>{memberName}</strong> from the team?
                            </p>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isPending}
                                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRemove}
                                    disabled={isPending}
                                    className="text-xs px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isPending ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
