'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, ArrowRight, AlertTriangle,
  Check, Download, ExternalLink, FileText, Zap,
} from 'lucide-react'
import { CheckoutModal } from '@/components/billing/CheckoutModal'
import { CancelSubscriptionModal } from '@/components/billing/CancelSubscriptionModal'
import { Button } from '@/components/ui/button'

interface SubscriptionInfo {
  plan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE' | 'DEV'
  ndaCount: number
  limit: number | null
  remaining: number | null
  draftLimitPeriod: 'total' | 'quarter'
  billingStatus: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED'
  stripeCurrentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasStripeSubscription: boolean
  billingCycle: 'monthly' | 'annual' | null
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
    '1 user',
    'Send, review & e-sign NDAs',
    'Basic dashboard & counterparty management',
    '5-year document storage',
  ],
  PRO: [
    'Unlimited NDA generation',
    '1 user',
    'NDA dashboard & search',
    'Full audit trail',
  ],
  TEAM: [
    'Everything in Pro',
    'Up to 10 users',
    'Shared workspace & team dashboard',
    'Centralized NDA repository',
    'Role-based permissions',
  ],
  ENTERPRISE: [
    'SSO',
    'Legal approval workflow',
    'Private NDA standard',
    'Compliance requirements',
    'CRM integrations',
    'Custom API',
  ],
  DEV: [
    'Full Pro access',
    'Developer testing environment',
    'No billing required',
  ],
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
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isOwner, setIsOwner] = useState(true)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<'PRO' | 'TEAM'>('PRO')
  const [cancelOpen, setCancelOpen] = useState(false)
  // Set when we hand the user off to the Stripe portal (a separate tab), so we
  // only reconcile with Stripe when they actually return from it — not on every
  // incidental tab focus.
  const pendingPortalReturn = useRef(false)

  const loadBilling = useCallback(async () => {
    try {
      // Reconcile with Stripe first so a missed subscription webhook can't leave
      // the UI stale (e.g. a cancel/resubscribe that didn't sync). Best-effort.
      await fetch('/api/billing/sync', { method: 'POST' }).catch(() => {})
      const [subRes, invRes] = await Promise.all([
        fetch('/api/user/check-limit'),
        fetch('/api/billing/invoices'),
      ])
      if (subRes.ok) setSubscription(await subRes.json())
      if (invRes.status === 403 || invRes.status === 401) {
        setIsOwner(false)
      } else if (invRes.ok) {
        const data = await invRes.json()
        setInvoices(data.invoices ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    loadBilling().finally(() => setLoading(false))
  }, [userId, loadBilling])

  // Reconcile with Stripe only when the user returns from the billing portal
  // (opened in a separate tab), not on every incidental focus/visibility change.
  useEffect(() => {
    if (!userId) return
    function refreshOnReturn() {
      if (document.visibilityState !== 'visible') return
      if (!pendingPortalReturn.current) return
      pendingPortalReturn.current = false
      loadBilling()
    }
    document.addEventListener('visibilitychange', refreshOnReturn)
    window.addEventListener('focus', refreshOnReturn)
    return () => {
      document.removeEventListener('visibilitychange', refreshOnReturn)
      window.removeEventListener('focus', refreshOnReturn)
    }
  }, [userId, loadBilling])

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/sign-in')
  }, [isLoaded, userId, router])

  function openCheckoutFor(plan: 'PRO' | 'TEAM') {
    setCheckoutPlan(plan)
    setCheckoutOpen(true)
  }

  function handleCancelled() {
    // Optimistically reflect the pending cancellation; webhook confirms it.
    setSubscription(prev => (prev ? { ...prev, cancelAtPeriodEnd: true } : prev))
  }

  async function handleManageSubscription() {
    setPortalError(null)
    setPortalLoading(true)
    // Open the tab synchronously so the browser keeps the user-gesture context;
    // opening after the await would be blocked by popup blockers. Note: passing
    // "noopener" makes window.open return null, so we open normally and sever
    // window.opener ourselves once the tab exists.
    const portalTab = window.open('', '_blank')
    if (portalTab) portalTab.opener = null
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (!res.ok) {
        portalTab?.close()
        setPortalError('Failed to open billing portal. Please try again.')
        return
      }
      const data = await res.json()
      if (data.url) {
        // Arm the return-refresh so we reconcile with Stripe when they come back.
        pendingPortalReturn.current = true
        if (portalTab) {
          portalTab.location.href = data.url
        } else {
          // Popup was blocked — fall back to same-tab navigation.
          window.location.href = data.url
        }
      } else {
        portalTab?.close()
        setPortalError('Failed to open billing portal. Please try again.')
      }
    } catch (err) {
      console.error('Portal error:', err)
      portalTab?.close()
      setPortalError('Failed to open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'Free'
      case 'PRO': return 'Pro'
      case 'TEAM': return 'Team'
      case 'ENTERPRISE': return 'Enterprise'
      case 'DEV': return 'Developer'
      default: return plan
    }
  }

  const getPlanPrice = (plan: string, billingCycle: 'monthly' | 'annual' | null) => {
    switch (plan) {
      case 'FREE': return '$0 / month'
      case 'PRO': return billingCycle === 'annual'
        ? '$7.65 / month, billed annually'
        : '$9 / month'
      case 'TEAM': return billingCycle === 'annual'
        ? '$42.50 / month, billed annually'
        : '$50 / month'
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

  const pendingCancel =
    subscription.cancelAtPeriodEnd &&
    subscription.billingStatus !== 'CANCELLED' &&
    !!subscription.stripeCurrentPeriodEnd

  const periodEndLabel = subscription.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">

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
            className="text-sm font-semibold text-ink underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Update Payment
          </button>
        </div>
      )}

      {/* Pending cancellation notice */}
      {subscription.cancelAtPeriodEnd && subscription.billingStatus !== 'CANCELLED' && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2.5 text-sm text-amber-700 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your plan is set to cancel
              {subscription.stripeCurrentPeriodEnd
                ? ` on ${formatDate(Math.floor(new Date(subscription.stripeCurrentPeriodEnd).getTime() / 1000))}`
                : ' at the end of this period'}
              . Resubscribe anytime to keep full access.
            </span>
          </div>
          {isOwner && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="text-sm font-semibold text-ink underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Manage
            </button>
          )}
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
                <span className="text-3xl font-extrabold text-ink tracking-tight">
                  {getPlanDisplayName(subscription.plan)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  subscription.billingStatus === 'PAST_DUE'
                    ? 'bg-red-50 text-red-700'
                    : subscription.billingStatus === 'CANCELLED'
                    ? 'bg-gray-100 text-gray-500'
                    : pendingCancel
                    ? 'bg-amber-50 text-amber-700'
                    : subscription.billingStatus === 'TRIALING'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-teal-50 text-teal-800'
                }`}>
                  {subscription.billingStatus === 'PAST_DUE' ? 'Past Due'
                    : subscription.billingStatus === 'CANCELLED' ? 'Cancelled'
                    : pendingCancel && periodEndLabel ? `Active until ${periodEndLabel}`
                    : subscription.billingStatus === 'TRIALING' ? 'Trial'
                    : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{getPlanPrice(subscription.plan, subscription.billingCycle)}</p>
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
        <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-4 flex-wrap">
          {subscription.billingStatus === 'CANCELLED' && isOwner ? (
            /* Subscription was cancelled — allow re-subscribing */
            <>
              <Button onClick={() => openCheckoutFor(subscription.plan === 'TEAM' ? 'TEAM' : 'PRO')}>
                Re-subscribe
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/#pricing" className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2">
                View all plans
              </Link>
            </>
          ) : subscription.plan === 'FREE' ? (
            <>
              {isOwner ? (
                <Button onClick={() => openCheckoutFor('PRO')}>
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <p className="text-sm text-gray-500">Only the organization owner can upgrade the plan.</p>
              )}
              <Link href="/#pricing" className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2">
                View all plans
              </Link>
            </>
          ) : subscription.plan === 'PRO' && isOwner ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? 'Opening portal...' : 'Manage Subscription'}
                </Button>
                {portalError && <p className="text-xs text-red-600">{portalError}</p>}
              </div>
              <Link href="/#pricing" className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2">
                Upgrade to Team
              </Link>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="text-xs text-gray-400 hover:text-red-600 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          ) : subscription.hasStripeSubscription && isOwner ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? 'Opening portal...' : 'Manage Subscription'}
                </Button>
                {portalError && <p className="text-xs text-red-600">{portalError}</p>}
              </div>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="text-xs text-gray-400 hover:text-red-600 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          ) : (
            <Button variant="outline" disabled>
              Current Plan Active
            </Button>
          )}
        </div>
      </div>

      {/* Billing Details */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-1">Billing Details</p>
              <h3 className="text-sm font-semibold text-ink">Subscription &amp; payment information</h3>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-teal-700" />
            </div>
          </div>
        </div>
        <dl className="divide-y divide-gray-100">
          <div className="px-6 py-4 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Billing Cycle</dt>
            <dd className="text-sm text-ink col-span-2">
              {subscription.plan === 'FREE' || subscription.plan === 'DEV'
                ? 'None'
                : subscription.billingCycle === 'annual'
                ? 'Annual'
                : 'Monthly'}
            </dd>
          </div>
          <div className="px-6 py-4 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
            <dd className="text-sm text-ink col-span-2">
              {subscription.hasStripeSubscription ? 'Managed via Stripe' : 'None'}
            </dd>
          </div>
          {subscription.stripeCurrentPeriodEnd && (
            <div className="px-6 py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Renews On</dt>
              <dd className="text-sm text-ink col-span-2">
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
              ) : pendingCancel && periodEndLabel ? (
                <span className="text-amber-700 font-medium">Active until {periodEndLabel}</span>
              ) : (
                <span className="text-ink capitalize">{subscription.billingStatus.toLowerCase()}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Invoice History */}
      {isOwner && <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-1">Invoice History</p>
              <h3 className="text-sm font-semibold text-ink">Past payments and receipts</h3>
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
                  <td className="px-6 py-3.5 text-sm font-medium text-ink">
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
      </div>}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        plan={checkoutPlan}
      />

      {/* Cancel Subscription Modal */}
      {(subscription.plan === 'PRO' || subscription.plan === 'TEAM') && (
        <CancelSubscriptionModal
          isOpen={cancelOpen}
          onClose={() => setCancelOpen(false)}
          plan={subscription.plan}
          currentPeriodEnd={subscription.stripeCurrentPeriodEnd}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  )
}
