'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth, UserButton } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

import FloatingNavShell from './nav/FloatingNavShell'
import { NotificationIcon } from './ui/notification-icon'
import NotificationPanel from './NotificationPanel'

interface OrganizationData {
  organizations: { id: string; name: string; slug: string }[]
  activeOrgId: string
}

export default function PrivateToolbar({ organizationData }: { organizationData?: OrganizationData | null }) {
  const { userId } = useAuth()
  const pathname = usePathname()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const devMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Fill NDA', href: '/templates', current: pathname === '/fillndahtml' || pathname === '/templates' },
    { name: 'Plans', href: '/#pricing', current: pathname === '/plans' },
  ]

  const router = useRouter()

  const primaryLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Settings', href: '/settings' },
    { name: 'Pricing', href: '/#pricing' },
  ]

  const secondaryLinks = [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Help', href: '/help' },
    { name: 'Homepage', href: '/' },
  ]

  const devLinks = [
    { name: '✨ Fill NDA (Professional)', href: '/fillndahtml?templateId=professional_mutual_nda_v1' },
    { name: '🎨 Fill NDA (Design)', href: '/fillndahtml?templateId=design_mutual_nda_v1' },
    { name: '📥 Fill NDA Public (Party B)', href: '/fillndahtml-public/dev' },
    { name: '📄 Sign PDF', href: '/sign-nda' },
    { name: '✍️ Sign NDA (Dev)', href: '/sign-nda?draftId=test-draft-123' },
    { name: '🔓 Sign NDA Public (Dev)', href: '/sign-nda-public/00000000-0000-0000-0000-000000000001' },
    { name: '📧 Email Templates', href: '/devemails' },
    { name: '📋 NDA Templates', href: '/devtemplates' },
    { name: '🏠 Homepage', href: '/' },
  ]

  const isDev = process.env.NODE_ENV === 'development'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false)
      }
      if (devMenuRef.current && !devMenuRef.current.contains(target)) {
        setIsDevMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch unread notification count on mount and poll every 30s
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        // Use a lightweight count-only endpoint to avoid fetching the full notifications list
        const res = await fetch('/api/notifications/count')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount ?? 0)
        }
      } catch {
        // non-critical
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!userId) return null

  const navLinkClass = (current: boolean) =>
    `inline-flex items-center px-3.5 py-2 rounded-full text-sm transition-colors ${
      current
        ? 'bg-teal-50 text-teal-800 font-semibold'
        : 'text-gray-600 hover:text-ink hover:bg-gray-100 font-medium'
    }`

  return (
    <FloatingNavShell expanded={isMobileMenuOpen} scrolledMaxWidth="lg:max-w-4xl">
      {(scrolled) => (
        <>
          <div
            className={`relative flex items-center justify-between transition-all duration-300 ease-out motion-reduce:transition-none ${
              scrolled ? 'h-13' : 'h-16'
            }`}
          >
            <div className="flex items-center min-w-0">
              <Link href="/dashboard" className="shrink-0" aria-label="Dashboard">
                <Image
                  src="/formalizeIt-logo.png"
                  alt="FormalizeIt"
                  width={200}
                  height={50}
                  className={`w-auto transition-all duration-300 ease-out motion-reduce:transition-none ${
                    scrolled ? 'h-20' : 'h-28'
                  }`}
                  priority
                />
              </Link>

              {/* Desktop navigation — centered in the bar */}
              <div className="hidden lg:flex lg:items-center lg:gap-1 absolute left-1/2 -translate-x-1/2">

                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} className={navLinkClass(item.current)}>
                    {item.name}
                  </Link>
                ))}

                {/* More dropdown — folds away in the floating pill */}
                <div className={`relative ${scrolled ? 'hidden' : ''}`} ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                      isMoreMenuOpen ? 'bg-gray-100 text-ink' : 'text-gray-600 hover:text-ink hover:bg-gray-100'
                    }`}
                  >
                    More
                    <svg className={`ml-1 h-4 w-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-float z-50 overflow-hidden">
                      <div className="py-1.5">
                        {primaryLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-ink transition-colors"
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                            {link.name}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 my-1.5"></div>
                        {secondaryLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-ink transition-colors"
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dev dropdown */}
                {isDev && (
                  <div className={`relative ${scrolled ? 'hidden' : ''}`} ref={devMenuRef}>
                    <button
                      onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                      className={`inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                        isDevMenuOpen ? 'bg-purple-50 text-purple-700' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      🔧 Dev
                      <svg className={`ml-1 h-4 w-4 transition-transform ${isDevMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isDevMenuOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-purple-100 rounded-2xl shadow-float z-50 overflow-hidden">
                        <div className="px-4 py-2.5 text-xs font-bold text-purple-700 uppercase tracking-wide bg-purple-50">
                          Development Tools
                        </div>
                        <div className="py-1">
                          {devLinks.map((link) => (
                            <Link
                              key={link.name}
                              href={link.href}
                              className="block px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                              onClick={() => setIsDevMenuOpen(false)}
                            >
                              {link.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side — desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setIsNotifOpen(prev => !prev)}
                  className="p-2 text-gray-500 hover:text-ink transition-colors rounded-full hover:bg-gray-100 flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <NotificationIcon size={22} active={unreadCount > 0} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel
                  isOpen={isNotifOpen}
                  onClose={() => setIsNotifOpen(false)}
                  onUnreadCountChange={setUnreadCount}
                />
              </div>
              <button
                onClick={() => router.push('/templates')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-teal-800 hover:bg-teal-700 shadow-card transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                New NDA
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-ink hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 transition-colors"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 pb-4">
              <div className="pt-2 pb-3 space-y-0.5">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3 rounded-xl text-base transition-colors ${
                      item.current
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-gray-700 hover:text-ink hover:bg-gray-100 font-medium'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-gray-100 my-2"></div>
                {[...primaryLinks, ...secondaryLinks].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-ink hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                {isDev && (
                  <>
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="px-4 py-2 text-xs font-bold text-purple-700 uppercase tracking-wide">
                      🔧 Dev Tools
                    </div>
                    {devLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="block px-4 py-3 rounded-xl text-base font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center px-4 mb-3">
                  <UserButton afterSignOutUrl="/" />
                  <span className="ml-3 text-sm font-medium text-gray-700">Your Account</span>
                </div>
                <div className="px-1">
                  <Link
                    href="/templates"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold rounded-xl text-white bg-teal-800 hover:bg-teal-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5" />
                    New NDA
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </FloatingNavShell>
  )
}
