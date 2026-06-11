import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — FormalizeIt',
  description: 'Answers to common questions about FormalizeIt: how it works, team roles, pricing, security, and more.',
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
