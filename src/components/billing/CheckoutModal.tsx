'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { X, ExternalLink } from 'lucide-react'

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

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
      if (!res.ok) {
        setError('Could not start checkout. Please try again.')
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not start checkout. Please try again.')
      }
    } catch {
      setError('Could not start checkout. Please try again.')
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

    const controller = new AbortController()

    setLoading(true)
    fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingCycle, embedded: true }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) {
          return res.json().catch(() => null).then(data => {
            throw new Error(data?.error || 'Could not initialize checkout')
          })
        }
        return res.json()
      })
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'Could not initialize checkout')
        }
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Could not initialize checkout')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
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
            className="fixed bottom-0 right-0 z-50 w-full sm:bottom-6 sm:right-6 sm:w-[460px] max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-teal-700 text-xs font-bold uppercase tracking-widest">Upgrade to Pro</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {billingCycle === 'annual' ? '$15.99 / month · billed annually' : '$19.99 / month · billed monthly'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleFullPage}
                  disabled={fullPageLoading}
                  title="Open full page checkout"
                  aria-label="Open full page checkout"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close checkout"
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
              {!stripePublishableKey && (
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-600">Embedded checkout is unavailable. Use the full-page checkout instead.</p>
                  <button
                    onClick={handleFullPage}
                    disabled={fullPageLoading}
                    className="w-full bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
                  >
                    {fullPageLoading ? 'Redirecting…' : 'Continue to checkout'}
                  </button>
                </div>
              )}
              {error && (
                <div className="p-5 text-sm text-red-600 font-medium">{error}</div>
              )}
              {clientSecret && stripePromise && (
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
