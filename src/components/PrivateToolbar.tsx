// Checked layout.tsx

import Link from 'next/link'
import Image from 'next/image'
import { useAuth, UserButton } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import OrgSwitcher from './OrgSwitcher'
import { InteractiveHoverButton } from './ui/interactive-hover-button'

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
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const devMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRefTablet = useRef<HTMLDivElement>(null)
  const devMenuRefTablet = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Fill NDA', href: '/templates', current: pathname === '/fillndahtml' || pathname === '/templates' },
    { name: 'My NDAs', href: '/mynda', current: pathname === '/mynda' },
  ]

  const router = useRouter()

  const primaryLinks = [
    { name: 'Settings', href: '/settings' },
    { name: 'Company Profile', href: '/companydetails' },
    { name: 'Plans', href: '/plans' },
  ]

  const secondaryLinks = [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Homepage', href: '/' },
  ]

  const devLinks = [
    { name: '✨ Fill NDA (Professional)', href: '/fillndahtml?templateId=professional_mutual_nda_v1' },
    { name: '🎨 Fill NDA (Design)', href: '/fillndahtml?templateId=design_mutual_nda_v1' },
    { name: '📥 Fill NDA Public (Party B)', href: '/fillndahtml-public/dev' },
    { name: '📄 Sign PDF', href: '/sign-nda' },
    { name: '✍️ Sign NDA (Dev)', href: '/sign-nda?draftId=test-draft-123' },
    { name: '🔓 Sign NDA Public (Dev)', href: '/sign-nda-public/00000000-0000-0000-0000-000000000001' },
    { name: '🏠 Homepage', href: '/' },
    { name: '📋 Templates', href: '/templates' },
  ]

  const isDev = process.env.NODE_ENV === 'development'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        moreMenuRef.current && !moreMenuRef.current.contains(target) &&
        moreMenuRefTablet.current && !moreMenuRefTablet.current.contains(target)
      ) {
        setIsMoreMenuOpen(false)
      }
      if (
        devMenuRef.current && !devMenuRef.current.contains(target) &&
        devMenuRefTablet.current && !devMenuRefTablet.current.contains(target)
      ) {
        setIsDevMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!userId) return null

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0">
              <div className="flex items-center">
                <Image
                  src="/formalizeIt-logo.png"
                  alt="FormalizeIt"
                  width={200}
                  height={50}
                  className="h-35 w-auto"
                  priority
                />
              </div>
            </Link>

            {/* Organization Switcher - Hidden by default for now as requested
            {organizationData && (
              <OrgSwitcher
                organizations={organizationData.organizations}
                activeOrgId={organizationData.activeOrgId}
              />
            )}
            */}

            {/* Desktop Navigation - Show first 4 items */}
            <div className="hidden xl:ml-8 xl:flex xl:items-center xl:space-x-1">
              {navigation.slice(0, 4).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${item.current
                    ? 'bg-[var(--teal-50)] text-[var(--teal-700)] shadow-sm'
                    : 'text-[var(--navy-700)] hover:text-[var(--teal-600)] hover:bg-[var(--teal-50)]'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${isMoreMenuOpen ? 'bg-[var(--teal-50)] text-[var(--teal-700)]' : 'text-[var(--navy-700)] hover:text-[var(--teal-600)] hover:bg-[var(--teal-50)]'
                    }`}
                >
                  More
                  <svg className={`ml-1 h-4 w-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="py-1">
                      {navigation.slice(4).map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-4 py-3 text-sm font-bold transition-all ${item.current
                            ? 'bg-[var(--teal-50)] text-[var(--teal-700)]'
                            : 'text-[var(--navy-700)] hover:bg-[var(--teal-50)] hover:text-[var(--teal-600)]'
                            }`}
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      {primaryLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-4 py-3 text-sm font-bold text-[var(--navy-700)] hover:bg-gray-50 hover:text-[var(--navy-900)] transition-all"
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                      <div className="border-t-2 border-gray-200 my-1"></div>
                      {secondaryLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-4 py-3 text-sm font-bold text-[var(--navy-700)] hover:bg-gray-50 hover:text-[var(--navy-900)] transition-all"
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dev Dropdown for desktop */}
              {isDev && (
                <div className="relative" ref={devMenuRef}>
                  <button
                    onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDevMenuOpen ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                  >
                    🔧 Dev
                    <svg className={`ml-1 h-4 w-4 transition-transform ${isDevMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDevMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border-2 border-purple-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="py-2 bg-gradient-to-r from-purple-50 to-purple-100">
                        <div className="px-4 py-2 text-xs font-bold text-purple-700 uppercase tracking-wide">
                          🔧 Development Tools
                        </div>
                      </div>
                      <div className="py-1">
                        {devLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className="block px-4 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-all"
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

            {/* Tablet/Small Desktop - Show first 3 items */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1 xl:hidden">
              {navigation.slice(0, 3).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${item.current
                    ? 'bg-[var(--teal-50)] text-[var(--teal-700)] shadow-sm'
                    : 'text-[var(--navy-700)] hover:text-[var(--teal-600)] hover:bg-[var(--teal-50)]'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* More Dropdown for tablet */}
              <div className="relative" ref={moreMenuRefTablet}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${isMoreMenuOpen ? 'bg-[var(--teal-50)] text-[var(--teal-700)]' : 'text-[var(--navy-700)] hover:text-[var(--teal-600)] hover:bg-[var(--teal-50)]'
                    }`}
                >
                  More
                  <svg className={`ml-1 h-4 w-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="py-1">
                      {navigation.slice(3).map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-4 py-3 text-sm font-bold transition-all ${item.current
                            ? 'bg-[var(--teal-50)] text-[var(--teal-700)]'
                            : 'text-[var(--navy-700)] hover:bg-[var(--teal-50)] hover:text-[var(--teal-600)]'
                            }`}
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t-2 border-gray-200 my-1"></div>
                      {secondaryLinks.map((link: { name: string; href: string }) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-4 py-3 text-sm font-bold text-[var(--navy-700)] hover:bg-gray-50 hover:text-[var(--navy-900)] transition-all"
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dev Dropdown for tablet */}
              {isDev && (
                <div className="relative" ref={devMenuRefTablet}>
                  <button
                    onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDevMenuOpen ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                  >
                    🔧 Dev
                    <svg className={`ml-1 h-4 w-4 transition-transform ${isDevMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDevMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border-2 border-purple-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="py-2 bg-gradient-to-r from-purple-50 to-purple-100">
                        <div className="px-4 py-2 text-xs font-bold text-purple-700 uppercase tracking-wide">
                          🔧 Development Tools
                        </div>
                      </div>
                      <div className="py-1">
                        {devLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className="block px-4 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-all"
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

          {/* Right side buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <InteractiveHoverButton
              text="New NDA"
              onClick={() => router.push('/templates')}
            />
            <UserButton afterSignOutUrl="/" />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 transition-all"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {
        isMobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-gray-200 bg-white shadow-xl">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${item.current
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t-2 border-gray-200 my-2"></div>
              {primaryLinks.map((link: { name: string; href: string }) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t-2 border-gray-200 my-2"></div>
              {secondaryLinks.map((link: { name: string; href: string }) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {isDev && (
                <>
                  <div className="border-t-2 border-gray-200 my-2"></div>
                  <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                    🔧 Dev Tools
                  </div>
                  {devLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block px-4 py-3 rounded-xl text-base font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
            <div className="pt-4 pb-4 border-t-2 border-gray-200">
              <div className="flex items-center px-4 mb-3">
                <UserButton afterSignOutUrl="/" />
                <span className="ml-3 text-sm font-semibold text-gray-700">Your Account</span>
              </div>
              <div className="px-4">
                <Link
                  href="/templates"
                  className="w-full flex items-center justify-center px-5 py-3 text-base font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New NDA
                </Link>
              </div>
            </div>
          </div>
        )
      }
    </nav>
  )
}
