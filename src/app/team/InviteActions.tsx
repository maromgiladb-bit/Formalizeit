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
                className="px-3 py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-control hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
            >
                {isPending ? '...' : 'Decline'}
            </button>
            <button
                onClick={handleAccept}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-teal-800 border border-transparent rounded-control hover:bg-teal-700 disabled:opacity-50 transition-colors shrink-0"
            >
                {isPending ? '...' : 'Accept'}
            </button>
        </div>
    )
}
