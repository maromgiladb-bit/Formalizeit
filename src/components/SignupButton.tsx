'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { SignUpButton } from '@clerk/nextjs'
import { SIGNUP_OPEN } from '@/lib/featureFlags'
import { signupHref } from '@/lib/signupGate'

/**
 * Drop-in for Clerk's <SignUpButton mode="modal">. While sign-up is closed
 * (private beta) the Clerk modal must not open — it talks to Clerk directly
 * and would bypass the /signup middleware gate — so the child button routes
 * to the waitlist page instead.
 */
export default function SignupButton({ children }: { children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }> }) {
  const router = useRouter()
  if (SIGNUP_OPEN) return <SignUpButton mode="modal">{children}</SignUpButton>
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e)
      router.push(signupHref())
    },
  })
}
