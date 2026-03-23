'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createOrganization } from '@/actions/team'
import { useRouter } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-(--teal-600) hover:bg-(--teal-700) focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--teal-600) disabled:opacity-50"
        >
            {pending ? 'Creating...' : 'Create Organization'}
        </button>
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
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create your organization</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Set up a workspace to manage NDAs and invite team members.
                </p>
                <p className="mt-1 text-sm text-gray-400">
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
                                className="shadow-sm focus:ring-(--teal-600) focus:border-(--teal-600) block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="Acme Corp"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <SubmitButton />
                    </div>

                    {message && (
                        <div className={`mt-4 p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
