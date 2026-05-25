'use client'

import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard, ArrowRight, AlertTriangle, CheckCircle,
  Check, Download, ExternalLink, FileText, Zap,
} from 'lucide-react'
import { CheckoutModal } from '@/components/billing/CheckoutModal'

interface SubscriptionInfo {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'DEV'
  ndaCount: number
  limit: number | null
  remaining: number | null
  draftLimitPeriod: 'total' | 'quarter'
  billingStatus: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED'
  stripeCurrentPeriodEnd: string | null
  hasStripeSubscription: boolean
}

interface Invoice {
  id: string
  number: string | null
  amountPaid: number
  currency: string
  status: string | null
  date: number
  pdfUrl: string | null
  hostedUrl: string | null
}

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: [
    'Up to 3 NDAs total',
    '1 team member',
    'Basic templates',
    'E-signature support',
    'Email support',
    '7-day document storage',
  ],
  PRO: [
    '25 NDAs per quarter',
    'Up to 10 team members',
    'All professional templates',
    'E-signature support',
    'Priority support',
    'Advanced tracking & audit trail',
    'Custom branding',
    'Bidirectional editing',
  ],
  ENTERPRISE: [
    'Unlimited everything',
    'Custom templates',
    'Dedicated account manager',
    'API access',
    'SSO authentication',
    'Custom integrations',
    'SLA agreement',
    'On-premise option',
  ],
  DEV: [
    'Full Pro access',
    'Developer testing environment',
    'No billing required',
  ],
}

function BillingSuccessBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('checkout') !== 'success') return null
  return (
    <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium shadow-sm">
      <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center shrink-0">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
      <span>You&apos;re now on Pro. Welcome to FormalizeIt Pro!</span>
    </div>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function BillingSettingsPage() {
  const { userId } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    async function fetchData() {
      try {
        const [subRes, invRes] = await Promise.all([
          fetch('/api/user/check-limit'),
          fetch('/api/billing/invoices'),
        ])
        if (subRes.ok) setSubscription(await subRes.json())
        if (invRes.ok) {
          const data = await invRes.json()
          setInvoices(data.invoices ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  if (!userId) redirect('/sign-in')

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setPortalLoading(false)
    }
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'Free'
      case 'PRO': return 'Pro'
      case 'ENTERPRISE': return 'Enterprise'
      case 'DEV': return 'Developer'
      default: return plan
    }
  }

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'FREE': return '$0 / month'
      case 'PRO': return '$20 / month'
      case 'ENTERPRISE': return 'Custom pricing'
      case 'DEV': return 'Complimentary'
      default: return '—'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!subscription) {
    return <p className="text-sm text-gray-500">Unable to load billing info.</p>
  }

  const features = PLAN_FEATURES[subscription.plan] ?? []

  return (
    <div className="space-y-6">

      <Suspense fallback={null}>
        <BillingSuccessBanner />
      </Suspense>

      {/* PAST_DUE warning */}
      {subscription.billingStatus === 'PAST_DUE' && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2.5 text-sm text-red-600 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Payment failed. Update your payment method to keep Pro access.</span>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="text-sm font-semibold text-gray-900 underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Update Payment
          </button>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Plan header */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Current Plan</p>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {getPlanDisplayName(subscription.plan)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  subscription.billingStatus === 'PAST_DUE'
                    ? 'bg-red-50 text-red-700'
                    : subscription.billingStatus === 'TRIALING'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-teal-50 text-teal-800'
                }`}>
                  {subscription.billingStatus === 'TRIALING' ? 'Trial'
                    : subscription.billingStatus === 'PAST_DUE' ? 'Past Due'
                    : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{getPlanPrice(subscription.plan)}</p>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-teal-700" />
            </div>
          </div>
        </div>

        {/* Usage bar — Free plan */}
        {subscription.plan === 'FREE' && subscription.limit && (
          <div className="px-6 pb-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <span>Usage</span>
              <span>{subscription.ndaCount} / {subscription.limit} NDAs</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  subscription.remaining === 0 ? 'bg-red-500' : 'bg-teal-800'
                }`}
                style={{ width: `${Math.min((subscription.ndaCount / subscription.limit) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {subscription.remaining === 0
                ? "You've reached your limit."
                : `${subscription.remaining} NDAs remaining ${subscription.draftLimitPeriod === 'quarter' ? 'this quarter' : 'in total'}.`}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
          <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-4">Included features</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Action */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-4">
          {subscription.plan === 'FREE' ? (
            <>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer"
              >
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link href="/plans" className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2">
                View all plans
              </Link>
            </>
          ) : subscription.hasStripeSubscription ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm disabled:opacity-60 cursor-pointer"
            >
              {portalLoading ? 'Opening portal...' : 'Manage Subscription'}
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-400 font-semibold rounded-lg text-sm cursor-not-allowed bg-gray-50"
            >
              Current Plan Active
            </button>
          )}
        </div>
      </div>

      {/* Billing Details */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-1">Billing Details</p>
              <h3 className="text-sm font-bold text-gray-900">Subscription &amp; payment information</h3>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-teal-700" />
            </div>
          </div>
        </div>
        <dl className="divide-y divide-gray-100">
          <div className="px-6 py-4 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Billing Cycle</dt>
            <dd className="text-sm text-gray-900 col-span-2">
              {subscription.plan === 'FREE' || subscription.plan === 'DEV' ? 'None' : 'Monthly'}
            </dd>
          </div>
          <div className="px-6 py-4 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
            <dd className="text-sm text-gray-900 col-span-2">
              {subscription.hasStripeSubscription ? 'Managed via Stripe' : 'None'}
            </dd>
          </div>
          {subscription.stripeCurrentPeriodEnd && (
            <div className="px-6 py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Renews On</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </dd>
            </div>
          )}
          <div className="px-6 py-4 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="text-sm col-span-2">
              {subscription.billingStatus === 'PAST_DUE' ? (
                <span className="text-red-600 font-medium">Past Due</span>
              ) : (
                <span className="text-gray-900 capitalize">{subscription.billingStatus.toLowerCase()}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Invoice History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-1">Invoice History</p>
              <h3 className="text-sm font-bold text-gray-900">Past payments and receipts</h3>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-teal-700" />
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-500">No invoices yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-sm text-gray-700">{formatDate(inv.date)}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">{inv.number ?? '—'}</td>
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                    {formatCurrency(inv.amountPaid, inv.currency)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      inv.status === 'paid'
                        ? 'bg-teal-50 text-teal-800'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {inv.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      {inv.hostedUrl && (
                        <a
                          href={inv.hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                          title="View invoice"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  )
}
