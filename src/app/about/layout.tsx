import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — FormalizeIt',
  description:
    'Review once, reuse forever — one fair standard NDA you approve a single time, then reuse for every deal. Learn how FormalizeIt works.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
