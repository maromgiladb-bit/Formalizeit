'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { createOrganization } from '@/actions/team'
import { Button } from '@/components/ui/button'
import { inputClasses } from '@/components/ui/input'

export default function OnboardingForm() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = orgName.trim()
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setLoading(true)
    setError('')
    const result = await createOrganization(trimmed)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/formalizeIt-logo.png" alt="FormalizeIt" width={180} height={45} className="h-10 w-auto" priority />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-card px-8 py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-ink leading-tight">Set up your workspace</h1>
              <p className="text-sm text-gray-500">What&apos;s the name of your organization?</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g., Acme Corp"
                autoFocus
                className={inputClasses}
                maxLength={80}
              />
              {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
              <p className="mt-1.5 text-xs text-gray-400">This will appear across your workspace and on your team page.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
