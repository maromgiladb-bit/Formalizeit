import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us — FormalizeIt',
  description: 'Questions about sending NDAs, billing, or your account? Get in touch and we will get back to you.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
