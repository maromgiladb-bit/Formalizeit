'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SESSION_KEY = 'formalize-team-upgrade-banner-dismissed-session'
const PERMANENT_KEY = 'formalize-team-upgrade-banner-dismissed-permanent'

export default function TeamUpgradeBanner() {
    const [visible, setVisible] = useState(false)
    const [neverShow, setNeverShow] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (localStorage.getItem(PERMANENT_KEY) === 'true') return
        if (sessionStorage.getItem(SESSION_KEY) === 'true') return
        setVisible(true)
    }, [])

    const dismiss = () => {
        if (neverShow) localStorage.setItem(PERMANENT_KEY, 'true')
        sessionStorage.setItem(SESSION_KEY, 'true')
        setVisible(false)
    }

    const handleUpgrade = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/billing/upgrade-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billingCycle: 'monthly' }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
                return
            }
            window.location.href = '/settings/billing'
        } catch {
            window.location.href = '/settings/billing'
        } finally {
            setLoading(false)
        }
    }

    if (!visible) return null

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800">
                    <strong>Upgrade to Team to invite new members to work on your NDAs.</strong> Your
                    Pro plan supports a single user — add teammates to collaborate on drafts, review,
                    and signing.
                </p>
                <div className="flex items-center gap-4 mt-3">
                    <Button size="sm" onClick={handleUpgrade} disabled={loading}>
                        {loading ? 'Redirecting…' : 'Upgrade to Team'}
                    </Button>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={neverShow}
                            onChange={e => setNeverShow(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-amber-600 cursor-pointer"
                        />
                        <span className="text-xs text-amber-700">Don&apos;t show again</span>
                    </label>
                </div>
            </div>
            <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-amber-500 hover:text-amber-700 leading-none shrink-0 cursor-pointer mt-0.5"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
