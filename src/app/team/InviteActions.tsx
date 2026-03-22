'use client'

import { acceptInvite, declineInvite } from '@/actions/team'
import { useTransition } from 'react'

export default function InviteActions({ membershipId }: { membershipId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleAccept = () => {
        startTransition(async () => {
            const fd = new FormData()
            fd.set('membershipId', membershipId)
            await acceptInvite(membershipId)
        })
    }

    const handleDecline = () => {
        startTransition(async () => {
            const fd = new FormData()
            fd.set('membershipId', membershipId)
            await declineInvite(membershipId)
        })
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            <button
                onClick={handleDecline}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50 transition-colors shrink-0"
            >
                {isPending ? '...' : 'Decline'}
            </button>
            <button
                onClick={handleAccept}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors shrink-0"
            >
                {isPending ? '...' : 'Accept'}
            </button>
        </div>
    )
}
