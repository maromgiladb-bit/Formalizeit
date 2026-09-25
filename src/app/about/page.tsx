'use client'

import { useRef } from 'react'
import { SignUpButton } from '@clerk/nextjs'
import { motion, useScroll, useTransform, useInView, useReducedMotion } from 'framer-motion'
import { BookOpenCheck, PenLine, Users, ShieldCheck, ArrowRight } from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal'
import { Button } from '@/components/ui/button'
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer'
import {
  HeroLockedDoc,
  OldWayDemo,
  NewWayDemo,
  FanOutDemo,
  ReadOnceMockup,
  TypingFillMockup,
  CollaborateSendMockup,
  SignedTrackedMockup,
} from './demos'

/* ─── How-it-works timeline ───────────────────────────────── */

const TIMELINE_STEPS = [
  {
    number: '01',
    title: 'Read the standard once',
    description:
      'One balanced mutual NDA — the same legal text for every deal. You or your lawyer review it a single time, and that review holds forever.',
    icon: BookOpenCheck,
    Mockup: ReadOnceMockup,
  },
  {
    number: '02',
    title: "Fill only what's different",
    description:
      'The legal terms stay fixed. You fill in the variable fields — parties, purpose, term, effective date — and skip the boilerplate you already trust.',
    icon: PenLine,
    Mockup: TypingFillMockup,
  },
  {
    number: '03',
    title: 'Collaborate & send',
    description:
      'Teammates draft, comment, and send without waiting on a gatekeeper. The counterparty gets a secure link — no account needed.',
    icon: Users,
    Mockup: CollaborateSendMockup,
  },
  {
    number: '04',
    title: 'Signed, sealed, tracked',
    description:
      'Signed with a full audit trail — signer email, timestamp, and an agreement hash recorded on every executed NDA.',
    icon: ShieldCheck,
    Mockup: SignedTrackedMockup,
  },
]

