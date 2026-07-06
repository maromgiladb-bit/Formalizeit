'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Signer {
  id: string
  name: string
  email: string
}

interface NotifySignerModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Notify the selected signers. Should POST to /api/ndas/notify-signer and surface the
   * result banner in the parent. Throws on failure so the modal can show an inline error.
   */
  onConfirm: (selectedIds: string[]) => Promise<void>
}

export function NotifySignerModal({ isOpen, onClose, onConfirm }: NotifySignerModalProps) {
  const [signers, setSigners] = useState<Signer[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the signer list each time the modal opens; pre-check everyone (common case).
  useEffect(() => {
    if (!isOpen) return
    let active = true
    setLoading(true)
    setError(null)
    setSigners(null)
    fetch('/api/organization/signers')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load signers'))))
      .then((data: { signers: Signer[] }) => {
        if (!active) return
        setSigners(data.signers)
        setSelected(new Set(data.signers.map(s => s.id)))
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'Failed to load signers'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [isOpen])

  // While open, lock background scroll and let Escape dismiss (unless a request
  // is in flight, matching the backdrop click behavior).
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, busy, onClose])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm(Array.from(selected))
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to notify signers')
      setBusy(false)
    }
  }

  const hasSigners = !!signers && signers.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={busy ? undefined : onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
              exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
              role="dialog"
              aria-modal="true"
              aria-label="Ask a teammate to sign"
              className="pointer-events-auto relative bg-white border border-gray-100 rounded-2xl shadow-float max-w-md w-full p-6"
            >
              <button
                onClick={busy ? undefined : onClose}
                aria-label="Close"
                disabled={busy}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 focus-visible:ring-offset-2"
              >
                <X className="w-5 h-5" />
              </button>

              <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Ask a teammate to sign</p>
              <h3 className="text-lg font-semibold text-ink mb-1">Who should sign this NDA?</h3>
              <p className="text-sm text-gray-500 mb-5">
                Only approved signers can sign on behalf of your company. Choose who to notify — they&apos;ll get
                an email and an in-app notification.
              </p>

              {loading && <p className="text-sm text-gray-500 py-4">Loading signers…</p>}

              {!loading && !hasSigners && !error && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 mb-5">
                  <p className="text-sm text-gray-600">
                    No teammate on your team can sign yet. Ask an administrator to enable a signer.
                  </p>
                </div>
              )}

              {!loading && hasSigners && (
                <div className="space-y-1.5 mb-5 max-h-64 overflow-y-auto">
                  {signers!.map(s => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-800 focus:ring-teal-700/30 cursor-pointer"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink truncate">{s.name || s.email}</span>
                        {s.name && <span className="block text-xs text-gray-500 truncate">{s.email}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {error && <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                {hasSigners && (
                  <Button className="flex-1" onClick={handleConfirm} disabled={busy || selected.size === 0}>
                    <PenLine className="w-4 h-4" />
                    {busy ? 'Notifying…' : 'Notify selected'}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
