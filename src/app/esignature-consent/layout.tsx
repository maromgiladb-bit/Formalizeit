import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Electronic Signature Consent — FormalizeIt',
  description: 'What you agree to when you sign electronically, and the evidence FormalizeIt records with every signature.',
}

export default function ESignatureConsentLayout({ children }: { children: React.ReactNode }) {
  return children
}
