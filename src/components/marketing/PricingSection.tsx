'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import { Pricing } from '@/components/ui/pricing'
import { CheckoutModal } from '@/components/billing/CheckoutModal'
import { Reveal } from '@/components/ui/reveal'

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    yearlyPrice: "0",
    period: "month",
    features: [
      "Up to 3 NDAs total",
      "Send, review & e-sign NDAs",
      "Receive & sign NDAs free (no account needed)",
      "Basic dashboard & counterparty management",
      "5-year document storage",
    ],
    description: "Send your first NDA in 30 seconds",
    buttonText: "Get Started Free",
    href: "/dashboard",
    isPopular: false,
  },
  {
    name: "Pro",
    price: "9",
    yearlyPrice: "7.65",
    period: "month",
    features: [
      "Unlimited NDA generation",
      "NDA dashboard & search",
      "Full audit trail",
    ],
    description: "For consultants, freelancers & founders",
    buttonText: "Upgrade to Pro",
    href: "/dashboard",
    isPopular: true,
  },
  {
    name: "Team",
    price: "50",
    yearlyPrice: "42.50",
    period: "month",
    features: [
      "Everything in Pro",
      "Up to 10 users",
      "Shared workspace & team dashboard",
      "Centralized NDA repository",
      "Role-based permissions",
    ],
    description: "For VC firms, accelerators & SMBs",
    buttonText: "Upgrade to Team",
    href: "/dashboard",
    isPopular: false,
  },
]

const coreFeatures = [
  "Secure Storage",
  "E-Signatures",
  "Status Tracking",
  "Mobile Access",
]

/**
 * The pricing block embedded on the home page at /#pricing.
 * Signed-out visitors are routed to sign-up; signed-in users get the
 * Stripe checkout modal in place.
 */
export default function PricingSection() {
  const { userId } = useAuth()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [checkoutPlan, setCheckoutPlan] = useState<'PRO' | 'TEAM'>('PRO')
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch('/api/user/check-limit')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.plan) setCurrentPlan(data.plan) })
      .catch(() => {})
  }, [userId])

  function openCheckout(plan: 'PRO' | 'TEAM', isMonthly: boolean) {
    setCheckoutPlan(plan)
    setBillingCycle(isMonthly ? 'monthly' : 'annual')
    setCheckoutOpen(true)
  }

  async function handleUpgradeToTeam(isMonthly: boolean) {
    setUpgradeLoading(true)
    try {
      const res = await fetch('/api/billing/upgrade-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle: isMonthly ? 'monthly' : 'annual' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // fallback: just open the checkout for the case where something goes wrong
      openCheckout('TEAM', isMonthly)
    } finally {
      setUpgradeLoading(false)
    }
  }

  const plans = pricingPlans.map(plan => {
    if (plan.name === 'Pro') {
      if (!userId) return { ...plan, href: '/signup' }
      if (currentPlan === 'PRO') return { ...plan, buttonText: 'Current plan', href: '/settings/billing' }
      if (currentPlan === 'TEAM') return { ...plan, buttonText: 'Manage plan', href: '/settings/billing' }
      return { ...plan, onClickAction: (isMonthly: boolean) => openCheckout('PRO', isMonthly) }
    }
    if (plan.name === 'Team') {
      if (!userId) return { ...plan, href: '/signup' }
      if (currentPlan === 'TEAM') return { ...plan, buttonText: 'Current plan', href: '/settings/billing' }
      if (currentPlan === 'PRO') return {
        ...plan,
        buttonText: upgradeLoading ? 'Redirecting…' : 'Upgrade to Team',
        onClickAction: handleUpgradeToTeam,
      }
      return { ...plan, onClickAction: (isMonthly: boolean) => openCheckout('TEAM', isMonthly) }
    }
    if (plan.name === 'Free' && !userId) {
      return { ...plan, href: '/signup' }
    }
    return plan
  })

  return (
    <div>
      <Reveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">Pricing</p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
          Simple, honest pricing
        </h2>
        <p className="text-base text-gray-500 leading-relaxed mt-3 max-w-xl mx-auto">
          Start free — no credit card, no setup. Upgrade when your team needs
          more NDAs or members.
        </p>
      </Reveal>

      <Pricing plans={plans} title="" description="" />

      <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {coreFeatures.map((feature) => (
            <span key={feature} className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Check className="w-4 h-4 text-teal-700" />
              {feature}
            </span>
          ))}
        </div>
      </Reveal>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        billingCycle={billingCycle}
        plan={checkoutPlan}
      />
    </div>
  )
}
