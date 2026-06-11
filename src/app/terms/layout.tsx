import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — FormalizeIt',
  description: 'Read the FormalizeIt Terms of Use. Covers acceptable use, account responsibilities, billing, and limitations of liability.',
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
