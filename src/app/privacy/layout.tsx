import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — FormalizeIt',
  description: 'How FormalizeIt collects, stores, and protects your data. Covers NDA content, signatures, account info, and third-party services.',
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
