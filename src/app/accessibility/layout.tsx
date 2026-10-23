import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility — FormalizeIt',
  description: 'Our commitment to making FormalizeIt usable by everyone, and how to report an accessibility problem.',
}

export default function AccessibilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
