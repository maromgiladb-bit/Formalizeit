import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance — FormalizeIt',
  description: 'How FormalizeIt handles data retention, electronic signatures, and legal record-keeping.',
}

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return children
}
