import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Standard NDA — FormalizeIt',
  description: 'Read the full text of the standard mutual NDA before you send or sign it. Same legal terms on every agreement.',
}

export default function StandardNdaLayout({ children }: { children: React.ReactNode }) {
  return children
}
