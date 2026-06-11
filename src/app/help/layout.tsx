import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center — FormalizeIt',
  description: 'Step-by-step guides for creating NDAs, sending secure links, managing team roles, and billing on FormalizeIt.',
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
