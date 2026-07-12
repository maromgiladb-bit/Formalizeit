'use client'

/**
 * Self-animating product mockups for the About page.
 * Every demo animates once on viewport entry and renders its final
 * state statically under prefers-reduced-motion.
 */

import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Lock, Check, Send, ArrowRight, FileText, MessageSquare } from 'lucide-react'
import { StatusPill } from '@/components/ui/status-pill'

/* ─── Shared helpers ──────────────────────────────────────── */

const VIEWPORT = { once: true, margin: '-60px' } as const

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

/** Card chrome shared by all demos. */
function DemoCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden w-full max-w-sm ${className}`}
    >
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500">{title}</p>
      </div>
      {children}
    </div>
  )
}

/** Wrapper that runs `variants` children once on viewport entry, static when reduced motion. */
function DemoStage({
  children,
  className = '',
  stagger = 0.35,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

/** Text that types itself character by character (static under reduced motion). */
function TypedText({ text }: { text: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <span>{text}</span>
  return (
    <motion.span
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
      aria-label={text}
    >
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }}
          aria-hidden="true"
        >
          {ch}
        </motion.span>
      ))}
    </motion.span>
  )
}

/* ─── 1. Hero: locked boilerplate, live variables ─────────── */

export function HeroLockedDoc() {
  return (
    <DemoStage stagger={0.5}>
      <DemoCard title="Standard Mutual NDA — v1.0" className="mx-auto">
        <div className="p-5 space-y-3 relative">
          <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
            <Lock className="w-3 h-3 text-gray-500" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              Legal text locked
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded w-2/3" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <motion.div variants={fadeIn} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
              Party A
            </span>
            <span className="flex-1 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-md text-xs font-medium text-teal-800">
              <TypedText text="Acme Corp." />
            </span>
          </motion.div>
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-4/5" />
          <motion.div variants={fadeIn} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
              Party B
            </span>
            <span className="flex-1 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-md text-xs font-medium text-teal-800">
              <TypedText text="Initech Ltd." />
            </span>
          </motion.div>
          <div className="h-2 bg-gray-200 rounded w-full" />
          <motion.div variants={fadeIn} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
              Effective
            </span>
            <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-md text-xs font-medium text-teal-800">
              <TypedText text="July 12, 2026" />
            </span>
          </motion.div>
          <div className="h-2 bg-gray-200 rounded w-3/4" />
        </div>
      </DemoCard>
    </DemoStage>
  )
}

/* ─── 2. Problem: old way vs. new way ─────────────────────── */

const OLD_WAY_MESSAGES = [
  { fromRight: false, label: 'NDA_final_v1.docx' },
  { fromRight: true, label: 'redline v3 attached' },
  { fromRight: false, label: '"just one small change…"' },
  { fromRight: true, label: 'waiting on legal review' },
  { fromRight: false, label: '11 days later…' },
]

export function OldWayDemo() {
  return (
    <DemoStage className="p-5 space-y-2.5" stagger={0.3}>
      {OLD_WAY_MESSAGES.map((m) => (
        <motion.div
          key={m.label}
          variants={{
            hidden: { opacity: 0, x: m.fromRight ? 24 : -24 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
          }}
          className={`flex ${m.fromRight ? 'justify-end' : 'justify-start'}`}
        >
          <span className="inline-block max-w-[75%] rounded-xl bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
            {m.label}
          </span>
        </motion.div>
      ))}
    </DemoStage>
  )
}

export function NewWayDemo() {
  return (
    <DemoStage className="p-5 flex flex-col items-center justify-center gap-4 min-h-[180px]" stagger={0.45}>
      <div className="flex items-center gap-3">
        <motion.div
          variants={fadeIn}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200"
        >
          <FileText className="w-5 h-5 text-teal-700" aria-hidden="true" />
        </motion.div>
        <motion.div variants={fadeIn}>
          <ArrowRight className="w-5 h-5 text-teal-700" aria-hidden="true" />
        </motion.div>
        <motion.div variants={fadeIn}>
          <StatusPill tone="done" label="Signed" />
        </motion.div>
      </div>
      <motion.p variants={fadeIn} className="text-xs font-medium text-teal-800 text-center">
        5 min per NDA. No legal fees, no back and forth.
      </motion.p>
    </DemoStage>
  )
}

/* ─── 3. The idea: one text, many deals ───────────────────── */

const FAN_OUT_DEALS = [
  { party: 'Initech Ltd.', date: 'Jul 12, 2026' },
  { party: 'Globex GmbH', date: 'Aug 03, 2026' },
  { party: 'Umbrella Inc.', date: 'Sep 21, 2026' },
]

export function FanOutDemo() {
  return (
    <DemoStage
      className="flex flex-col sm:flex-row items-center justify-center gap-6"
      stagger={0.3}
    >
      <motion.div variants={fadeIn} className="shrink-0">
        <div className="w-40 bg-white border border-gray-200 rounded-2xl shadow-float p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-gray-400" aria-hidden="true" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">One legal text</p>
          </div>
          <div className="h-1.5 bg-gray-200 rounded w-full" />
          <div className="h-1.5 bg-gray-200 rounded w-5/6" />
          <div className="h-1.5 bg-gray-200 rounded w-full" />
          <div className="h-1.5 bg-gray-200 rounded w-2/3" />
        </div>
      </motion.div>
      <motion.div variants={fadeIn} className="rotate-90 sm:rotate-0">
        <ArrowRight className="w-5 h-5 text-teal-700" aria-hidden="true" />
      </motion.div>
      <div className="space-y-2.5">
        {FAN_OUT_DEALS.map((deal) => (
          <motion.div
            key={deal.party}
            variants={fadeIn}
            className="flex items-center gap-3 w-56 bg-white border border-gray-200 rounded-xl shadow-card px-3.5 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{deal.party}</p>
              <p className="text-[10px] text-gray-400">{deal.date}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
              <Check className="w-2.5 h-2.5" aria-hidden="true" />
              Standard
            </span>
          </motion.div>
        ))}
      </div>
    </DemoStage>
  )
}

/* ─── 4. Timeline mockups ─────────────────────────────────── */

export function ReadOnceMockup() {
  const reduce = useReducedMotion()
  return (
    <DemoStage stagger={0.6}>
      <DemoCard title="Standard Mutual NDA — v1.0">
        <div className="p-5 space-y-3">
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />
          <div className="pt-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Reading progress
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-700 rounded-full origin-left"
                initial={{ scaleX: reduce ? 1 : 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
              />
            </div>
          </div>
          <motion.div variants={fadeIn} className="flex items-center gap-2 pt-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700">
              <Check className="w-3 h-3 text-white" aria-hidden="true" />
            </span>
            <p className="text-xs font-medium text-ink">
              Reviewed — you won&apos;t need to do this again.
            </p>
          </motion.div>
        </div>
      </DemoCard>
    </DemoStage>
  )
}

const FILL_FIELDS = [
  { label: 'Counterparty', value: 'Initech Ltd.' },
  { label: 'Effective date', value: 'July 12, 2026' },
  { label: 'Purpose', value: 'Partnership discussions' },
]

export function TypingFillMockup() {
  return (
    <DemoStage stagger={0.7}>
      <DemoCard title="Fill in what's different">
        <div className="p-5 space-y-4">
          {FILL_FIELDS.map((field) => (
            <motion.div key={field.label} variants={fadeIn}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {field.label}
              </p>
              <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg min-h-[34px]">
                <span className="text-sm text-teal-800 font-medium">
                  <TypedText text={field.value} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </DemoCard>
    </DemoStage>
  )
}

export function CollaborateSendMockup() {
  return (
    <DemoStage stagger={0.55}>
      <DemoCard title="Collaborate & send">
        <div className="p-5 space-y-4">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
            }}
            className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50">
              <span className="text-[10px] font-bold text-teal-700">DK</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                Dana K. <MessageSquare className="w-3 h-3 text-gray-400" aria-hidden="true" />
              </p>
              <p className="text-xs text-gray-500">Purpose looks right — good to send.</p>
            </div>
          </motion.div>
          <motion.div variants={fadeIn} className="flex items-center justify-center gap-2.5">
            <StatusPill tone="neutral" label="Draft" />
            <ArrowRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
            <StatusPill tone="progress" label="Sent" />
          </motion.div>
          <motion.div variants={fadeIn}>
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-800 text-white rounded-xl text-sm font-semibold">
              <Send className="w-4 h-4" aria-hidden="true" />
              Send secure link
            </div>
          </motion.div>
        </div>
      </DemoCard>
    </DemoStage>
  )
}

const AUDIT_ROWS = ['mary@initech.com', '2026-07-12 14:02 UTC', 'SHA-256 · 9f2a…c41d']

export function SignedTrackedMockup() {
  const reduce = useReducedMotion()
  return (
    <DemoStage stagger={0.45}>
      <DemoCard title="Signed & tracked">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-teal-700" aria-hidden="true">
              <motion.path
                d="M4 12.5l5 5L20 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              />
            </svg>
            <StatusPill tone="done" label="Signed" />
          </div>
          <div className="space-y-2">
            {AUDIT_ROWS.map((row) => (
              <motion.div
                key={row}
                variants={fadeIn}
                className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5"
              >
                <Check className="w-3 h-3 text-teal-700 shrink-0" aria-hidden="true" />
                <span className="text-xs text-gray-500 font-mono truncate">{row}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </DemoCard>
    </DemoStage>
  )
}
