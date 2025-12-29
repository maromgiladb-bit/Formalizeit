'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Pricing } from '@/components/ui/pricing'

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
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        .fade-in-element {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .opacity-0 {
          opacity: 0;
        }

        .delay-100 { animation-delay: 0.1s; }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          {mounted && (
            <>
              <h1 className="text-5xl sm:text-6xl font-bold mb-4 animate-fade-in-up">
                Choose Your Plan
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up delay-100">
                Start free, upgrade when you need more. All plans include secure e-signatures.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Pricing Component */}
      <div className="bg-gray-50 -mt-8">
        <Pricing
          plans={pricingPlans}
          title=""
          description=""
        />
      </div>

      {/* Features Comparison */}
      <div ref={faqRef} className="opacity-0 py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
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
