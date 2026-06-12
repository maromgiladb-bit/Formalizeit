'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'

interface FloatingNavShellProps {
  /** Max width of the floating pill once scrolled (the full bar is always full-width). */
  scrolledMaxWidth?: string
  /** Set true while a mobile menu/sheet is open so the pill squares off to hold it. */
  expanded?: boolean
  children: (scrolled: boolean) => ReactNode
}

/**
 * Shared shell for the site toolbars: a full-width bar at the top of the
 * page that condenses into a centered floating pill once the user scrolls.
 * Two discrete states with CSS transitions — no per-frame style writes.
 */
export default function FloatingNavShell({
  scrolledMaxWidth = 'md:max-w-3xl',
  expanded = false,
  children,
}: FloatingNavShellProps) {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  // Hysteresis: engage past 32px, release under 8px, so the bar never
  // flickers when the page rests near the threshold.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled((prev) => (prev ? y > 8 : y > 32))
  })

  // Pages can load mid-scroll (anchor links, back navigation).
  useEffect(() => {
    setScrolled(window.scrollY > 32)
  }, [])

  const pill = scrolled
    ? `mt-2 sm:mt-3 max-w-[calc(100%-1.25rem)] ${scrolledMaxWidth} ${
        expanded ? 'rounded-2xl bg-white' : 'rounded-full bg-white/85 backdrop-blur-md'
      } border border-gray-200/70 shadow-float`
    : 'mt-0 max-w-full rounded-none border-b border-gray-100 bg-white'

  return (
    <>
      {/* Spacer: the bar is fixed, so this keeps page content from sliding under it. */}
      <div className="h-16" aria-hidden="true" />
      <header className="fixed inset-x-0 top-0 z-50">
        <div className={`mx-auto transition-all duration-300 ease-out motion-reduce:transition-none ${pill}`}>
          <div
            className={`mx-auto transition-all duration-300 ease-out motion-reduce:transition-none ${
              scrolled ? 'px-3 sm:px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'
            }`}
          >
            {children(scrolled)}
          </div>
        </div>
      </header>
    </>
  )
}
