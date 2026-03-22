'use client'

import { useEffect, useRef } from 'react'
import TestimonialsSection from '@/components/ui/testimonials'
import { FeatureSteps } from '@/components/ui/feature-section'

export default function About() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll('.fade-in-element')
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <h1 className="text-6xl font-bold mb-6 animate-fade-in">About Formalize It</h1>
          <p className="text-2xl text-gray-200 max-w-3xl leading-relaxed animate-fade-in-delay">
            We make NDAs fast, clear, and collaborative. No more email ping-pong,
            version confusion, or formatting drama.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Why We Built It - Feature Steps */}
        <section className="mb-32 fade-in-element opacity-0 -mx-4 sm:-mx-6 lg:-mx-8">
          <FeatureSteps
            features={[
              {
                step: 'Step 1',
                title: 'Save Time',
                content: 'Create professional NDAs in minutes, not hours. Auto-fill company details, use proven templates, and skip the repetitive formatting work.',
                image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop'
              },
              {
                step: 'Step 2',
                title: 'Live Preview',
                content: 'See exactly what your NDA looks like as you fill it out. No surprises — what you see is what you get in the final PDF.',
                image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop'
              },
              {
                step: 'Step 3',
                title: 'Easy Communication',
                content: 'Share a secure link with the other party. They can review, suggest changes, and sign — all without creating an account or email ping-pong.',
                image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop'
              },
            ]}
            title="Making NDA's Simple"
            autoPlayInterval={5000}
          />
        </section>

        {/* How It Works - Streamlined */}
        <section className="mb-32 fade-in-element opacity-0">
          <h2 className="text-5xl font-bold text-teal-600 mb-16 text-center">How it works</h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                1
              </div>
              <div className="flex-1 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Fill your template</h3>
                <p className="text-gray-600 text-lg">Choose from lawyer-approved templates. Your company details auto-fill instantly.</p>
              </div>
            </div>

            <div className="flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                2
              </div>
              <div className="flex-1 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Share & collaborate</h3>
                <p className="text-gray-600 text-lg">Send a secure link. They review, suggest changes, and comment—no account required.</p>
              </div>
            </div>

            <div className="flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                3
              </div>
              <div className="flex-1 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Track changes clearly</h3>
                <p className="text-gray-600 text-lg">Every edit is highlighted and visible. No mystery diffs or hidden redlines.</p>
              </div>
            </div>

            <div className="flex items-start gap-6 group hover:translate-x-2 transition-transform duration-300">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                4
              </div>
              <div className="flex-1 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Export & sign</h3>
                <p className="text-gray-600 text-lg">One click for a pixel-perfect PDF that matches the preview exactly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Is It For */}
        <section className="mb-32 fade-in-element opacity-0">
          <h2 className="text-5xl font-bold text-teal-600 mb-16 text-center">Who it&apos;s for</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 border border-teal-200 h-full">
                <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Founders</h3>
                <p className="text-gray-700 text-lg">Who need NDAs signed quickly to unblock deals.</p>
              </div>
            </div>

            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200 h-full">
                <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Legal Teams</h3>
                <p className="text-gray-700 text-lg">Who want consistent templates and audit trails.</p>
              </div>
            </div>

            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 h-full">
                <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Agencies</h3>
                <p className="text-gray-700 text-lg">Who send many NDAs and can&apos;t afford errors.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-32 fade-in-element opacity-0 -mx-4 sm:-mx-6 lg:-mx-8">
          <TestimonialsSection />
        </section>

        {/* CTA */}
        <section className="fade-in-element opacity-0">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl py-20 px-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-6">Ready to streamline your NDAs?</h2>
              <p className="text-xl text-teal-50 mb-10 max-w-2xl mx-auto">
                Join teams who make NDAs the fastest step in their deal flow.
              </p>
              <a href="/signup">
                <button className="bg-white text-teal-600 px-10 py-5 rounded-xl font-semibold text-xl hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-xl">
                  Get Started Free
                </button>
              </a>
            </div>
          </div>
        </section>
      </div>

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

        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in-delay {
          animation: fadeInUp 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  )
}
