'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useState } from 'react'
import FloatingNavShell from './nav/FloatingNavShell'

interface PublicToolbarProps {
  onLinkClick?: (e: React.MouseEvent) => void;
}

// `core` links stay visible when the bar shrinks into the floating pill.
const links = [
  { name: 'Home', href: '/', core: false },
  { name: 'About', href: '/about', core: true },
  { name: 'Pricing', href: '/#pricing', core: true },
  { name: 'Contact', href: '/contact', core: false },
  { name: 'FAQ', href: '/faq', core: true },
  { name: 'Help', href: '/help', core: false },
]

export default function PublicToolbar({ onLinkClick }: PublicToolbarProps) {
  const { userId } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Don't show public toolbar if user is signed in
  if (userId) return null

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onLinkClick) {
      onLinkClick(e);
    }
    if (!e.defaultPrevented) {
      setIsMobileMenuOpen(false);
    }
  }

  return (
    <FloatingNavShell expanded={isMobileMenuOpen} scrolledMaxWidth="md:max-w-3xl">
      {(scrolled) => (
        <>
          <div
            className={`flex items-center justify-between transition-all duration-300 ease-out motion-reduce:transition-none ${
              scrolled ? 'h-13' : 'h-16'
            }`}
          >
            <div className="flex items-center">
              <Link href="/" className="shrink-0" onClick={onLinkClick} aria-label="FormalizeIt home">
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

              {/* Desktop navigation */}
              <div className={`hidden md:flex md:items-center md:gap-1 transition-all duration-300 ${scrolled ? 'md:ml-3' : 'md:ml-8'}`}>
                {links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={onLinkClick}
                    className={`items-center px-3.5 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-ink hover:bg-gray-100 transition-colors ${
                      scrolled && !link.core ? 'hidden' : 'inline-flex'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-2">
              <SignInButton mode="modal">
                <button
                  className={`items-center px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:text-ink hover:bg-gray-100 transition-colors cursor-pointer ${
                    scrolled ? 'hidden' : 'inline-flex'
                  }`}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white bg-teal-800 hover:bg-teal-700 shadow-card transition-colors cursor-pointer">
                  Get Started
                </button>
              </SignUpButton>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
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
            <div className="md:hidden border-t border-gray-100 pb-4">
              <div className="pt-2 pb-3 space-y-0.5">
                {links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-ink hover:bg-gray-100 transition-colors"
                    onClick={handleLinkClick}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-2 px-1">
                <SignInButton mode="modal">
                  <button
                    className="w-full flex items-center justify-center px-5 py-3 border border-gray-200 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="w-full flex items-center justify-center px-5 py-3 text-base font-semibold rounded-xl text-white bg-teal-800 hover:bg-teal-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </div>
          )}
        </>
      )}
    </FloatingNavShell>
  )
}
