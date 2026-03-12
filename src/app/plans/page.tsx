'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check, CreditCard } from 'lucide-react'
import { Pricing } from '@/components/ui/pricing'
import PageHero from '@/components/ui/page-hero'

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    yearlyPrice: "0",
    period: "month",
    features: [
      "Up to 3 NDAs",
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
      "Unlimited NDAs",
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
];

export default function Plans() {
  const [mounted, setMounted] = useState(false)
  const faqRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-element')
        }
      })
    }, observerOptions)

    if (faqRef.current) observer.observe(faqRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        icon={CreditCard}
        title="Choose Your Plan"
        subtitle="Start free, upgrade when you need more. All plans include secure e-signatures."
      />

      {/* Pricing Component */}
      <div className="bg-gray-50">
        <Pricing
          plans={pricingPlans}
          title=""
          description=""
        />
      </div>

      {/* Features Comparison */}
      <div ref={faqRef} className="pt-0 pb-10 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              All Plans Include
            </h2>
            <p className="text-gray-600">
              Core features available in every plan
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Secure Storage</h3>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">E-Signatures</h3>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Status Tracking</h3>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Mobile Access</h3>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Our team is here to help you choose the right plan for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all duration-200"
            >
              Contact Sales
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
