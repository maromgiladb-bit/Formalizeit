'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Info, Sparkles } from 'lucide-react'

interface FieldTooltipProps {
  /** Plain-language explanation of the field. */
  text: string
  /** Optional: wire an "Ask Formi" action (opens the assistant with a question). */
  onAskFormi?: () => void
  /** Accessible label for the trigger; defaults to "More info". */
  label?: string
}

/**
 * Small ⓘ affordance next to a field label. Click to reveal a short explanation
 * and, when wired, an "Ask Formi" shortcut. Dismisses on outside click or Esc.
 * Design-system tokens only (teal-800 accent, gray body) — never amber.
 */
export function FieldTooltip({ text, onAskFormi, label = 'More info' }: FieldTooltipProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const popId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={wrapRef} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        className="inline-flex items-center justify-center text-gray-400 hover:text-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 rounded-full cursor-pointer"
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <span
          id={popId}
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-float"
        >
          <span className="block text-xs leading-relaxed text-gray-600">{text}</span>
          {onAskFormi && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onAskFormi()
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Formi
            </button>
          )}
        </span>
      )}
    </span>
  )
}
