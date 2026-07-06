'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CancelSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  plan: 'PRO' | 'TEAM'
  currentPeriodEnd: string | null
  /** Called after a successful "cancel at period end" so the page can refresh its state. */
  onCancelled: () => void
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  plan,
  currentPeriodEnd,
  onCancelled,
}: CancelSubscriptionModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accessUntil = formatDate(currentPeriodEnd)

  async function handleCancel() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription')
      onCancelled()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel subscription')
      setBusy(false)
    }
  }

  async function handleDowngrade() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to start downgrade')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to start downgrade')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start downgrade')
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={busy ? undefined : onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
              exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
              className="pointer-events-auto relative bg-white rounded-2xl shadow-float max-w-md w-full p-6"
            >
              <button
                onClick={busy ? undefined : onClose}
                aria-label="Close"
                disabled={busy}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Cancel subscription</p>
              <h3 className="text-lg font-semibold text-ink mb-2">Before you go — here&apos;s what happens</h3>

              <ul className="space-y-2.5 text-sm text-gray-600 mb-5">
                <li className="flex gap-2">
                  <span className="text-gray-300 shrink-0">•</span>
                  <span>
                    You keep {plan === 'TEAM' ? 'Team' : 'Pro'} access
                    {accessUntil ? <> until <span className="font-semibold text-ink">{accessUntil}</span></> : ' until the end of your billing period'}, then your plan moves to Free.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-300 shrink-0">•</span>
                  <span>Your NDAs stay saved under our retention policy — nothing is deleted when you cancel.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-300 shrink-0">•</span>
                  <span>You can resubscribe anytime to restore full access.</span>
                </li>
              </ul>

              {plan === 'TEAM' && (
                <div className="mb-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-ink mb-1">Only need fewer seats?</p>
                  <p className="text-sm text-gray-500 mb-3">Downgrade to Pro to keep unlimited NDAs at a lower price instead of cancelling.</p>
                  <Button variant="outline" className="w-full" onClick={handleDowngrade} disabled={busy}>
                    Downgrade to Pro instead
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
                  Keep my plan
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={busy}>
                  {busy ? 'Cancelling…' : 'Cancel subscription'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
