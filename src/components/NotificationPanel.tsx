'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Bell, Clock, CheckCircle, XCircle, Send, AlertCircle, PenLine, Trophy } from 'lucide-react'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link: string | null
    draftId: string | null
    read: boolean
    createdAt: string
}

interface NotificationPanelProps {
    isOpen: boolean
    onClose: () => void
    onUnreadCountChange: (count: number) => void
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

function NotificationTypeIcon({ type }: { type: string }) {
    const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
    switch (type) {
        case 'NDA_APPROVAL_REQUESTED':
            return <div className={`${base} bg-amber-100`}><Clock className="w-4 h-4 text-amber-600" /></div>
        case 'NDA_APPROVAL_APPROVED':
            return <div className={`${base} bg-green-100`}><CheckCircle className="w-4 h-4 text-green-600" /></div>
        case 'NDA_APPROVAL_REJECTED':
            return <div className={`${base} bg-red-100`}><XCircle className="w-4 h-4 text-red-600" /></div>
        case 'NDA_SENT_TO_YOU':
            return <div className={`${base} bg-blue-100`}><Send className="w-4 h-4 text-blue-600" /></div>
        case 'NDA_CHANGES_REQUESTED':
            return <div className={`${base} bg-orange-100`}><AlertCircle className="w-4 h-4 text-orange-600" /></div>
        case 'NDA_SIGNED':
            return <div className={`${base} bg-teal-100`}><PenLine className="w-4 h-4 text-teal-600" /></div>
        case 'NDA_COMPLETED':
            return <div className={`${base} bg-teal-100`}><Trophy className="w-4 h-4 text-teal-600" /></div>
        default:
            return <div className={`${base} bg-gray-100`}><Bell className="w-4 h-4 text-gray-500" /></div>
    }
}

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications')
            if (!res.ok) return
            const data = await res.json()
            setNotifications(data.notifications ?? [])
            onUnreadCountChange(data.unreadCount ?? 0)
        } catch {
            // non-critical
        } finally {
            setLoading(false)
        }
    }, [onUnreadCountChange])

    useEffect(() => {
        if (!isOpen) {
            return
        }
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [isOpen, fetchNotifications])

    async function handleNotificationClick(n: Notification) {
        if (!n.read) {
            try {
                await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
                setNotifications(prev => {
                    const updated = prev.map(x => x.id === n.id ? { ...x, read: true } : x)
                    const unreadCount = updated.filter(x => !x.read).length
                    onUnreadCountChange(unreadCount)
                    return updated
                })
            } catch {
                // non-critical
            }
        }
        if (n.link) {
            router.push(n.link)
            onClose()
        }
    }

    async function handleMarkAllRead() {
        try {
            await fetch('/api/notifications/read-all', { method: 'POST' })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            onUnreadCountChange(0)
        } catch {
            // non-critical
        }
    }

    if (!isOpen) return null

    const unread = notifications.filter(n => !n.read)
    const read = notifications.filter(n => n.read)

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                {unread.length > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="py-10 text-center text-sm text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="py-10 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                ) : (
                    <>
                        {unread.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                                    Unread
                                </div>
                                {unread.map(n => (
                                    <NotificationItem key={n.id} n={n} onClick={handleNotificationClick} />
                                ))}
                            </div>
                        )}
                        {read.length > 0 && (
                            <div>
                                {unread.length > 0 && (
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                                        Earlier
                                    </div>
                                )}
                                {read.map(n => (
                                    <NotificationItem key={n.id} n={n} onClick={handleNotificationClick} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function NotificationItem({ n, onClick }: { n: Notification; onClick: (n: Notification) => void }) {
    return (
        <button
            onClick={() => onClick(n)}
            className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.read ? 'bg-teal-50/40' : ''}`}
        >
            <NotificationTypeIcon type={n.type} />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
            </div>
            {!n.read && (
                <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
        </button>
    )
}
