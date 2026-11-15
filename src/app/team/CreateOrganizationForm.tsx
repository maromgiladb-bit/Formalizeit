'use client'

import { Button } from '@/components/ui/button'
import { inputClassesCrisp } from '@/components/ui/input'
import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createOrganization } from '@/actions/team'
import { useRouter } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button shape="crisp" type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Organization'}
        </Button>
    )
}

export default function CreateOrganizationForm() {
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const router = useRouter()

    async function clientAction(formData: FormData) {
        setMessage(null)
        const name = formData.get('name') as string
        const result = await createOrganization(name)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Organization created!' })
            formRef.current?.reset()
            router.refresh()
        }
    }

    return (
        <div className="bg-white">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-ink">Create your organization</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Set up a workspace to manage NDAs and invite team members.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                    Already part of a team? Ask your organization admin to invite you.
                </p>

                <form ref={formRef} action={clientAction} className="mt-5">
                    <div className="max-w-sm">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Organization name
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                minLength={2}
                                maxLength={80}
                                className={inputClassesCrisp}
                                placeholder="Acme Corp"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <SubmitButton />
                    </div>

                    {message && (
                        <div className={`mt-4 p-4 rounded-control text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
