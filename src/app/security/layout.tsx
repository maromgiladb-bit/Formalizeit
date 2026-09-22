import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security — FormalizeIt',
  description: 'How FormalizeIt protects your NDAs: encrypted storage, signature evidence, audit trails, and two-factor sign-in.',
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children
}
