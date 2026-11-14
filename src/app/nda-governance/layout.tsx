import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NDA Governance Policy — FormalizeIt',
  description: 'How the standard NDA is maintained, versioned, and changed, and what that means for agreements you have already signed.',
}

export default function NdaGovernanceLayout({ children }: { children: React.ReactNode }) {
  return children
}
