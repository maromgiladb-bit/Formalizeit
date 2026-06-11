import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — FormalizeIt',
  description: 'Learn how FormalizeIt helps teams send NDAs faster — template-first workflow, secure e-signatures, and full audit trails.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
