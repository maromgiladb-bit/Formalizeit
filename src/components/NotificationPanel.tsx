'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCheck, Bell, Clock, CheckCircle, XCircle, Send, AlertCircle, PenLine, Trophy, ArrowRight } from 'lucide-react'

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
    const base = 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-white'
    switch (type) {
        case 'NDA_APPROVAL_REQUESTED':
            return <div className={`${base} bg-amber-50`}><Clock className="w-4 h-4 text-amber-600" /></div>
        case 'NDA_APPROVAL_APPROVED':
            return <div className={`${base} bg-emerald-50`}><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
        case 'NDA_APPROVAL_REJECTED':
            return <div className={`${base} bg-red-50`}><XCircle className="w-4 h-4 text-red-500" /></div>
        case 'NDA_SENT_TO_YOU':
            return <div className={`${base} bg-blue-50`}><Send className="w-4 h-4 text-blue-600" /></div>
        case 'NDA_CHANGES_REQUESTED':
            return <div className={`${base} bg-orange-50`}><AlertCircle className="w-4 h-4 text-orange-500" /></div>
        case 'NDA_SIGNED':
            return <div className={`${base} bg-teal-50`}><PenLine className="w-4 h-4 text-teal-700" /></div>
        case 'NDA_COMPLETED':
            return <div className={`${base} bg-teal-50`}><Trophy className="w-4 h-4 text-teal-700" /></div>
        default:
            return <div className={`${base} bg-gray-50`}><Bell className="w-4 h-4 text-gray-400" /></div>
    }
}

function SkeletonLoader() {
    return (
        <div className="px-4 py-3 space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-50 rounded w-full" />
                    </div>
                </div>
            ))}
        </div>
    )
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

    const unread = notifications.filter(n => !n.read)
    const read = notifications.filter(n => n.read)

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-2.5">
                            <span className="text-teal-700 text-xs font-bold uppercase tracking-widest">Notifications</span>
                            {unread.length > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-teal-700 rounded-full">
                                    {unread.length}
                                </span>
                            )}
                        </div>
                        {unread.length > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs font-semibold text-teal-700 px-2.5 py-1 rounded-lg hover:text-white hover:bg-teal-800 transition-all duration-200 cursor-pointer"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <SkeletonLoader />
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-6 h-6 text-teal-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700">You&apos;re all caught up</p>
                                <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                            </div>
                        ) : (
                            <>
                                {unread.length > 0 && (
                                    <div>
                                        <div className="px-5 py-2 text-teal-700 text-[10px] font-bold uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                                            Unread
                                        </div>
                                        {unread.map(n => (
                                            <NotificationItem key={n.id} n={n} onClick={handleNotificationClick} />
                                        ))}
                                    </div>
                                )}
                                {read.length > 0 && (
                                    <div>
                                        <div className="px-5 py-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                                            Earlier
                                        </div>
                                        {read.map(n => (
                                            <NotificationItem key={n.id} n={n} onClick={handleNotificationClick} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function NotificationItem({ n, onClick }: { n: Notification; onClick: (n: Notification) => void }) {
    return (
        <button
            onClick={() => onClick(n)}
            className={`group w-full text-left px-5 py-3.5 flex gap-3 items-start transition-all duration-200 border-b border-gray-100 last:border-0 cursor-pointer
                ${!n.read
                    ? 'bg-teal-50/30 border-l-2 border-l-teal-600 hover:bg-teal-50/60'
                    : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                }`}
        >
            <NotificationTypeIcon type={n.type} />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-tight ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                        {n.title}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
            </div>
            {n.link && (
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 group-hover:text-teal-600 transition-all duration-200" />
            )}
        </button>
    )
}
