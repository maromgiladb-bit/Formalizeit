'use client'

import { SignUp, useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      // User is already signed up and logged in, redirect to dashboard
      router.push('/dashboard')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-ink tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Send your first NDA in minutes — free
          </p>
        </div>
        <div className="bg-white py-8 px-6 rounded-2xl border border-gray-100 shadow-card">
          <SignUp
            routing="hash"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                footerAction: { display: 'none' },
                card: { boxShadow: 'none' }
              }
            }}
          />
        </div>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-teal-800 hover:text-teal-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
