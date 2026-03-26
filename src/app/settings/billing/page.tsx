'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SubscriptionInfo {
    plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'DEVELOPER'
    ndaCount: number
    limit: number | null
    remaining: number | null
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
            case 'DEVELOPER': return 'Developer'
            default: return plan
        }
    }

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'FREE': return 'bg-gray-100 text-gray-800'
            case 'PRO': return 'bg-teal-100 text-teal-800'
            case 'ENTERPRISE': return 'bg-slate-100 text-slate-800'
            case 'DEVELOPER': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPlanPrice = (plan: string) => {
        switch (plan) {
            case 'FREE': return '$0/month'
            case 'PRO': return '$19.99/month'
            case 'ENTERPRISE': return 'Custom pricing'
            case 'DEVELOPER': return 'Complimentary'
            default: return 'N/A'
        }
    }

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription & Billing</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Manage your plan and billing details
                </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ) : subscription ? (
                    <div className="space-y-8">
                        {/* Current Plan Card */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Plan</h4>
                                    <div className="mt-1 flex items-center gap-3">
                                        <span className="text-2xl font-bold text-gray-900">{getPlanDisplayName(subscription.plan)}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(subscription.plan)}`}>
                                            {subscription.plan === 'FREE' ? 'Active' : 'Active'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-500">Price</p>
                                    <p className="text-xl font-bold text-gray-900">{getPlanPrice(subscription.plan)}</p>
                                </div>
                            </div>

                            {/* Usage Bar for Free Plan */}
                            {subscription.plan === 'FREE' && subscription.limit && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">Usage</span>
                                        <span className="text-gray-500">{subscription.ndaCount} / {subscription.limit} NDAs created</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${subscription.remaining === 0 ? 'bg-red-500' : 'bg-teal-500'
                                                }`}
                                            style={{ width: `${Math.min((subscription.ndaCount / subscription.limit) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {subscription.remaining === 0
                                            ? "You've reached your limit."
                                            : `${subscription.remaining} NDAs remaining this month.`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Billing Details */}
                        <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h4>
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <dl className="divide-y divide-gray-200">
                                    <div className="px-6 py-4 grid grid-cols-3 gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Billing Cycle</dt>
                                        <dd className="text-sm text-gray-900 col-span-2 sm:mt-0">
                                            {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'None' : 'Monthly'}
                                        </dd>
                                    </div>
                                    <div className="px-6 py-4 grid grid-cols-3 gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Next Billing Date</dt>
                                        <dd className="text-sm text-gray-900 col-span-2 sm:mt-0">
                                            {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'N/A' :
                                                new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}
                                        </dd>
                                    </div>
                                    <div className="px-6 py-4 grid grid-cols-3 gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                                        <dd className="text-sm text-gray-900 col-span-2 sm:mt-0">
                                            {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'None' : '•••• 4242'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                            {subscription.plan === 'FREE' ? (
                                <Link
                                    href="/plans"
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                >
                                    Upgrade Now
                                </Link>
                            ) : (
                                <button disabled className="px-6 py-3 border border-gray-300 rounded-md text-gray-400 font-medium cursor-not-allowed bg-gray-50">
                                    Current Plan Active
                                </button>
                            )}
                        </div>

                    </div>
                ) : (
                    <p className="text-gray-500">Unable to load subscription info.</p>
                )}
            </div>
        </div>
    )
}
