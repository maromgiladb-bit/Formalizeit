'use client'

import { UserProfile, useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function AccountSecurityPage() {
  const { isLoaded, userId } = useAuth()

  if (isLoaded && !userId) {
    redirect('/sign-in')
  }

  return (
    <motion.div
      className="space-y-6"
      variants={fadeUp}
      initial="initial"
      animate="animate"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sign-in &amp; Security</h3>
              <p className="text-sm text-gray-500">
                Manage your password, two-factor authentication, and active devices.
              </p>
            </div>
          </div>
        </div>

        <div className="px-2 py-2 sm:px-4 sm:py-4">
          {/*
            Clerk's <UserProfile /> exposes the "Security" tab (password, two-factor
            authentication, active devices) automatically once MFA is enabled in the
            Clerk Dashboard (User & Authentication → Multi-factor). No extra code is
            needed to surface 2FA enrollment — see docs/2fa-setup.md.
          */}
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none border-0',
                card: { boxShadow: 'none' },
                scrollBox: 'rounded-xl',
              },
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}
