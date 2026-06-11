'use client'

import { useRef } from 'react'
import { SignUpButton } from '@clerk/nextjs'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import TestimonialsSection from '@/components/ui/testimonials'
import { FeatureSteps } from '@/components/ui/feature-section'
import {
  FileText,
  PenLine,
  ScanSearch,
  Send,
  ArrowRight,
  Check,
} from 'lucide-react'

/* ─── Mockup components ───────────────────────────────────── */

function TemplateMockup() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full max-w-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500">Select a Template</p>
      </div>
      <div className="p-4 space-y-2">
        {[
          { name: 'Mutual NDA', tag: 'Most common', active: true },
          { name: 'One-way NDA', tag: 'Vendor use', active: false },
          { name: 'Employee NDA', tag: 'HR', active: false },
        ].map((t) => (
          <div
            key={t.name}
            className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
              t.active ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-4 h-4 ${t.active ? 'text-teal-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${t.active ? 'text-teal-800' : 'text-gray-700'}`}>
                {t.name}
              </span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.active ? 'bg-teal-200 text-teal-800' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VariablesMockup() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full max-w-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500">Fill in the Details</p>
      </div>
      <div className="p-5 space-y-4">
        {[
          { label: 'Disclosing Party', value: 'Acme Corp.' },
          { label: 'Receiving Party', value: 'Initech Ltd.' },
          { label: 'Effective Date', value: 'March 29, 2026' },
          { label: 'Duration', value: '2 years' },
        ].map((field) => (
          <div key={field.label}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {field.label}
            </p>
            <div className="flex items-center px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
              <span className="text-sm text-teal-800 font-medium">{field.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewMockup() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <div className="text-xs font-semibold text-gray-400">NDA_Agreement.docx</div>
          <div className="w-12" />
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="h-3 bg-gray-800 rounded w-2/3 mb-5" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <div className="flex items-center gap-2 rounded-md bg-teal-50 border border-teal-200 px-3 py-2">
            <div className="h-2 bg-teal-400 rounded w-1/3" />
            <div className="h-2 bg-teal-200 rounded flex-1" />
          </div>
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />
          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <div className="h-2 bg-amber-400 rounded w-2/5" />
            <div className="h-2 bg-amber-200 rounded flex-1" />
          </div>
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
      <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 w-44">
        <p className="text-xs font-semibold text-gray-800 leading-snug">Review only the changes:</p>
        <p className="text-xs text-teal-600 font-medium mt-0.5">Variables &amp; Custom Clauses</p>
      </div>
    </div>
  )
}

function SignMockup() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full max-w-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500">Ready to Send</p>
      </div>
      <div className="p-5 space-y-4">
        {[
          { initials: 'JD', name: 'John Doe', email: 'john@acmecorp.com', signed: true },
          { initials: 'MS', name: 'Mary Smith', email: 'mary@initech.com', signed: false },
        ].map((person) => (
          <div
            key={person.email}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                person.signed ? 'bg-teal-100' : 'bg-blue-100'
              }`}
            >
              <span className={`text-xs font-bold ${person.signed ? 'text-teal-700' : 'text-blue-700'}`}>
                {person.initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">{person.name}</p>
              <p className="text-xs text-gray-400 truncate">{person.email}</p>
            </div>
            {person.signed ? (
              <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            )}
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-800 text-white rounded-lg text-sm font-semibold">
          <Send className="w-4 h-4" />
          Send for Signature
        </button>
      </div>
    </div>
  )
}

/* ─── Timeline data ───────────────────────────────────────── */
const TIMELINE_STEPS = [
  {
    number: '01',
    title: 'Choose a Trusted Template',
    description:
      'Select from industry-standard, pre-vetted NDA templates built for your situation. No blank page, no guesswork — start from something that already works.',
    icon: FileText,
    mockupKey: 'template',
  },
  {
    number: '02',
    title: 'Fill the Variables',
    description:
      'Customize key details like company names, dates, and terms using smart fields. Your context, applied cleanly to a proven structure.',
    icon: PenLine,
    mockupKey: 'variables',
  },
  {
    number: '03',
    title: 'Review only the Changes',
    description:
      'The platform surfaces deviations from the standard. Focus your attention exactly where it matters — skip the boilerplate you already trust.',
    icon: ScanSearch,
    mockupKey: 'review',
  },
  {
    number: '04',
    title: 'Send & Sign',
    description:
      'Route for internal approval, send to the counterparty, and collect legally binding signatures — all in one place, with full audit trail.',
    icon: Send,
    mockupKey: 'sign',
  },
]

/* ─── Mockup renderer ─────────────────────────────────────── */
function StepMockup({ mockupKey }: { mockupKey: string }) {
  if (mockupKey === 'template') return <TemplateMockup />
  if (mockupKey === 'variables') return <VariablesMockup />
  if (mockupKey === 'review') return <ReviewMockup />
  if (mockupKey === 'sign') return <SignMockup />
  return null
}

/* ─── Timeline step ───────────────────────────────────────── */
function TimelineStep({
  step,
  index,
}: {
  step: (typeof TIMELINE_STEPS)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const isEven = index % 2 === 0

  return (
    <div ref={ref} className="relative mb-14 lg:mb-20 last:mb-0">
      {/* Circle node */}
      <motion.div
        className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-0 z-10 w-12 h-12 rounded-full bg-teal-800 border-4 border-white shadow-md flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, type: 'spring', stiffness: 220, damping: 18 }}
      >
        <step.icon className="w-5 h-5 text-white" />
      </motion.div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden pl-20 pt-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-1">{step.number}</p>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{step.description}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StepMockup mockupKey={step.mockupKey} />
        </motion.div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:grid grid-cols-2 gap-16 items-center min-h-[240px]">
        {/* Left column */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0, x: -48 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
        >
          {isEven ? (
            <div className="max-w-xs pr-12 text-right">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">{step.number}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ) : (
            <div className="pr-12">
              <StepMockup mockupKey={step.mockupKey} />
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <motion.div
          className="flex justify-start"
          initial={{ opacity: 0, x: 48 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
        >
          {isEven ? (
            <div className="pl-12">
              <StepMockup mockupKey={step.mockupKey} />
            </div>
          ) : (
            <div className="max-w-xs pl-12">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">{step.number}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function About() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 75%', 'end 25%'],
  })
  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
            Send an NDA in minutes.
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            No blank page, no email ping-pong, no formatting drama.
            Pick a trusted template, fill in what&apos;s different, and send —
            done before the meeting ends.
          </p>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          TIMELINE
      ══════════════════════════════════════════════ */}
      <section className="border-t border-gray-100 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
              The process
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              From blank to signed
            </h2>
          </motion.div>

          {/* Timeline container with scroll-driven line */}
          <div ref={timelineRef} className="relative">
            {/* Track (faint background line) */}
            <div className="absolute left-6 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-px bg-gray-100" />

            {/* Animated progress line */}
            <motion.div
              className="absolute left-6 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-px bg-teal-600 origin-top"
              style={{ scaleY: lineScaleY }}
            />

            {/* Steps */}
            <div className="relative">
              {TIMELINE_STEPS.map((step, i) => (
                <TimelineStep key={i} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURE STEPS
      ══════════════════════════════════════════════ */}
      <section className="border-t border-gray-100">
        <FeatureSteps
          features={[
            {
              step: 'Step 1',
              title: 'Save Time',
              content:
                'Create professional NDAs in minutes, not hours. Auto-fill company details, use proven templates, and skip the repetitive formatting work.',
              image:
                'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop',
            },
            {
              step: 'Step 2',
              title: 'Live Preview',
              content:
                'See exactly what your NDA looks like as you fill it out. No surprises — what you see is what you get in the final PDF.',
              image:
                'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop',
            },
            {
              step: 'Step 3',
              title: 'Easy Communication',
              content:
                'Share a secure link with the other party. They can review, suggest changes, and sign — all without creating an account or email ping-pong.',
              image:
                'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop',
            },
          ]}
          title="Making NDAs Simple"
          autoPlayInterval={5000}
        />
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className="border-t border-gray-100">
        <TestimonialsSection />
      </section>

{/* ══════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════ */}
      <section className="border-t border-gray-100 bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Send your first NDA in minutes.
              </h2>
              <p className="text-sm text-gray-500">
                No setup friction. Start from a trusted template and go.
              </p>
            </div>
            <SignUpButton mode="modal">
              <button className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

    </div>
  )
}
