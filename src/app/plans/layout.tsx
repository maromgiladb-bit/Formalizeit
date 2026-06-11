import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — FormalizeIt',
  description: 'Simple, honest pricing. Start free — no credit card, no setup. Upgrade when your team needs more NDAs or members.',
}

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return children
}
