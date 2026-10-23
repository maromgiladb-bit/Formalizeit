'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { acceptTerms } from '@/actions/terms'

export default function AcceptTermsForm({ next }: { next: string }) {
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const res = await acceptTerms()
        if (!res.ok) {
          setError('Something went wrong. Please try again.')
          return
        }
        router.replace(next)
        router.refresh()
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-teal-800"
        />
        <span>
          I agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-800 hover:text-teal-700 underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-800 hover:text-teal-700 underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={!checked || pending}>
        {pending ? 'Saving…' : 'Continue'}
      </Button>
    </form>
  )
}
