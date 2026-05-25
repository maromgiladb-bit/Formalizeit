'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs'
import { useState } from 'react'

interface PublicToolbarProps {
  onLinkClick?: (e: React.MouseEvent) => void;
}

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
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="shrink-0" onClick={onLinkClick}>
              <div className="flex items-center">
                <Image
                  src="/formalizeIt-logo.png"
                  alt="FormalizeIt"
                  width={200}
                  height={50}
                  className="h-30 w-auto"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-2">
              <Link href="/" onClick={onLinkClick} className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 text-sm font-semibold transition-all duration-200">
                Home
              </Link>
              <Link href="/about" onClick={onLinkClick} className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 text-sm font-semibold transition-all duration-200">
                About
              </Link>
              <Link href="/plans" onClick={onLinkClick} className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 text-sm font-semibold transition-all duration-200">
                Plans
              </Link>
              <Link href="/contact" onClick={onLinkClick} className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 text-sm font-semibold transition-all duration-200">
                Contact
              </Link>
              <Link href="/faq" onClick={onLinkClick} className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 text-sm font-semibold transition-all duration-200">
                FAQ
              </Link>
              <Link href="/help" onClick={onLinkClick} className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 text-sm font-semibold transition-all duration-200">
                Help
              </Link>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <SignInButton mode="modal">
              <button className="inline-flex items-center px-5 py-2.5 border border-gray-200 text-sm font-semibold rounded-lg text-(--navy-700) bg-white hover:bg-gray-50 hover:border-gray-300 transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-(--teal-600) hover:bg-(--teal-700) transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Get Started →
              </button>
            </SignUpButton>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-700 transition-all"
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
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-gray-200 bg-white shadow-xl">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-white hover:bg-teal-800 transition-all duration-200"
              onClick={handleLinkClick}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-white hover:bg-teal-800 transition-all duration-200"
              onClick={handleLinkClick}
            >
              About
            </Link>
            <Link
              href="/plans"
              className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-white hover:bg-teal-800 transition-all duration-200"
              onClick={handleLinkClick}
            >
              Plans
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-white hover:bg-teal-800 transition-all duration-200"
              onClick={handleLinkClick}
            >
              Contact
            </Link>
            <Link
              href="/faq"
              className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-white hover:bg-teal-800 transition-all duration-200"
              onClick={handleLinkClick}
            >
              FAQ
            </Link>
            <Link
              href="/help"
              className="block px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-white hover:bg-teal-800 transition-all duration-200"
              onClick={handleLinkClick}
            >
              Help
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t-2 border-gray-200">
            <div className="px-4 space-y-2">
              <SignInButton mode="modal">
                <button
                  className="w-full flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="w-full flex items-center justify-center px-5 py-3 text-base font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started →
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