function TimelineStep({ step, index }: { step: (typeof TIMELINE_STEPS)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const isInView = reduceMotion || inView
  const isEven = index % 2 === 0
  const Mockup = step.Mockup

  const textBlock = (align: 'left' | 'right') => (
    <div className={`max-w-xs ${align === 'right' ? 'pr-12 text-right' : 'pl-12'}`}>
      <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">{step.number}</p>
      <h3 className="text-2xl font-extrabold text-ink mb-3">{step.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
    </div>
  )

  return (
    <div ref={ref} className="relative mb-14 lg:mb-20 last:mb-0">
      {/* Circle node */}
      <motion.div
        className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-0 z-10 w-12 h-12 rounded-full bg-teal-800 border-4 border-white shadow-card flex items-center justify-center"
        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, type: 'spring', stiffness: 220, damping: 18 }}
      >
        <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
      </motion.div>

      {/* Mobile */}
      <div className="lg:hidden pl-20 pt-1">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-1">{step.number}</p>
          <h3 className="text-xl font-extrabold text-ink mb-2">{step.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{step.description}</p>
        </motion.div>
        <Mockup />
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-2 gap-16 items-center min-h-[240px]">
        <motion.div
          className="flex justify-end"
          initial={reduceMotion ? false : { opacity: 0, x: -48 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
        >
          {isEven ? textBlock('right') : <div className="pr-12"><Mockup /></div>}
        </motion.div>
        <motion.div
          className="flex justify-start"
          initial={reduceMotion ? false : { opacity: 0, x: 48 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
        >
          {isEven ? <div className="pl-12"><Mockup /></div> : textBlock('left')}
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Trust + team cards data ─────────────────────────────── */

const TRUST_CARDS = [
  {
    title: 'Known standard',
    body: "When someone sends you an NDA from this platform, you know exactly what you're signing — the same balanced text, every time.",
  },
  {
    title: 'Evidence built in',
    body: 'Every executed NDA records the signer, timestamp, template version, and an agreement hash — a full audit trail with e-signature.',
  },
  {
    title: 'Secure by default',
    body: 'Signed documents are stored encrypted and retained for five years from execution, with advance notice before any deletion.',
  },
]

const TEAM_CARDS = [
  {
    title: 'One company, one template',
    body: 'NDAs belong to your company, not a single inbox. Everyone works from the same standard, so every NDA that goes out reads the same way.',
  },
  {
    title: 'Everyone contributes',
    body: 'Contributors can draft, comment, and send NDAs for review or signature — everything except signing. No bottlenecks, no gatekeeper.',
  },
  {
    title: 'Signers sign',
    body: "Only designated signers apply the company's signature — one clear point of accountability on every executed NDA.",
  },
]

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
      {/* ── 1. HERO ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <Reveal className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
            About FormalizeIt
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink leading-tight tracking-tight mb-4">
            Review once, reuse forever.
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            Stop re-reading NDAs. Approve one fair NDA once, then reuse it safely for
            every deal — NDA in minutes.
          </p>
        </Reveal>
        <div className="flex justify-center">
          <HeroLockedDoc />
        </div>
      </section>

      {/* ── 2. THE PROBLEM ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
              The problem
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mb-4">
              NDAs are repetitive, low-value to negotiate — and they still waste
              everyone&apos;s time.
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              The legal text barely changes between deals, yet every NDA restarts the
              same review loop.
            </p>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <RevealItem>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-card h-full">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    The old way
                  </p>
                </div>
                <OldWayDemo />
              </div>
            </RevealItem>
            <RevealItem>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-card h-full">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                    With FormalizeIt
                  </p>
                </div>
                <NewWayDemo />
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── 3. THE IDEA ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
              One standard
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mb-4">
              One NDA. One legal text. Infinite deals.
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              Fair by design — a single balanced mutual NDA that both sides can trust.
              Not &quot;pro-discloser&quot; or &quot;pro-recipient,&quot; and never customized to sneak in
              weird terms.
            </p>
          </Reveal>
          <Reveal>
            <FanOutDemo />
          </Reveal>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8 text-center">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
              From standard to signed
            </h2>
          </Reveal>

          <div ref={timelineRef} className="relative">
            <div className="absolute left-6 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-px bg-gray-200" />
            <motion.div
              className="absolute left-6 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-px bg-teal-700 origin-top motion-reduce:hidden"
              style={{ scaleY: lineScaleY }}
            />
            <div className="relative">
              {TIMELINE_STEPS.map((step, i) => (
                <TimelineStep key={step.number} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TRUST INFRASTRUCTURE ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
              Trusted by both sides
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mb-4">
              When they recognize the standard, they sign faster.
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              A recognized standard is trust infrastructure — a basis for a frictionless
              relationship instead of legalities.
            </p>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-3 gap-6">
            {TRUST_CARDS.map((card) => (
              <RevealItem key={card.title}>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-6 h-full">
                  <h3 className="text-sm font-semibold text-ink mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="max-w-3xl mx-auto mt-8">
            <LegalDisclaimer />
          </Reveal>
        </div>
      </section>

      {/* ── 6. BUILT FOR TEAMS ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
              Built for teams
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
              Everyone moves the deal. One person signs.
            </h2>
          </Reveal>
          <RevealGroup className="grid md:grid-cols-3 gap-6">
            {TEAM_CARDS.map((card) => (
              <RevealItem key={card.title}>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-6 h-full">
                  <h3 className="text-sm font-semibold text-ink mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-extrabold text-ink mb-2">
                  Work on what&apos;s important, not on the standard legalities.
                </h2>
                <p className="text-sm text-gray-500">
                  Review the standard once. Send your first NDA in minutes.
                </p>
              </div>
              <SignUpButton mode="modal">
                <Button size="lg" className="flex-shrink-0">
                  Get Started Free
                  <ArrowRight aria-hidden="true" />
                </Button>
              </SignUpButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
