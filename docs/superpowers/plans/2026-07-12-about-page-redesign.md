# About Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/about` as a narrative scroll journey telling the reuse story ("Review once, reuse forever") with code-driven animated product demos.

**Architecture:** One client page (`src/app/about/page.tsx`, 7 sections) plus a co-located client module (`src/app/about/demos.tsx`) containing all self-animating product mockups. Scroll reveals use the shared `Reveal` primitives; demos animate once on viewport entry via framer-motion variants; the "How it works" section keeps the existing scroll-linked timeline mechanic.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, framer-motion, lucide-react, Clerk `SignUpButton`.

**Spec:** `docs/superpowers/specs/2026-07-12-about-page-redesign-design.md`. **Copy source:** `docs/brand-messaging.md`.

## Global Constraints

- Calm Precision design system (`.claude/skills/stitch-design.md`): `text-ink` headings, `text-gray-500` body, eyebrow = `text-teal-700 text-xs font-bold uppercase tracking-widest`, cards `bg-white rounded-2xl border` + `shadow-card`/`shadow-float`, sections `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8` alternating white / `bg-gray-50`.
- Color discipline: teal = new way / done; amber ONLY for genuine "needs action" (pending-signature dot); grays = old way. No blue/green/purple/yellow utility colors. Never `teal-600` on CTAs.
- Banned copy: "legally binding", "pre-vetted", "lawyer-vetted". Use "signed with a full audit trail".
- Scroll reveals ONLY via `@/components/ui/reveal`. Demos honor `useReducedMotion()` — reduced-motion users see the final state, static.
- No new dependencies. No unit tests for these components (no component-test infra in this repo — Vitest covers `src/lib` only); gates are typecheck, lint, build, and manual verification (Task 4).

---

### Task 1: Animated demo components (`demos.tsx`)

**Files:**
- Create: `src/app/about/demos.tsx`

**Interfaces:**
- Produces (all niladic React components, consumed by Task 2's page):
  `HeroLockedDoc`, `OldWayDemo`, `NewWayDemo`, `FanOutDemo`, `ReadOnceMockup`, `TypingFillMockup`, `CollaborateSendMockup`, `SignedTrackedMockup` — each `() => JSX`.
- Consumes: `StatusPill` from `@/components/ui/status-pill` (`tone: 'neutral' | 'progress' | 'action' | 'done'`, `label: string`).

- [ ] **Step 1: Write `src/app/about/demos.tsx`**

```tsx
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
  { fromRight: false, label: '“just one small change…”' },
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
      <DemoCard title="Fill in what’s different">
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (pre-existing errors elsewhere in the branch, if any, must not originate from `src/app/about/demos.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/app/about/demos.tsx
git commit -m "feat(about): add self-animating product demo components"
```

---

### Task 2: Rewrite the About page + metadata

**Files:**
- Modify (full rewrite): `src/app/about/page.tsx`
- Modify: `src/app/about/layout.tsx` (metadata description only)

**Interfaces:**
- Consumes from Task 1: `HeroLockedDoc`, `OldWayDemo`, `NewWayDemo`, `FanOutDemo`, `ReadOnceMockup`, `TypingFillMockup`, `CollaborateSendMockup`, `SignedTrackedMockup` from `./demos`.
- Consumes: `Reveal`, `RevealGroup`, `RevealItem` from `@/components/ui/reveal`; `Button` from `@/components/ui/button`; `LegalDisclaimer` from `@/components/ui/legal-disclaimer`; Clerk `SignUpButton`.

- [ ] **Step 1: Replace `src/app/about/page.tsx` with:**

```tsx
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
    title: 'Fill only what’s different',
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
    body: 'When someone sends you an NDA from this platform, you know exactly what you’re signing — the same balanced text, every time.',
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
    body: 'Only designated signers apply the company’s signature — one clear point of accountability on every executed NDA.',
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
```

- [ ] **Step 2: Update metadata in `src/app/about/layout.tsx`**

Replace the `description` line so the file reads:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — FormalizeIt',
  description:
    'Review once, reuse forever — one fair standard NDA you approve a single time, then reuse for every deal. Learn how FormalizeIt works.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` then `npm run lint`
Expected: no new errors; lint passes for `src/app/about/*`.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx src/app/about/layout.tsx
git commit -m "feat(about): rewrite as reuse-story narrative with animated demos"
```

---

### Task 3: Remove dead `FeatureSteps` component

**Files:**
- Delete: `src/components/ui/feature-section.tsx`

**Interfaces:**
- Consumes: nothing. Produces: nothing (pure removal; Task 2 removed the only import).

- [ ] **Step 1: Verify no remaining consumers**

Run: `git grep -l -e "feature-section" -e "FeatureSteps" -- src`
Expected: only `src/components/ui/feature-section.tsx` itself. If any other file appears, STOP — do not delete; report back instead.

- [ ] **Step 2: Delete and verify build**

```bash
git rm src/components/ui/feature-section.tsx
npx tsc --noEmit
```

Expected: typecheck passes.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove unused FeatureSteps component (Unsplash imagery)"
```

---

### Task 4: Manual verification + Formi audit

**Files:**
- Read-only: `src/ai/prompts/formi_systemPrompt.ts`

- [ ] **Step 1: Formi audit**

Open `src/ai/prompts/formi_systemPrompt.ts` and search `PRODUCT_KNOWLEDGE` for any description of the About page or old About copy (pre-verified: no `/about` route reference exists). If the new page introduces nothing Formi must know beyond existing facts (roles, workflow, one standard NDA — all already covered), make no change. If a stale claim is found, fix it and commit `docs(formi): sync about-page knowledge`.

- [ ] **Step 2: Drive the page**

Run: `npm run dev`, open `http://localhost:3000/about` and verify:
- Desktop: all 7 sections render; hero fields type themselves; old-way bubbles stagger in; fan-out deals appear; timeline progress line fills on scroll; each timeline mockup animates once; signature check draws; CTA opens the Clerk sign-up modal.
- 375 px viewport: no horizontal scroll; demos legible; timeline stacks (nodes on the left).
- OS reduced-motion enabled (Windows: Settings → Accessibility → Visual effects → Animation effects off): page shows final states with no animation, including the timeline progress line (hidden) and typed text (fully rendered).
- Copy audit: no "legally binding", "pre-vetted", or "lawyer-vetted" anywhere on the page; disclaimer visible in the trust section.

- [ ] **Step 3: Final gates**

Run: `npm run lint` and `npx tsc --noEmit`
Expected: pass.
