import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support — FormalizeIt',
  description: 'Help with sending, signing, and managing your NDAs on FormalizeIt.',
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
