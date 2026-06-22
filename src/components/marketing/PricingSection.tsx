'use client'

import { useState } from 'react'
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
    price: "19",
    yearlyPrice: "15",
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
    price: "75",
    yearlyPrice: "60",
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
  {
    name: "Enterprise",
    price: "Custom",
    yearlyPrice: "Custom",
    period: "",
    features: [
      "SSO",
      "Legal approval workflow",
      "Private NDA standard",
      "Compliance requirements",
      "CRM integrations",
      "Custom API",
    ],
    description: "For large organizations with specific needs",
    buttonText: "Contact Sales",
    href: "/contact",
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

  function openCheckout(plan: 'PRO' | 'TEAM', isMonthly: boolean) {
    setCheckoutPlan(plan)
    setBillingCycle(isMonthly ? 'monthly' : 'annual')
    setCheckoutOpen(true)
  }

  const plans = pricingPlans.map(plan => {
    if (plan.name === 'Pro' || plan.name === 'Team') {
      const planKey = plan.name === 'Team' ? 'TEAM' : 'PRO'
      // Signed-out users can't check out — send them through sign-up instead.
      return userId
        ? { ...plan, onClickAction: (isMonthly: boolean) => openCheckout(planKey, isMonthly) }
        : { ...plan, href: '/signup' }
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
