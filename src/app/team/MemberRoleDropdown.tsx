'use client'

import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { updateMemberRole } from '@/actions/team'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function MemberRoleDropdown({
    membershipId,
    currentRole,
    options,
    label,
    serverAction,
    fieldName = 'role',
}: {
    membershipId: string
    currentRole: string
    options: { value: string; label: string }[]
    label?: string
    serverAction?: (fd: FormData) => Promise<void>
    fieldName?: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedRole, setSelectedRole] = useState(currentRole)

    const selectedLabel = options.find(o => o.value === selectedRole)?.label || selectedRole
    const hasChanged = selectedRole !== currentRole

    const dropdownOptions = options.map(opt => ({
        label: opt.label,
        onClick: () => setSelectedRole(opt.value),
    }))

    const handleSave = () => {
        startTransition(async () => {
            const fd = new FormData()
            fd.set('membershipId', membershipId)
            fd.set(fieldName, selectedRole)
            await (serverAction ?? updateMemberRole)(fd)
            router.refresh()
        })
    }

    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-gray-600">{label}</span>}
            <DropdownMenu options={dropdownOptions}>
                {selectedLabel}
            </DropdownMenu>
            {hasChanged && (
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="text-xs px-2 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    {isPending ? 'Saving...' : 'Save'}
                </button>
            )}
        </div>
    )
}
