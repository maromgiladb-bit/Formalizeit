'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { Pricing } from '@/components/ui/pricing'
import { CheckoutModal } from '@/components/billing/CheckoutModal'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09 } },
}

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

export default function Plans() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  function handleProUpgrade(isMonthly: boolean) {
    setBillingCycle(isMonthly ? 'monthly' : 'annual')
    setCheckoutOpen(true)
  }

  const pricingPlansWithActions = pricingPlans.map(plan =>
    plan.name === 'Pro' ? { ...plan, onClickAction: handleProUpgrade } : plan
  )

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Header + Pricing */}
      <section className="bg-white pt-8 pb-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-0"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Pricing</motion.p>
            <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Choose Your Plan</motion.h1>
            <motion.p variants={fadeUp} className="text-sm text-gray-500 leading-relaxed mt-1 max-w-lg">
              Start free, upgrade when you need more. All plans include secure e-signatures.
            </motion.p>
          </motion.div>
        </div>

        <div className="-mb-12">
          <Pricing
            plans={pricingPlansWithActions}
            title=""
            description=""
          />
        </div>
      </section>

      {/* All Plans Include */}
      <section className="border-t border-gray-100 bg-white pt-6 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="mb-5"
          >
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Included</p>
            <h2 className="text-2xl font-bold text-gray-900">All Plans Include</h2>
            <p className="text-sm text-gray-500 mt-1">Core features available in every plan</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            {coreFeatures.map((feature) => (
              <motion.div
                key={feature}
                variants={fadeUp}
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200"
              >
                <div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center mb-3 transition-colors duration-200">
                  <Check className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{feature}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900">Still have questions?</h2>
              <p className="text-sm text-gray-500">Our team is here to help you choose the right plan.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm cursor-pointer"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        billingCycle={billingCycle}
      />
    </div>
  )
}
