'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { X, ExternalLink } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  billingCycle?: 'monthly' | 'annual'
}

export function CheckoutModal({ isOpen, onClose, billingCycle = 'monthly' }: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullPageLoading, setFullPageLoading] = useState(false)

  async function handleFullPage() {
    setFullPageLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle, embedded: false }),
      })
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore — fall through
    } finally {
      setFullPageLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null)
      setError(null)
      return
    }

    setLoading(true)
    fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingCycle, embedded: true }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'Could not initialize checkout')
        }
      })
      .catch(() => setError('Could not initialize checkout'))
      .finally(() => setLoading(false))
  }, [isOpen, billingCycle])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Panel — slides up from bottom-right */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className="fixed bottom-6 right-6 z-50 w-[460px] max-h-[90vh] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-teal-700 text-xs font-bold uppercase tracking-widest">Upgrade to Pro</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {billingCycle === 'annual' ? '$16 / month · billed annually' : '$20 / month · billed monthly'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleFullPage}
                  disabled={fullPageLoading}
                  title="Open full page checkout"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Checkout content */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-800 rounded-full animate-spin" />
                </div>
              )}
              {error && (
                <div className="p-5 text-sm text-red-600 font-medium">{error}</div>
              )}
              {clientSecret && (
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
