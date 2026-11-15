'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'

/*
 * Home hero document: the standard NDA with its seven variable blanks.
 * Server render and no-JS show the final state (all blanks filled). With
 * scripting on, the blanks empty before first paint and fill one by one
 * (60ms stagger, colour and background only) when the sheet scrolls into
 * view. It plays once. Reduced motion keeps the final state.
 */

const TOTAL = 7
const STAGGER_MS = 60
const START_DELAY_MS = 200

function Variable({ index, filled, children }: { index: number; filled: boolean; children: ReactNode }) {
  return (
    <span
      data-var={index}
      className={`border-b px-px transition-[color,background-color,border-color] duration-200 motion-reduce:transition-none ${
        filled
          ? 'border-teal-300 bg-teal-50 text-ink'
          : 'border-gray-400 bg-transparent text-transparent'
      }`}
    >
      {children}
    </span>
  )
}

export function HeroSheet() {
  const ref = useRef<HTMLDivElement>(null)
  // Number of blanks filled. Starts at TOTAL so server HTML is the final state.
  const [count, setCount] = useState(TOTAL)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (typeof IntersectionObserver === 'undefined') return

    setCount(0)

    const timers: number[] = []
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        for (let i = 1; i <= TOTAL; i++) {
          timers.push(window.setTimeout(() => setCount(i), START_DELAY_MS + i * STAGGER_MS))
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const f = (i: number) => count >= i

  return (
    <div ref={ref} className="w-full max-w-xl pb-3 pr-3 lg:mx-0">
      <Sheet
        className="overflow-hidden"
        meta={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Standard Mutual NDA v1.0
            </span>
            <span role="status" aria-live="off">
              Variables <b className="font-medium text-ink">{count}</b>/{TOTAL} · legal text unchanged
            </span>
          </div>
        }
      >
        <div className="relative max-h-[26rem] overflow-hidden px-5 pt-5 text-[14.5px] leading-[1.62] text-ink sm:px-9">
          <h3 className="font-display text-base font-semibold tracking-tight">Mutual Non-Disclosure Agreement</h3>
          <p className="mt-3">
            This Mutual Non-Disclosure Agreement is entered into as of <Variable index={1} filled={f(1)}>15 November 2026</Variable> between{' '}
            <Variable index={2} filled={f(2)}>Northwind Robotics Ltd</Variable> and <Variable index={3} filled={f(3)}>Brightline Labs Inc.</Variable> (each a &ldquo;Party&rdquo;).
          </p>
          <h4 className="mt-4 font-display text-sm font-semibold">1. Purpose</h4>
          <p className="mt-1">
            The Parties wish to exchange Confidential Information for the purpose of{' '}
            <Variable index={4} filled={f(4)}>evaluating a joint warehouse-automation pilot</Variable>.
          </p>
          <h4 className="mt-4 font-display text-sm font-semibold">2. Confidential Information</h4>
          <p className="mt-1">
            &ldquo;Confidential Information&rdquo; means non-public information disclosed by one Party to the other, in any form, that is marked confidential or that a reasonable person would understand to be confidential.
          </p>
          <h4 className="mt-4 font-display text-sm font-semibold">3. Term</h4>
          <p className="mt-1">
            This Agreement lasts <Variable index={5} filled={f(5)}>12 months</Variable> from the effective date. Each Party&rsquo;s duty of confidentiality continues for{' '}
            <Variable index={6} filled={f(6)}>24 months</Variable> after disclosure.
          </p>
          <h4 className="mt-4 font-display text-sm font-semibold">4. Governing law</h4>
          <p className="mt-1 pb-20">
            This Agreement is governed by the laws of the <Variable index={7} filled={f(7)}>State of Delaware</Variable>.
          </p>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-white/0 to-white" aria-hidden="true" />
        </div>
      </Sheet>
    </div>
  )
}
