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
      "1 team member",
      "Basic templates",
      "E-signature support",
      "Email support",
      "7-day document storage",
    ],
    description: "Perfect for trying out Formalize It",
    buttonText: "Get Started Free",
    href: "/dashboard",
    isPopular: false,
  },
  {
    name: "Pro",
    price: "20",
    yearlyPrice: "16",
    period: "month",
    features: [
      "25 NDAs per quarter",
      "Up to 10 team members",
      "All professional templates",
      "E-signature support",
      "Priority support",
      "Advanced tracking & audit trail",
      "Custom branding",
      "Bidirectional editing",
    ],
    description: "Most popular for growing teams",
    buttonText: "Upgrade to Pro",
    href: "/dashboard",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    yearlyPrice: "Custom",
    period: "",
    features: [
      "Unlimited everything",
      "Custom templates",
      "Dedicated account manager",
      "API access",
      "SSO authentication",
      "Custom integrations",
      "SLA agreement",
      "On-premise option",
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

  function handleProUpgrade(isMonthly: boolean) {
    setBillingCycle(isMonthly ? 'monthly' : 'annual')
    setCheckoutOpen(true)
  }

  const plans = pricingPlans.map(plan => {
    if (plan.name === 'Pro') {
      // Signed-out users can't check out — send them through sign-up instead.
      return userId
        ? { ...plan, onClickAction: handleProUpgrade }
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
      />
    </div>
  )
}
