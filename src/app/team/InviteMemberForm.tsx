'use client'

import { Button } from '@/components/ui/button'
import { inputClassesCrisp } from '@/components/ui/input'
import { useRef, useState } from 'react'
import { inviteMember } from '@/actions/team'
import { useFormStatus } from 'react-dom'
import { ORGANIZATION_ROLE_OPTIONS } from '@/lib/organizationRoles'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button shape="crisp" type="submit" disabled={pending}>
            {pending ? 'Inviting...' : 'Invite Member'}
        </Button>
    )
}

export default function InviteMemberForm() {
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    async function clientAction(formData: FormData) {
        setMessage(null)
        const result = await inviteMember(formData)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Invitation sent successfully!' })
            formRef.current?.reset()
        }
    }

    return (
        <form ref={formRef} action={clientAction} className="mt-6 bg-white border border-line rounded-sheet p-6">
            <h3 className="text-lg font-medium leading-6 text-ink mb-4">Invite New Member</h3>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            className={inputClassesCrisp}
                            placeholder="colleague@example.com"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role
                    </label>
                    <div className="mt-1">
                        <select
                            id="role"
                            name="role"
                            defaultValue="CONTRIBUTOR"
                            required
                            className={inputClassesCrisp}
                        >
                            {ORGANIZATION_ROLE_OPTIONS.map((roleOption) => (
                                <option key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <SubmitButton />
            </div>

            {message && (
                <div className={`mt-4 p-4 rounded-control ${message.type === 'success' ? 'bg-gray-50 text-ink border border-line' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </form>
    )
}
