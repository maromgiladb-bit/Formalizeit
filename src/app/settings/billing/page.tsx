'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, ArrowRight, Zap } from 'lucide-react'

interface SubscriptionInfo {
    plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'DEV'
    ndaCount: number
    limit: number | null
    remaining: number | null
    draftLimitPeriod: 'total' | 'quarter'
}

export default function BillingSettingsPage() {
    const { userId } = useAuth()
    const { user } = useUser()
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSubscription() {
            try {
                const response = await fetch('/api/user/check-limit')
                if (response.ok) {
                    const data = await response.json()
                    setSubscription(data)
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error)
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchSubscription()
        }
    }, [userId])

    if (!userId) {
        redirect('/sign-in')
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

    const getPlanBadgeClass = (plan: string) => {
        switch (plan) {
            case 'FREE': return 'bg-gray-100 text-gray-700'
            case 'PRO': return 'bg-teal-100 text-teal-800'
            case 'ENTERPRISE': return 'bg-slate-100 text-slate-800'
            case 'DEV': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getPlanPrice = (plan: string) => {
        switch (plan) {
            case 'FREE': return '$0 / month'
            case 'PRO': return '$19.99 / month'
            case 'ENTERPRISE': return 'Custom pricing'
            case 'DEV': return 'Complimentary'
            default: return 'N/A'
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

            {/* Card Header */}
            <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Subscription & Billing</h3>
                        <p className="text-sm text-gray-500">Manage your plan and billing details</p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-5">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded-lg w-1/4" />
                        <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
                        <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                    </div>
                ) : subscription ? (
                    <div className="space-y-6">

                        {/* Current Plan */}
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">Current Plan</p>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                            {getPlanDisplayName(subscription.plan)}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPlanBadgeClass(subscription.plan)}`}>
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{getPlanPrice(subscription.plan)}</p>
                                </div>
                                {subscription.plan === 'FREE' && (
                                    <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-teal-700" />
                                    </div>
                                )}
                            </div>

                            {/* Usage bar — Free plan only */}
                            {subscription.plan === 'FREE' && subscription.limit && (
                                <div className="mt-5">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        <span>Usage</span>
                                        <span>{subscription.ndaCount} / {subscription.limit} NDAs</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                subscription.remaining === 0 ? 'bg-red-500' : 'bg-teal-700'
                                            }`}
                                            style={{ width: `${Math.min((subscription.ndaCount / subscription.limit) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {subscription.remaining === 0
                                            ? "You've reached your limit."
                                            : `${subscription.remaining} NDAs remaining ${subscription.draftLimitPeriod === 'quarter' ? 'this quarter' : 'in total'}.`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Billing Details */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Billing Information</p>
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <dl className="divide-y divide-gray-100">
                                    <div className="px-5 py-3.5 grid grid-cols-3 gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Billing Cycle</dt>
                                        <dd className="text-sm text-gray-900 col-span-2">
                                            {subscription.plan === 'FREE' || subscription.plan === 'DEV' ? 'None' : 'Monthly'}
                                        </dd>
                                    </div>
                                    <div className="px-5 py-3.5 grid grid-cols-3 gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                                        <dd className="text-sm text-gray-400 col-span-2 italic">
                                            {subscription.plan === 'FREE' || subscription.plan === 'DEV'
                                                ? 'None'
                                                : 'Online payment coming soon'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-gray-100">
                            {subscription.plan === 'FREE' ? (
                                <Link
                                    href="/plans"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                                >
                                    Upgrade Plan
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-400 font-semibold rounded-lg text-sm cursor-not-allowed bg-gray-50"
                                >
                                    Current Plan Active
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Unable to load subscription info.</p>
                )}
            </div>
        </div>
    )
}
